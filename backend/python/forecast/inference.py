"""
Horizon-Specific Multi-Scale Transformer Inference Module

Production inference contract:
- Input features: 15
- Lookback: 48 steps
- Horizon: 48 steps
- Sampling interval: 30 minutes
- Forecast horizon: 24 hours

The model artifact, scaler, and feature-engineering configuration
are loaded from backend/ml/artifacts/forecast/.
"""

import json
import sys
import warnings
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import torch
import torch.nn as nn


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

FEATURE_COLUMNS = [
    "energy_kwh",
    "hour_sin",
    "hour_cos",
    "dow_sin",
    "dow_cos",
    "month_sin",
    "month_cos",
    "lag_1",
    "lag_2",
    "lag_4",
    "lag_48",
    "rolling_mean_2",
    "rolling_mean_4",
    "rolling_mean_48",
    "rolling_max_48",
]

FEATURE_COUNT = 15
LOOKBACK_STEPS = 48
HORIZON_STEPS = 48
SAMPLING_INTERVAL_MINUTES = 30

PATCH_SIZES = [4, 8, 16]
D_MODEL = 128
N_HEADS = 4
NUM_LAYERS = 3
FFN_DIM = 512
DROPOUT = 0.1


# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------

BACKEND_ROOT = Path(__file__).resolve().parents[2]


ARTIFACT_DIR = (
    BACKEND_ROOT
    / "ml"
    / "artifacts"
    / "forecast"
)

MODEL_PATH = ARTIFACT_DIR / "horizon_specific_multiscale_24h.pth"
SCALER_PATH = ARTIFACT_DIR / "feature_scaler.pkl"


# ---------------------------------------------------------------------
# Transformer architecture
# ---------------------------------------------------------------------

class PatchEmbedding(nn.Module):
    """
    Converts a flattened temporal patch into the Transformer
    embedding dimension.
    """

    def __init__(self, patch_size):
        super().__init__()

        self.projection = nn.Linear(
            patch_size * FEATURE_COUNT,
            D_MODEL
        )


class MultiScaleBlock(nn.Module):
    """
    One temporal scale of the multi-scale Transformer.
    """

    def __init__(self, patch_size):
        super().__init__()

        self.patch_embedding = PatchEmbedding(
            patch_size
        )

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=D_MODEL,
            nhead=N_HEADS,
            dim_feedforward=FFN_DIM,
            dropout=DROPOUT,
            activation="gelu",
            batch_first=True
        )

        self.encoder = nn.TransformerEncoder(
            encoder_layer,
            num_layers=NUM_LAYERS
        )

        self.norm = nn.LayerNorm(D_MODEL)


class HorizonSpecificMultiScaleTransformer(nn.Module):
    """
    Reconstructed architecture matching the trained checkpoint.

    Three temporal patch scales:
        4 steps
        8 steps
        16 steps

    Their encoded representations are mean-fused, normalized,
    and passed through 48 horizon-specific prediction heads.
    """

    def __init__(self):
        super().__init__()

        self.scales = nn.ModuleList(
            [
                MultiScaleBlock(patch_size)
                for patch_size in PATCH_SIZES
            ]
        )

        self.fusion_norm = nn.LayerNorm(
            D_MODEL
        )

        self.horizon_heads = nn.ModuleList(
            [
                nn.Linear(D_MODEL, 1)
                for _ in range(HORIZON_STEPS)
            ]
        )

    def forward(self, x):
        """
        x shape:
            (batch, 48, 15)

        returns:
            (batch, 48)
        """

        scale_outputs = []

        for patch_size, scale in zip(
            PATCH_SIZES,
            self.scales
        ):
            batch_size = x.size(0)

            patch_count = (
                x.size(1) // patch_size
            )

            usable_steps = (
                patch_count * patch_size
            )

            patches = x[
                :, :usable_steps, :
            ]

            patches = patches.reshape(
                batch_size,
                patch_count,
                patch_size * FEATURE_COUNT
            )

            embedded = (
                scale.patch_embedding.projection(
                    patches
                )
            )

            encoded = scale.encoder(
                embedded
            )

            encoded = scale.norm(
                encoded
            )

            # Mean pooling over patches.
            pooled = encoded.mean(
                dim=1
            )

            scale_outputs.append(
                pooled
            )

        # Simple mean fusion across the three scales.
        fused = torch.stack(
            scale_outputs,
            dim=0
        ).mean(dim=0)

        fused = self.fusion_norm(
            fused
        )

        horizon_outputs = [
            head(fused)
            for head in self.horizon_heads
        ]

        return torch.cat(
            horizon_outputs,
            dim=1
        )


