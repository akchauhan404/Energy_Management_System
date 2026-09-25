-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy_data_uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL DEFAULT 'text/csv',
    "record_count" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "sampling_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'VALIDATED',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_data_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_energy_records" (
    "id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "energy_kwh" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_energy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "total_records" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_uploads" (
    "id" TEXT NOT NULL,
    "dataset_version_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,

    CONSTRAINT "dataset_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_training_runs" (
    "id" TEXT NOT NULL,
    "dataset_version_id" TEXT,
    "previous_model_id" TEXT,
    "new_model_id" TEXT,
    "model_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "mae" DOUBLE PRECISION,
    "rmse" DOUBLE PRECISION,
    "mape" DOUBLE PRECISION,
    "r2" DOUBLE PRECISION,

    CONSTRAINT "model_training_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_model_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Transformer-24h',
    "version" TEXT NOT NULL,
    "architecture" TEXT NOT NULL DEFAULT 'Horizon-Specific Multi-Scale Transformer',
    "artifact_path" TEXT NOT NULL,
    "lookback" INTEGER NOT NULL DEFAULT 48,
    "horizon" INTEGER NOT NULL DEFAULT 48,
    "sampling_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppo_model_versions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'PPO-Energy-Optimizer',
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'Stable-Baselines3 PPO',
    "policy" TEXT NOT NULL DEFAULT 'MlpPolicy',
    "artifact_path" TEXT NOT NULL,
    "horizon" INTEGER NOT NULL DEFAULT 48,
    "sampling_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppo_model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecasts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "horizon" INTEGER NOT NULL DEFAULT 48,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_points" (
    "id" TEXT NOT NULL,
    "forecast_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "predicted_energy_kwh" DOUBLE PRECISION NOT NULL,
    "step_index" INTEGER NOT NULL,

    CONSTRAINT "forecast_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_explanations" (
    "id" TEXT NOT NULL,
    "forecast_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL,
    "direction" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "forecast_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "forecast_id" TEXT NOT NULL,
    "ppo_model_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "optimization_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_steps" (
    "id" TEXT NOT NULL,
    "optimization_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "step_index" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "battery_soc" DOUBLE PRECISION NOT NULL,
    "grid_energy_kwh" DOUBLE PRECISION NOT NULL,
    "electricity_cost" DOUBLE PRECISION NOT NULL,
    "peak_demand_kw" DOUBLE PRECISION NOT NULL,
    "solar_generation_kwh" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "solar_used_kwh" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "optimization_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_summaries" (
    "id" TEXT NOT NULL,
    "optimization_id" TEXT NOT NULL,
    "baseline_grid_energy" DOUBLE PRECISION NOT NULL,
    "optimized_grid_energy" DOUBLE PRECISION NOT NULL,
    "baseline_cost" DOUBLE PRECISION NOT NULL,
    "optimized_cost" DOUBLE PRECISION NOT NULL,
    "baseline_peak_demand" DOUBLE PRECISION NOT NULL,
    "optimized_peak_demand" DOUBLE PRECISION NOT NULL,
    "renewable_utilization" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "constraint_violations" INTEGER NOT NULL DEFAULT 0,
    "reward" DOUBLE PRECISION,

    CONSTRAINT "optimization_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_explanations" (
    "id" TEXT NOT NULL,
    "optimization_step_id" TEXT NOT NULL,
    "forecast_demand" DOUBLE PRECISION NOT NULL,
    "tariff" DOUBLE PRECISION NOT NULL,
    "battery_soc" DOUBLE PRECISION NOT NULL,
    "peak_risk" TEXT NOT NULL,
    "selected_action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "optimization_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_performance" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "dataset_id" TEXT,
    "evaluation_type" TEXT NOT NULL,
    "mae" DOUBLE PRECISION NOT NULL,
    "rmse" DOUBLE PRECISION NOT NULL,
    "mape" DOUBLE PRECISION NOT NULL,
    "smape" DOUBLE PRECISION NOT NULL,
    "r2" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "historical_energy_records_user_id_timestamp_idx" ON "historical_energy_records"("user_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "dataset_versions_version_key" ON "dataset_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "dataset_uploads_dataset_version_id_upload_id_key" ON "dataset_uploads"("dataset_version_id", "upload_id");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_model_versions_version_key" ON "forecast_model_versions"("version");

-- CreateIndex
CREATE UNIQUE INDEX "ppo_model_versions_version_key" ON "ppo_model_versions"("version");

-- CreateIndex
CREATE INDEX "forecast_points_forecast_id_step_index_idx" ON "forecast_points"("forecast_id", "step_index");

-- CreateIndex
CREATE INDEX "optimization_steps_optimization_id_step_index_idx" ON "optimization_steps"("optimization_id", "step_index");

-- CreateIndex
CREATE UNIQUE INDEX "optimization_summaries_optimization_id_key" ON "optimization_summaries"("optimization_id");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_data_uploads" ADD CONSTRAINT "energy_data_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_energy_records" ADD CONSTRAINT "historical_energy_records_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "energy_data_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_energy_records" ADD CONSTRAINT "historical_energy_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_uploads" ADD CONSTRAINT "dataset_uploads_dataset_version_id_fkey" FOREIGN KEY ("dataset_version_id") REFERENCES "dataset_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_uploads" ADD CONSTRAINT "dataset_uploads_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "energy_data_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_training_runs" ADD CONSTRAINT "model_training_runs_dataset_version_id_fkey" FOREIGN KEY ("dataset_version_id") REFERENCES "dataset_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "forecast_model_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_points" ADD CONSTRAINT "forecast_points_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "forecasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_explanations" ADD CONSTRAINT "forecast_explanations_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "forecasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_forecast_id_fkey" FOREIGN KEY ("forecast_id") REFERENCES "forecasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_runs" ADD CONSTRAINT "optimization_runs_ppo_model_id_fkey" FOREIGN KEY ("ppo_model_id") REFERENCES "ppo_model_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_steps" ADD CONSTRAINT "optimization_steps_optimization_id_fkey" FOREIGN KEY ("optimization_id") REFERENCES "optimization_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_summaries" ADD CONSTRAINT "optimization_summaries_optimization_id_fkey" FOREIGN KEY ("optimization_id") REFERENCES "optimization_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_explanations" ADD CONSTRAINT "optimization_explanations_optimization_step_id_fkey" FOREIGN KEY ("optimization_step_id") REFERENCES "optimization_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
