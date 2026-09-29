"""
Standalone PPO XAI verification.

This test does NOT modify PPO inference behavior.

It verifies:
1. The packaged PPO policy can be loaded.
2. The actual policy produces five actions.
3. Integrated Gradients can attribute each action
   to the ten PPO observation features.
4. Attribution values are finite.
5. Integrated Gradients convergence deltas are finite.
6. The attribution matrix has shape (5, 10).
"""

import json
import sys
from pathlib import Path

import gymnasium as gym
import numpy as np
import torch
from captum.attr import IntegratedGradients
from stable_baselines3.common.policies import ActorCriticPolicy


# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------

BACKEND_ROOT = Path(__file__).resolve().parents[2]

ARTIFACT_DIR = (
    BACKEND_ROOT
    / "ml"
    / "artifacts"
    / "ppo"
)

POLICY_PATH = ARTIFACT_DIR / "policy.pth"


# ---------------------------------------------------------------------
# PPO contract
# ---------------------------------------------------------------------

OBSERVATION_DIM = 10
ACTION_DIM = 5
XAI_STEPS = 32


FEATURE_LABELS = [
    "forecast_demand",
    "solar_generation",
    "tariff",
    "battery_soc",
    "time_sin",
    "time_cos",
    "washing_machine_remaining",
    "water_heater_remaining",
    "ev_charger_remaining",
    "current_flexible_demand",
]


ACTION_LABELS = [
    "washing_machine",
    "water_heater",
    "ev_charger",
    "battery_charge",
    "battery_discharge",
]


# ---------------------------------------------------------------------
# Load policy
# ---------------------------------------------------------------------

def load_policy():

    if not POLICY_PATH.exists():
        raise FileNotFoundError(
            f"PPO policy artifact not found: {POLICY_PATH}"
        )

    observation_space = gym.spaces.Box(
        low=-1.0,
        high=1.0,
        shape=(OBSERVATION_DIM,),
        dtype=np.float32,
    )

    action_space = gym.spaces.Box(
        low=0.0,
        high=1.0,
        shape=(ACTION_DIM,),
        dtype=np.float32,
    )

    policy = ActorCriticPolicy(
        observation_space=observation_space,
        action_space=action_space,
        lr_schedule=lambda _: 3e-4,
        net_arch={
            "pi": [128, 128],
            "vf": [128, 128],
        },
    )

    state_dict = torch.load(
        POLICY_PATH,
        map_location="cpu",
        weights_only=True,
    )

    if not isinstance(state_dict, dict):
        raise ValueError(
            "PPO artifact does not contain "
            "a valid state dictionary."
        )

    policy.load_state_dict(
        state_dict,
        strict=True,
    )

    policy.set_training_mode(False)

    return policy


# ---------------------------------------------------------------------
# Main XAI test
# ---------------------------------------------------------------------