# ---------------------------------------------------------------------
# Artifact loading
# ---------------------------------------------------------------------

_model = None
_scaler = None


def load_artifacts():
    """
    Load the trained Transformer and StandardScaler once.
    """

    global _model
    global _scaler

    if _model is None:

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Transformer model artifact not found: "
                f"{MODEL_PATH}"
            )

        model = (
            HorizonSpecificMultiScaleTransformer()
        )

        state_dict = torch.load(
            MODEL_PATH,
            map_location="cpu",
            weights_only=True
        )

        model.load_state_dict(
            state_dict,
            strict=True
        )

        model.eval()

        _model = model

    if _scaler is None:

        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Feature scaler not found: "
                f"{SCALER_PATH}"
            )

        with warnings.catch_warnings():
            warnings.simplefilter(
                "ignore"
            )

            _scaler = joblib.load(
                SCALER_PATH
            )

    return _model, _scaler


# ---------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------

def build_feature_rows(history_records):
    """
    Build the exact 15 model features.

    history_records:
        [
            {
                "timestamp": "...",
                "energy_kwh": 123.4
            },
            ...
        ]

    Records must be chronological.
    """

    if not isinstance(
        history_records,
        list
    ):
        raise ValueError(
            "history_records must be a list"
        )

    if len(history_records) < 96:
        raise ValueError(
            "At least 96 historical records are "
            "required to construct the 48-step "
            "lookback with lag_48 and rolling "
            "features."
        )

    rows = []

    for record in history_records:

        if (
            "timestamp" not in record
            or "energy_kwh" not in record
        ):
            raise ValueError(
                "Each history record must contain "
                "'timestamp' and 'energy_kwh'."
            )

        rows.append(
            {
                "timestamp": record["timestamp"],
                "energy_kwh": float(
                    record["energy_kwh"]
                )
            }
        )

    rows.sort(
        key=lambda row: row["timestamp"]
    )

    values = np.array(
        [
            row["energy_kwh"]
            for row in rows
        ],
        dtype=np.float64
    )

    timestamps = [
        np.datetime64(
            row["timestamp"],
            "m"
        )
        for row in rows
    ]

    feature_rows = []

    for i in range(len(rows)):

        timestamp = timestamps[i]

        # Convert timestamp to Python-like calendar values
        timestamp_str = str(timestamp)

        date_part, time_part = (
            timestamp_str.split("T")
        )

        year, month, day = map(
            int,
            date_part.split("-")
        )

        hour, minute = map(
            int,
            time_part.split(":")[:2]
        )

        # Python datetime-like weekday calculation
        weekday = datetime(
            year,
            month,
            day
        ).weekday()
        # Cyclic temporal features
        hour_decimal = (
            hour
            + minute / 60.0
        )

        hour_angle = (
            2.0
            * np.pi
            * hour_decimal
            / 24.0
        )

        dow_angle = (
            2.0
            * np.pi
            * weekday
            / 7.0
        )

        month_angle = (
            2.0
            * np.pi
            * (month - 1)
            / 12.0
        )

        # Historical lag features
        lag_1 = values[i - 1] if i >= 1 else np.nan
        lag_2 = values[i - 2] if i >= 2 else np.nan
        lag_4 = values[i - 4] if i >= 4 else np.nan
        lag_48 = values[i - 48] if i >= 48 else np.nan

        # Past-values-only rolling features.
        # The current value is excluded.
        previous_values = (
            values[:i]
        )

        if len(previous_values) >= 2:
            rolling_mean_2 = np.mean(
                previous_values[-2:]
            )
        else:
            rolling_mean_2 = np.nan

        if len(previous_values) >= 4:
            rolling_mean_4 = np.mean(
                previous_values[-4:]
            )
        else:
            rolling_mean_4 = np.nan

        if len(previous_values) >= 48:
            rolling_mean_48 = np.mean(
                previous_values[-48:]
            )

            rolling_max_48 = np.max(
                previous_values[-48:]
            )
        else:
            rolling_mean_48 = np.nan
            rolling_max_48 = np.nan

        feature_rows.append(
            [
                values[i],
                np.sin(hour_angle),
                np.cos(hour_angle),
                np.sin(dow_angle),
                np.cos(dow_angle),
                np.sin(month_angle),
                np.cos(month_angle),
                lag_1,
                lag_2,
                lag_4,
                lag_48,
                rolling_mean_2,
                rolling_mean_4,
                rolling_mean_48,
                rolling_max_48
            ]
        )

    feature_matrix = np.asarray(
        feature_rows,
        dtype=np.float64
    )

    if not np.isfinite(
        feature_matrix[-LOOKBACK_STEPS:]
    ).all():

        raise ValueError(
            "Feature engineering produced "
            "non-finite values in the final "
            "lookback window."
        )

    return feature_matrix


