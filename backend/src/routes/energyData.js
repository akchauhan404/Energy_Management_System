import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import csv from 'csv-parser';

import { authMiddleware } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv');

    if (!isCsv) {
      const error = new Error('Only CSV files are allowed');
      error.statusCode = 400;
      error.code = 'INVALID_FILE_TYPE';
      return cb(error);
    }

    cb(null, true);
  }
});

/**
 * Parse uploaded CSV buffer using the existing csv-parser dependency.
 */
const parseCsvBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    const stream = Readable.from([buffer]);

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header
              .replace(/^\uFEFF/, '')
              .trim()
              .toLowerCase()
        })
      )
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * GET /api/energy-data
 *
 * Returns uploads belonging only to the authenticated user.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const uploads = await prisma.energyDataUpload.findMany({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        uploaded_at: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      uploads
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/energy-data/latest-records
 *
 * Returns the latest 336 records belonging to the authenticated user.
 */
router.get(
  '/latest-records',
  authMiddleware,
  async (req, res, next) => {
    try {
      const records = await prisma.historicalEnergyRecord.findMany({
        where: {
          user_id: req.user.id
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 336
      });

      records.reverse();

      return res.status(200).json({
        success: true,
        records
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/energy-data/upload
 *
 * Upload and validate a 30-minute interval energy CSV.
 *
 * Required columns:
 *   timestamp
 *   energy_kwh
 */
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_REQUIRED',
            message: 'No CSV file was uploaded'
          }
        });
      }

      let rows;

      try {
        rows = await parseCsvBuffer(req.file.buffer);
      } catch (error) {
        error.statusCode = 400;
        error.code = 'INVALID_CSV';
        error.message = `Invalid CSV format: ${error.message}`;

        return next(error);
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMPTY_CSV',
            message: 'CSV file is empty or contains no data rows'
          }
        });
      }

      const firstRow = rows[0];

      if (
        !Object.prototype.hasOwnProperty.call(firstRow, 'timestamp') ||
        !Object.prototype.hasOwnProperty.call(firstRow, 'energy_kwh')
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CSV_COLUMNS',
            message:
              "CSV must contain 'timestamp' and 'energy_kwh' columns"
          }
        });
      }

      const validRecords = [];
      const timestampSet = new Set();

      let duplicatesDetected = 0;
      let invalidTimestamps = 0;
      let invalidValues = 0;

      for (const row of rows) {
        const rawTimestamp = row.timestamp;
        const rawEnergy = row.energy_kwh;

        const timestamp = new Date(rawTimestamp);
        const energyValue = Number(rawEnergy);

        if (Number.isNaN(timestamp.getTime())) {
          invalidTimestamps++;
          continue;
        }

        if (!Number.isFinite(energyValue) || energyValue < 0) {
          invalidValues++;
          continue;
        }

        const timestampKey = timestamp.toISOString();

        if (timestampSet.has(timestampKey)) {
          duplicatesDetected++;
          continue;
        }

        timestampSet.add(timestampKey);

        validRecords.push({
          timestamp,
          energy_kwh: energyValue
        });
      }

      if (validRecords.length < 48) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_HISTORY',
            message:
              `Insufficient time-series history: Found ${validRecords.length} valid records. ` +
              'Minimum 48 half-hour intervals are required.'
          },
          validation: {
            totalRows: rows.length,
            validRecords: validRecords.length,
            duplicatesDetected,
            invalidTimestamps,
            invalidValues
          }
        });
      }

      validRecords.sort(
        (a, b) =>
          a.timestamp.getTime() - b.timestamp.getTime()
      );

      /**
       * Verify that the uploaded data is actually sampled
       * every 30 minutes.
       */
      let irregularIntervals = 0;

      for (let i = 1; i < validRecords.length; i++) {
        const differenceMinutes =
          (validRecords[i].timestamp.getTime() -
            validRecords[i - 1].timestamp.getTime()) /
          (1000 * 60);

        if (differenceMinutes !== 30) {
          irregularIntervals++;
        }
      }

      if (irregularIntervals > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SAMPLING_INTERVAL',
            message:
              'Invalid sampling interval. Energy data must contain continuous 30-minute intervals.'
          },
          validation: {
            totalRows: rows.length,
            validRecords: validRecords.length,
            duplicatesDetected,
            invalidTimestamps,
            invalidValues,
            irregularIntervals
          }
        });
      }

      const startDate = validRecords[0].timestamp;
      const endDate =
        validRecords[validRecords.length - 1].timestamp;

      /**
       * Store upload metadata and all historical records
       * atomically.
       *
       * If any database operation fails, neither the upload
       * nor its records are committed.
       */
      const savedUpload = await prisma.$transaction(
        async (tx) => {
          const newUpload =
            await tx.energyDataUpload.create({
              data: {
                user_id: req.user.id,
                file_name: req.file.originalname,
                file_type:
                  req.file.mimetype || 'text/csv',
                record_count: validRecords.length,
                start_date: startDate,
                end_date: endDate,
                sampling_interval_minutes: 30,
                status: 'VALIDATED'
              }
            });

          await tx.historicalEnergyRecord.createMany({
            data: validRecords.map((record) => ({
              upload_id: newUpload.id,
              user_id: req.user.id,
              timestamp: record.timestamp,
              energy_kwh: record.energy_kwh
            }))
          });

          return newUpload;
        }
      );

      return res.status(201).json({
        success: true,
        upload: savedUpload,
        validation: {
          totalRows: rows.length,
          validRecords: validRecords.length,
          duplicatesDetected,
          invalidTimestamps,
          invalidValues,
          irregularIntervals
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/energy-data/:id
 *
 * Deletes an upload only if it belongs to the authenticated user.
 *
 * Historical records are deleted automatically because the
 * Prisma relation uses onDelete: Cascade.
 */
router.delete(
  '/:id',
  authMiddleware,
  async (req, res, next) => {
    try {
      const uploadRecord =
        await prisma.energyDataUpload.findFirst({
          where: {
            id: req.params.id,
            user_id: req.user.id
          }
        });

      if (!uploadRecord) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'UPLOAD_NOT_FOUND',
            message: 'Energy data upload not found'
          }
        });
      }

      await prisma.energyDataUpload.delete({
        where: {
          id: uploadRecord.id
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Upload deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;