def run_test():

    print("Loading PPO policy...")

    policy = load_policy()

    print("PPO policy loaded successfully.")

    # -------------------------------------------------------------
    # Representative normalized PPO observation.
    #
    # This uses the same normalized [0, 1] / [-1, 1] observation
    # representation expected by the current PPO policy.
    # -------------------------------------------------------------

    observation = np.array(
        [
            0.75,   # forecast demand
            0.50,   # solar generation
            1.00,   # tariff
            0.50,   # battery SOC
            0.00,   # time sin
            1.00,   # time cos
            0.50,   # washing machine remaining
            0.67,   # water heater remaining
            0.50,   # EV remaining
            0.30,   # current flexible demand
        ],
        dtype=np.float32,
    )

    if observation.shape != (
        OBSERVATION_DIM,
    ):
        raise ValueError(
            f"Expected observation shape "
            f"({OBSERVATION_DIM},), "
            f"got {observation.shape}"
        )

    # -------------------------------------------------------------
    # Verify normal deterministic PPO action.
    # -------------------------------------------------------------

    normal_action, _ = policy.predict(
        observation,
        deterministic=True,
    )

    normal_action = np.asarray(
        normal_action,
        dtype=np.float32,
    ).reshape(-1)

    if normal_action.shape != (
        ACTION_DIM,
    ):
        raise ValueError(
            f"Expected action shape "
            f"({ACTION_DIM},), "
            f"got {normal_action.shape}"
        )

    if not np.isfinite(
        normal_action
    ).all():
        raise ValueError(
            "PPO produced non-finite actions."
        )

    print()
    print("Normal PPO action:")
    for label, value in zip(
        ACTION_LABELS,
        normal_action,
    ):
        print(
            f"  {label}: {float(value):.6f}"
        )

    # -------------------------------------------------------------
    # Tensor for Integrated Gradients.
    # -------------------------------------------------------------

    input_tensor = torch.tensor(
        observation,
        dtype=torch.float32,
    ).unsqueeze(0)

    baseline_tensor = torch.zeros_like(
        input_tensor
    )

    # -------------------------------------------------------------
    # Policy action mean.
    #
    # For this SB3 PPO policy, deterministic inference uses
    # the distribution mean before action-space clipping.
    # -------------------------------------------------------------

    def policy_action_mean(inputs):

        distribution = (
            policy.get_distribution(
                inputs
            )
        )

        return (
            distribution.distribution.mean
        )

    # -------------------------------------------------------------
    # Integrated Gradients.
    # -------------------------------------------------------------

    ig = IntegratedGradients(
        policy_action_mean
    )

    attribution_matrix = []
    convergence_deltas = []

    for action_index in range(
        ACTION_DIM
    ):

        def selected_action(inputs):
            return policy_action_mean(
                inputs
            )[:, action_index]

        action_ig = IntegratedGradients(
            selected_action
        )

        attribution, delta = (
            action_ig.attribute(
                input_tensor,
                baselines=baseline_tensor,
                n_steps=XAI_STEPS,
                return_convergence_delta=True,
            )
        )

        values = (
            attribution[0]
            .detach()
            .cpu()
            .numpy()
            .astype(np.float64)
        )

        delta_value = float(
            delta.detach()
            .cpu()
            .numpy()
            .reshape(-1)[0]
        )

        if not np.isfinite(
            values
        ).all():
            raise ValueError(
                f"Non-finite attribution values "
                f"for action {action_index}."
            )

        if not np.isfinite(
            delta_value
        ):
            raise ValueError(
                f"Non-finite convergence delta "
                f"for action {action_index}."
            )

        attribution_matrix.append(
            values
        )

        convergence_deltas.append(
            delta_value
        )

    attribution_matrix = np.asarray(
        attribution_matrix,
        dtype=np.float64,
    )

    # -------------------------------------------------------------
    # Validate final matrix.
    # -------------------------------------------------------------

    if attribution_matrix.shape != (
        ACTION_DIM,
        OBSERVATION_DIM,
    ):
        raise ValueError(
            "Unexpected attribution matrix shape: "
            f"{attribution_matrix.shape}"
        )

    # -------------------------------------------------------------
    # Print attribution matrix.
    # -------------------------------------------------------------

    print()
    print(
        "Integrated Gradients attribution "
        f"matrix shape: {attribution_matrix.shape}"
    )

    print()
    print("Feature attributions:")

    for action_index, action_name in enumerate(
        ACTION_LABELS
    ):

        print()
        print(
            f"[{action_name}]"
        )

        for feature_index, feature_name in enumerate(
            FEATURE_LABELS
        ):

            value = attribution_matrix[
                action_index,
                feature_index,
            ]

            print(
                f"  {feature_name}: "
                f"{value:+.8f}"
            )

    # -------------------------------------------------------------
    # Print convergence deltas.
    # -------------------------------------------------------------

    print()
    print(
        "Convergence deltas:"
    )

    for action_name, delta in zip(
        ACTION_LABELS,
        convergence_deltas,
    ):
        print(
            f"  {action_name}: "
            f"{delta:+.10f}"
        )

    # -------------------------------------------------------------
    # Top feature per action.
    # -------------------------------------------------------------

    print()
    print(
        "Top absolute attribution per action:"
    )

    top_features = {}

    for action_index, action_name in enumerate(
        ACTION_LABELS
    ):

        row = attribution_matrix[
            action_index
        ]

        top_index = int(
            np.argmax(
                np.abs(row)
            )
        )

        top_value = float(
            row[top_index]
        )

        top_features[action_name] = {
            "feature": FEATURE_LABELS[
                top_index
            ],
            "contribution": top_value,
            "direction": (
                "POSITIVE"
                if top_value > 0
                else "NEGATIVE"
                if top_value < 0
                else "NEUTRAL"
            ),
        }

        print(
            f"  {action_name}: "
            f"{FEATURE_LABELS[top_index]} "
            f"({top_value:+.8f})"
        )

    # -------------------------------------------------------------
    # JSON result.
    # -------------------------------------------------------------

    result = {
        "success": True,
        "status": "COMPLETED",
        "method": "Integrated Gradients",
        "baseline": "zero_normalized_observation",
        "steps": XAI_STEPS,
        "observation_dimensions": OBSERVATION_DIM,
        "action_dimensions": ACTION_DIM,
        "actions": {
            label: float(value)
            for label, value in zip(
                ACTION_LABELS,
                normal_action,
            )
        },
        "convergence_deltas": {
            label: float(delta)
            for label, delta in zip(
                ACTION_LABELS,
                convergence_deltas,
            )
        },
        "top_features": top_features,
        "attributions": {
            action_name: {
                feature_name: float(
                    attribution_matrix[
                        action_index,
                        feature_index,
                    ]
                )
                for feature_index, feature_name
                in enumerate(FEATURE_LABELS)
            }
            for action_index, action_name
            in enumerate(ACTION_LABELS)
        },
    }

    print()
    print(
        "FINAL_RESULT="
        + json.dumps(
            result,
            separators=(",", ":"),
        )
    )


if __name__ == "__main__":

    try:
        run_test()

    except Exception as error:

        print(
            "FINAL_RESULT="
            + json.dumps(
                {
                    "success": False,
                    "status": "ERROR",
                    "error": str(error),
                },
                separators=(",", ":"),
            )
        )

        sys.exit(1)