-- AlterTable
ALTER TABLE "optimization_explanations" ADD COLUMN     "xai_attributions" JSONB,
ADD COLUMN     "xai_baseline" TEXT,
ADD COLUMN     "xai_convergence" JSONB,
ADD COLUMN     "xai_method" TEXT,
ADD COLUMN     "xai_steps" INTEGER;
