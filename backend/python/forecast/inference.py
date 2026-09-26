"""
Horizon-Specific Multi-Scale Transformer Inference Module

Current status:
- Python/Node inference contract established.
- Actual trained Transformer artifact is not loaded yet.
- Real feature computation and PyTorch inference will be added
  after the trained artifact is available.

Authoritative model contract:
- Features: 15
- Lookback: 48 steps
- Horizon: 48 steps
- Sampling interval: 30 minutes
"""

import json
import sys


FEATURE_COUNT = 15
LOOKBACK_STEPS = 48
HORIZON_STEPS = 48
SAMPLING_INTERVAL_MINUTES = 30


def health_check():
    """
    Returns the current status of the Python inference service.

    This does NOT claim that the trained model is available.
    """

    return {
        "success": True,
        "status": "READY",
        "service": "transformer_inference",
        "model_loaded": False,
        "features_expected": FEATURE_COUNT,
        "lookback_steps": LOOKBACK_STEPS,
        "horizon_steps": HORIZON_STEPS,
        "sampling_interval_minutes": SAMPLING_INTERVAL_MINUTES,
        "message": (
            "Python inference contract is ready; "
            "trained Transformer artifact is not loaded."
        )
    }


def handle_request(request):
    """
    Handles one JSON request from Node.
    """

    if not isinstance(request, dict):
        raise ValueError("Request must be a JSON object")

    action = request.get("action")

    if action == "health":
        return health_check()

    if action == "forecast":
        raise RuntimeError(
            "Transformer forecast inference is not enabled yet. "
            "The trained model artifact must be connected first."
        )

    raise ValueError(
        f"Unsupported inference action: {action}"
    )


def main():
    """
    Reads one JSON request from stdin and writes one JSON response
    to stdout.
    """

    try:
        raw_input = sys.stdin.read()

        if not raw_input.strip():
            raise ValueError(
                "No JSON request received on stdin"
            )

        request = json.loads(raw_input)

        response = handle_request(request)

        print(json.dumps(response))

    except Exception as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "status": "ERROR",
                    "error": {
                        "type": type(error).__name__,
                        "message": str(error)
                    }
                }
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()