# ---------------------------------------------------------------------
# Forecast inference
# ---------------------------------------------------------------------

def run_forecast(history_records):

    model, scaler = load_artifacts()

    feature_matrix = (
        build_feature_rows(
            history_records
        )
    )

    # Use the final 48 engineered rows
    # as the Transformer input window.
    input_features = feature_matrix[
        -LOOKBACK_STEPS:
    ]

    if input_features.shape != (
        LOOKBACK_STEPS,
        FEATURE_COUNT
    ):
        raise ValueError(
            f"Expected input shape "
            f"({LOOKBACK_STEPS}, "
            f"{FEATURE_COUNT}), "
            f"got {input_features.shape}"
        )

    # Apply the exact training scaler.
    scaled_features = scaler.transform(
        input_features
    )

    model_input = torch.tensor(
        scaled_features,
        dtype=torch.float32
    ).unsqueeze(0)

    with torch.no_grad():

        scaled_forecast = (
            model(model_input)
            .squeeze(0)
            .cpu()
            .numpy()
        )

    # Only energy_kwh is predicted.
    # Its scaler parameters are at feature index 0.
    energy_mean = (
        scaler.mean_[0]
    )

    energy_scale = (
        scaler.scale_[0]
    )

    forecast = (
        scaled_forecast
        * energy_scale
        + energy_mean
    )

    forecast = np.asarray(
        forecast,
        dtype=np.float64
    )

    if not np.isfinite(
        forecast
    ).all():
        raise RuntimeError(
            "Transformer produced "
            "non-finite predictions."
        )

    # Energy consumption cannot be negative.
    forecast = np.maximum(
        forecast,
        0.0
    )

    return {
        "success": True,
        "status": "COMPLETED",
        "model_loaded": True,
        "model": "Horizon-Specific Multi-Scale Transformer",
        "features": FEATURE_COUNT,
        "lookback_steps": LOOKBACK_STEPS,
        "horizon_steps": HORIZON_STEPS,
        "sampling_interval_minutes":
            SAMPLING_INTERVAL_MINUTES,
        "forecast": [
            float(value)
            for value in forecast
        ]
    }


# ---------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------

def health_check():

    model, scaler = load_artifacts()

    return {
        "success": True,
        "status": "READY",
        "service": "transformer_inference",
        "model_loaded": (
            model is not None
        ),
        "scaler_loaded": (
            scaler is not None
        ),
        "features_expected":
            FEATURE_COUNT,
        "lookback_steps":
            LOOKBACK_STEPS,
        "horizon_steps":
            HORIZON_STEPS,
        "sampling_interval_minutes":
            SAMPLING_INTERVAL_MINUTES
    }


# ---------------------------------------------------------------------
# Request handling
# ---------------------------------------------------------------------

def handle_request(request):

    if not isinstance(
        request,
        dict
    ):
        raise ValueError(
            "Request must be a JSON object"
        )

    action = request.get(
        "action"
    )

    if action == "health":
        return health_check()

    if action == "forecast":

        history_records = request.get(
            "history_records"
        )

        return run_forecast(
            history_records
        )

    raise ValueError(
        f"Unsupported inference action: "
        f"{action}"
    )


# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------

def main():

    try:

        raw_input = sys.stdin.read()

        if not raw_input.strip():
            raise ValueError(
                "No JSON request received "
                "on stdin"
            )

        request = json.loads(
            raw_input
        )

        response = handle_request(
            request
        )

        print(
            json.dumps(
                response
            )
        )

    except Exception as error:

        print(
            json.dumps(
                {
                    "success": False,
                    "status": "ERROR",
                    "error": {
                        "type":
                            type(error).__name__,
                        "message":
                            str(error)
                    }
                }
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()