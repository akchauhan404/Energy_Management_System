import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

/*
 * Create a logical dataset version from validated uploads.
 *
 * Body:
 * {
 *   "version": "v1",
 *   "description": "Initial energy dataset",
 *   "upload_ids": ["upload-id-1", "upload-id-2"]
 * }
 */
router.post('/versions', authMiddleware, async (req, res, next) => {
  try {
    const { version, description, upload_ids } = req.body;

    if (
      typeof version !== 'string' ||
      version.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VERSION_REQUIRED',
          message: 'Dataset version is required'
        }
      });
    }

    if (
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DESCRIPTION_REQUIRED',
          message: 'Dataset description is required'
        }
      });
    }

    if (
      !Array.isArray(upload_ids) ||
      upload_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_IDS_REQUIRED',
          message:
            'At least one validated upload must be selected'
        }
      });
    }

    const uniqueUploadIds = [...new Set(upload_ids)];

    if (uniqueUploadIds.length !== upload_ids.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_UPLOAD_IDS',
          message: 'Duplicate upload IDs are not allowed'
        }
      });
    }

    /*
     * Dataset version names are globally unique according
     * to the Prisma schema.
     */
    const existingVersion =
      await prisma.datasetVersion.findUnique({
        where: {
          version: version.trim()
        }
      });

    if (existingVersion) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'VERSION_ALREADY_EXISTS',
          message:
            `Dataset version '${version.trim()}' already exists`
        }
      });
    }

    /*
     * Fetch only uploads belonging to the authenticated user.
     */
    const uploads =
      await prisma.energyDataUpload.findMany({
        where: {
          id: {
            in: uniqueUploadIds
          },
          user_id: req.user.id
        },
        orderBy: {
          start_date: 'asc'
        }
      });

    if (uploads.length !== uniqueUploadIds.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'UPLOAD_NOT_FOUND',
          message:
            'One or more selected uploads were not found for the authenticated user'
        }
      });
    }

    /*
     * Only validated 30-minute energy uploads can become
     * part of a dataset version.
     */
    const invalidUploads = uploads.filter(
      (upload) =>
        upload.status !== 'VALIDATED' ||
        upload.sampling_interval_minutes !== 30
    );

    if (invalidUploads.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UPLOADS',
          message:
            'All selected uploads must be VALIDATED and use a 30-minute sampling interval'
        },
        upload_ids: invalidUploads.map(
          (upload) => upload.id
        )
      });
    }

    /*
     * Reject overlapping time ranges.
     *
     * This prevents the logical dataset from containing
     * duplicate time periods through different uploads.
     */
    for (let i = 1; i < uploads.length; i++) {
      const previous = uploads[i - 1];
      const current = uploads[i];

      if (
        current.start_date.getTime() <=
        previous.end_date.getTime()
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'OVERLAPPING_UPLOADS',
            message:
              'Selected uploads contain overlapping time ranges'
          },
          conflicting_uploads: [
            previous.id,
            current.id
          ]
        });
      }
    }

    /*
     * Calculate dataset metadata from the actual uploads.
     * The client cannot manipulate these values.
     */
    const totalRecords = uploads.reduce(
      (total, upload) =>
        total + upload.record_count,
      0
    );

    const startDate = uploads[0].start_date;

    const endDate =
      uploads[uploads.length - 1].end_date;

    /*
     * Create the dataset version and its upload mappings
     * atomically.
     */
    const datasetVersion =
      await prisma.$transaction(async (tx) => {
        const createdVersion =
          await tx.datasetVersion.create({
            data: {
              version: version.trim(),
              description: description.trim(),
              total_records: totalRecords,
              start_date: startDate,
              end_date: endDate,
              status: 'ACTIVE'
            }
          });

        await tx.datasetUpload.createMany({
          data: uniqueUploadIds.map((uploadId) => ({
            dataset_version_id: createdVersion.id,
            upload_id: uploadId
          }))
        });

        return tx.datasetVersion.findUnique({
          where: {
            id: createdVersion.id
          },
          include: {
            dataset_uploads: {
              include: {
                upload: true
              }
            }
          }
        });
      });

    return res.status(201).json({
      success: true,
      dataset_version: datasetVersion
    });
  } catch (error) {
    next(error);
  }
});

/*
 * List dataset versions accessible to the authenticated user.
 */
router.get(
  '/versions',
  authMiddleware,
  async (req, res, next) => {
    try {
      const versions =
        await prisma.datasetVersion.findMany({
          where: {
            dataset_uploads: {
              some: {
                upload: {
                  user_id: req.user.id
                }
              }
            }
          },
          include: {
            dataset_uploads: {
              include: {
                upload: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        });

      return res.status(200).json({
        success: true,
        versions
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
 * Get one dataset version.
 */
router.get(
  '/versions/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      const datasetVersion =
        await prisma.datasetVersion.findFirst({
          where: {
            id: req.params.id,
            dataset_uploads: {
              some: {
                upload: {
                  user_id: req.user.id
                }
              }
            }
          },
          include: {
            dataset_uploads: {
              include: {
                upload: true
              }
            }
          }
        });

      if (!datasetVersion) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'DATASET_VERSION_NOT_FOUND',
            message: 'Dataset version not found'
          }
        });
      }

      return res.status(200).json({
        success: true,
        dataset_version: datasetVersion
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;