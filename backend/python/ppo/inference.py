"""
PPO Reinforcement Learning Inference

Loads the trained Stable-Baselines3 PPO policy artifact and runs
the Forecast -> PPO household optimization simulation.

Input:
    48-step energy forecast
    kWh per 30-minute step

PPO observation:
    10 values

PPO action:
    5 continuous values

This module does NOT train PPO.
"""

import json
import sys
from pathlib import Path

import gymnasium as gym
import numpy as np
import torch
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
CONFIG_PATH = ARTIFACT_DIR / "ppo_config.json"
METADATA_PATH = ARTIFACT_DIR / "ppo_metadata.json"


# ---------------------------------------------------------------------
# PPO contract
# ---------------------------------------------------------------------

FORECAST_HORIZON = 48
OBSERVATION_DIM = 10
ACTION_DIM = 5
TIME_STEP_MINUTES = 30

STEP_HOURS = TIME_STEP_MINUTES / 60.0


# ---------------------------------------------------------------------
# Artifact state
# ---------------------------------------------------------------------

_policy = None
_config = None
_metadata = None


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

def load_json(path):
    if not path.exists():
        raise FileNotFoundError(
            f"Required PPO artifact not found: {path}"
        )

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_artifacts():
    global _policy
    global _config
    global _metadata

    if _policy is not None:
        return _policy, _config, _metadata

    if not POLICY_PATH.exists():
        raise FileNotFoundError(
            f"Trained PPO policy artifact not found: {POLICY_PATH}"
        )

    _config = load_json(CONFIG_PATH)
    _metadata = load_json(METADATA_PATH)

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
            "PPO policy artifact does not contain a valid state dictionary."
        )

    policy.load_state_dict(
        state_dict,
        strict=True,
    )

    policy.set_training_mode(False)

    _policy = policy

    return _policy, _config, _metadata


# ---------------------------------------------------------------------
# Forecast -> PPO adapter
# ---------------------------------------------------------------------

class ForecastToPPOAdapter:
    """
    Converts the Transformer forecast into the household-scale
    forecast expected by the PPO environment.

    Raw Transformer forecast:
        kWh / 30-minute step

    PPO household scale:
        maximum = 3.0 kWh / step
    """

    @staticmethod
    def validate_and_bridge(forecast_points):

        if not isinstance(forecast_points, list):
            raise ValueError(
                "forecast_points must be a list."
            )

        if len(forecast_points) != FORECAST_HORIZON:
            raise ValueError(
                f"PPO requires exactly {FORECAST_HORIZON} forecast points, "
                f"got {len(forecast_points)}."
            )

        forecast = np.asarray(
            forecast_points,
            dtype=np.float32,
        )

        if not np.isfinite(forecast).all():
            raise ValueError(
                "Forecast contains non-finite values."
            )

        if np.any(forecast < 0):
            raise ValueError(
                "Forecast contains negative energy values."
            )

        forecast_scale = float(
            _config["forecast_scale_kwh_per_step"]
        )

        if forecast_scale <= 0:
            raise ValueError(
                "Invalid PPO forecast scale."
            )

        forecast_max = float(
            np.max(forecast)
        )

        if forecast_max <= 0:
            raise ValueError(
                "Forecast maximum must be greater than zero."
            )

        # Same scaling rule used by the PPO preparation.
        scaled_forecast = (
            forecast / forecast_max
        ) * forecast_scale

        return np.clip(
            scaled_forecast,
            0.0,
            forecast_scale,
        ).astype(np.float32)


# ---------------------------------------------------------------------
# Simulation constants
# ---------------------------------------------------------------------

def get_simulation_config():

    config = _config["simulation_config"]

    battery = _config["battery"]

    flexible_loads = config["flexible_loads"]

    return {
        "battery": battery,
        "flexible_loads": flexible_loads,
        "tariff": config["tariff"],
        "solar": config["solar"],
    }


# ---------------------------------------------------------------------
# Tariff
# ---------------------------------------------------------------------

def calculate_tariff(step_index):

    tariff = get_simulation_config()["tariff"]

    hour = step_index / 2.0

    if hour < 6:
        return float(tariff["off_peak"])

    if hour < 17:
        return float(tariff["standard"])

    if hour < 22:
        return float(tariff["peak"])

    return float(tariff["off_peak"])


# ---------------------------------------------------------------------
# Solar
# ---------------------------------------------------------------------

def calculate_solar_generation(step_index):

    solar = get_simulation_config()["solar"]

    sunrise = float(
        solar["sunrise_step"]
    )

    sunset = float(
        solar["sunset_step"]
    )

    peak_power = float(
        solar["peak_power_kw"]
    )

    if step_index < sunrise:
        return 0.0

    if step_index > sunset:
        return 0.0

    duration = sunset - sunrise

    if duration <= 0:
        return 0.0

    position = (
        (step_index - sunrise)
        / duration
    )

    return max(
        0.0,
        float(
            np.sin(np.pi * position)
            * peak_power
        ),
    )


# ---------------------------------------------------------------------
# Flexible loads
# ---------------------------------------------------------------------

def initialize_remaining_steps():

    flexible_loads = get_simulation_config()["flexible_loads"]

    return {
        name: int(config["duration_steps"])
        for name, config in flexible_loads.items()
    }


def apply_flexible_load_actions(
    step_index,
    actions,
    remaining_steps,
):

    flexible_loads = (
        get_simulation_config()["flexible_loads"]
    )

    appliance_names = [
        "washing_machine",
        "water_heater",
        "ev_charger",
    ]

    applied_power = {
        name: 0.0
        for name in appliance_names
    }

    violations = 0.0

    for index, name in enumerate(appliance_names):

        config = flexible_loads[name]

        within_window = (
            config["start_step"]
            <= step_index
            < config["end_step"]
        )

        if (
            within_window
            and remaining_steps[name] > 0
            and actions[index] >= 0.5
        ):
            applied_power[name] = float(
                config["power_kw"]
            )

            remaining_steps[name] -= 1

    # Count unmet requirements once at the deadline.
    for name in appliance_names:

        config = flexible_loads[name]

        if (
            step_index + 1
            >= config["end_step"]
            and remaining_steps[name] > 0
        ):
            violations += remaining_steps[name]

    return (
        applied_power,
        remaining_steps,
        float(violations),
    )


# ---------------------------------------------------------------------
# Battery
# ---------------------------------------------------------------------

def update_battery_soc(
    battery_soc,
    charge_action,
    discharge_action,
    residual_load_kw,
):

    battery = get_simulation_config()["battery"]

    capacity = float(
        battery["capacity_kwh"]
    )

    min_soc = float(
        battery["min_soc"]
    )

    max_soc = float(
        battery["max_soc"]
    )

    max_charge = float(
        battery["max_charge_power_kw"]
    )

    max_discharge = float(
        battery["max_discharge_power_kw"]
    )

    charge_efficiency = float(
        battery["charge_efficiency"]
    )

    discharge_efficiency = float(
        battery["discharge_efficiency"]
    )

    # Only one battery direction may be active.
    if discharge_action >= charge_action:

        requested_charge_power = 0.0

        requested_discharge_power = (
            float(discharge_action)
            * max_discharge
        )

    else:

        requested_charge_power = (
            float(charge_action)
            * max_charge
        )

        requested_discharge_power = 0.0

    # Battery cannot discharge more than the current residual load.
    requested_discharge_power = min(
        requested_discharge_power,
        max(float(residual_load_kw), 0.0),
    )

    available_capacity_kwh = (
        max_soc - battery_soc
    ) * capacity

    max_charge_power_soc = (
        available_capacity_kwh
        / (STEP_HOURS * charge_efficiency)
    )

    available_energy_kwh = (
        battery_soc - min_soc
    ) * capacity

    max_discharge_power_soc = (
        available_energy_kwh
        * discharge_efficiency
        / STEP_HOURS
    )

    charge_power = min(
        requested_charge_power,
        max(0.0, max_charge_power_soc),
    )

    discharge_power = min(
        requested_discharge_power,
        max(0.0, max_discharge_power_soc),
    )

    charge_energy_stored = (
        charge_power
        * STEP_HOURS
        * charge_efficiency
    )

    discharge_energy_from_soc = (
        discharge_power
        * STEP_HOURS
        / discharge_efficiency
    )

    new_soc = (
        battery_soc
        + charge_energy_stored / capacity
        - discharge_energy_from_soc / capacity
    )

    new_soc = float(
        np.clip(
            new_soc,
            min_soc,
            max_soc,
        )
    )

    return (
        new_soc,
        float(charge_power),
        float(discharge_power),
    )


# ---------------------------------------------------------------------
# Energy accounting
# ---------------------------------------------------------------------

def calculate_step_energy(
    forecast_demand,
    flexible_power,
    solar_power,
    charge_power,
    discharge_power,
    tariff,
):

    flexible_energy = (
        flexible_power
        * STEP_HOURS
    )

    solar_energy = (
        solar_power
        * STEP_HOURS
    )

    battery_charge_energy = (
        charge_power
        * STEP_HOURS
    )

    battery_discharge_energy = (
        discharge_power
        * STEP_HOURS
    )

    load_before_solar = (
        forecast_demand
        + flexible_energy
        + battery_charge_energy
    )

    solar_used_energy = min(
        float(solar_energy),
        max(float(load_before_solar), 0.0),
    )

    solar_curtailed_energy = max(
        float(solar_energy)
        - solar_used_energy,
        0.0,
    )

    grid_energy = max(
        float(load_before_solar)
        - solar_used_energy
        - battery_discharge_energy,
        0.0,
    )

    grid_power = (
        grid_energy / STEP_HOURS
    )

    cost = (
        grid_energy * tariff
    )

    return {
        "grid_energy": float(grid_energy),
        "grid_power": float(grid_power),
        "cost": float(cost),
        "flexible_energy": float(flexible_energy),
        "solar_energy": float(solar_energy),
        "solar_used_energy": float(
            solar_used_energy
        ),
        "solar_curtailed_energy": float(
            solar_curtailed_energy
        ),
        "battery_charge_energy": float(
            battery_charge_energy
        ),
        "battery_discharge_energy": float(
            battery_discharge_energy
        ),
    }


# ---------------------------------------------------------------------
# PPO observation
# ---------------------------------------------------------------------

def build_observation(
    forecast_demand,
    solar_generation,
    tariff,
    step_index,
    battery_soc,
    remaining_steps,
    current_flexible_demand,
):

    forecast_scale = float(
        _config["forecast_scale_kwh_per_step"]
    )

    solar_scale = float(
        _config["simulation_config"]
        ["solar"]["peak_power_kw"]
    )

    tariff_config = (
        _config["simulation_config"]["tariff"]
    )

    tariff_scale = max(
        float(tariff_config["peak"]),
        float(tariff_config["standard"]),
        float(tariff_config["off_peak"]),
        1e-6,
    )

    flexible_loads = (
        _config["simulation_config"]
        ["flexible_loads"]
    )

    flexible_scale = max(
        sum(
            float(item["power_kw"])
            for item in flexible_loads.values()
        ),
        1e-6,
    )

    time_fraction = (
        step_index / FORECAST_HORIZON
    )

    time_sin = np.sin(
        2.0 * np.pi * time_fraction
    )

    time_cos = np.cos(
        2.0 * np.pi * time_fraction
    )

    observation = np.array(
        [
            forecast_demand / forecast_scale,
            solar_generation / solar_scale,
            tariff / tariff_scale,
            battery_soc,
            time_sin,
            time_cos,
            (
                remaining_steps["washing_machine"]
                / flexible_loads[
                    "washing_machine"
                ]["duration_steps"]
            ),
            (
                remaining_steps["water_heater"]
                / flexible_loads[
                    "water_heater"
                ]["duration_steps"]
            ),
            (
                remaining_steps["ev_charger"]
                / flexible_loads[
                    "ev_charger"
                ]["duration_steps"]
            ),
            current_flexible_demand
            / flexible_scale,
        ],
        dtype=np.float32,
    )

    observation = np.clip(
        observation,
        -1.0,
        1.0,
    )

    if observation.shape != (
        OBSERVATION_DIM,
    ):
        raise ValueError(
            f"Expected observation shape "
            f"({OBSERVATION_DIM},), "
            f"got {observation.shape}"
        )

    if not np.isfinite(observation).all():
        raise ValueError(
            "PPO observation contains non-finite values."
        )

    return observation


# ---------------------------------------------------------------------
# Policy inference
# ---------------------------------------------------------------------

def predict_action(observation):

    policy, _, _ = load_artifacts()

    action, _ = policy.predict(
        observation,
        deterministic=True,
    )

    action = np.asarray(
        action,
        dtype=np.float32,
    ).reshape(-1)

    if action.shape != (
        ACTION_DIM,
    ):
        raise ValueError(
            f"Expected PPO action shape "
            f"({ACTION_DIM},), "
            f"got {action.shape}"
        )

    if not np.isfinite(action).all():
        raise ValueError(
            "PPO produced non-finite action values."
        )

    return np.clip(
        action,
        0.0,
        1.0,
    )


# ---------------------------------------------------------------------
# Full PPO dispatch
# ---------------------------------------------------------------------

def run_ppo_dispatch(forecast_points):

    policy, config, metadata = load_artifacts()

    bridged_forecast = (
        ForecastToPPOAdapter
        .validate_and_bridge(
            forecast_points
        )
    )

    battery = config["battery"]

    battery_soc = float(
        battery["initial_soc"]
    )

    remaining_steps = (
        initialize_remaining_steps()
    )

    current_flexible_demand = 0.0

    total_grid_energy = 0.0
    total_cost = 0.0
    peak_demand = 0.0

    total_solar_generated = 0.0
    total_solar_used = 0.0
    total_solar_curtailed = 0.0

    total_constraint_violations = 0.0
    total_reward = 0.0

    steps = []

    for step_index in range(
        FORECAST_HORIZON
    ):

        forecast_demand = float(
            bridged_forecast[step_index]
        )

        solar_generation = (
            calculate_solar_generation(
                step_index
            )
        )

        tariff = calculate_tariff(
            step_index
        )

        observation = build_observation(
            forecast_demand=forecast_demand,
            solar_generation=solar_generation,
            tariff=tariff,
            step_index=step_index,
            battery_soc=battery_soc,
            remaining_steps=remaining_steps,
            current_flexible_demand=(
                current_flexible_demand
            ),
        )

        action = predict_action(
            observation
        )

        (
            applied_power,
            remaining_steps,
            violations,
        ) = apply_flexible_load_actions(
            step_index=step_index,
            actions=action,
            remaining_steps=remaining_steps,
        )

        flexible_power = sum(
            applied_power.values()
        )

        # Estimate residual load before battery discharge.
        residual_load_kw = max(
            forecast_demand / STEP_HOURS
            + flexible_power
            - solar_generation,
            0.0,
        )

        old_soc = battery_soc

        (
            battery_soc,
            charge_power,
            discharge_power,
        ) = update_battery_soc(
            battery_soc=battery_soc,
            charge_action=float(action[3]),
            discharge_action=float(action[4]),
            residual_load_kw=residual_load_kw,
        )

        step_result = calculate_step_energy(
            forecast_demand=forecast_demand,
            flexible_power=flexible_power,
            solar_power=solar_generation,
            charge_power=charge_power,
            discharge_power=discharge_power,
            tariff=tariff,
        )

        # The training notebook's reward normalization depends on
        # training baseline statistics. Those statistics are not part
        # of the packaged backend PPO artifact, so do not fabricate
        # a training-equivalent reward here.
        reward = None

        total_grid_energy += (
            step_result["grid_energy"]
        )

        total_cost += (
            step_result["cost"]
        )

        peak_demand = max(
            peak_demand,
            step_result["grid_power"],
        )

        total_solar_generated += (
            step_result["solar_energy"]
        )

        total_solar_used += (
            step_result["solar_used_energy"]
        )

        total_solar_curtailed += (
            step_result["solar_curtailed_energy"]
        )

        total_constraint_violations += (
            violations
        )

        current_flexible_demand = (
            flexible_power
        )

        steps.append(
            {
                "step_index": step_index,
                "forecast_demand_kwh": (
                    forecast_demand
                ),
                "solar_generation_kwh": (
                    step_result["solar_energy"]
                ),
                "solar_used_kwh": (
                    step_result["solar_used_energy"]
                ),
                "solar_curtailed_kwh": (
                    step_result[
                        "solar_curtailed_energy"
                    ]
                ),
                "tariff": tariff,
                "action": [
                    float(value)
                    for value in action
                ],
                "washing_machine_power_kw": (
                    applied_power[
                        "washing_machine"
                    ]
                ),
                "water_heater_power_kw": (
                    applied_power[
                        "water_heater"
                    ]
                ),
                "ev_charger_power_kw": (
                    applied_power[
                        "ev_charger"
                    ]
                ),
                "battery_soc_before": old_soc,
                "battery_soc": battery_soc,
                "charge_power_kw": charge_power,
                "discharge_power_kw": (
                    discharge_power
                ),
                "grid_energy_kwh": (
                    step_result[
                        "grid_energy"
                    ]
                ),
                "grid_power_kw": (
                    step_result[
                        "grid_power"
                    ]
                ),
                "electricity_cost": (
                    step_result["cost"]
                ),
                "constraint_violations": (
                    violations
                ),
            }
        )

    renewable_utilization = 0.0

    if total_solar_generated > 0:
        renewable_utilization = (
            total_solar_used
            / total_solar_generated
            * 100.0
        )

    return {
        "success": True,
        "status": "COMPLETED",
        "model_loaded": policy is not None,
        "model": metadata["model_name"],
        "algorithm": metadata["model_type"],
        "policy": metadata["policy"],
        "steps": FORECAST_HORIZON,
        "time_step_minutes": TIME_STEP_MINUTES,
        "forecast_scale_kwh_per_step": float(
            config["forecast_scale_kwh_per_step"]
        ),
        "optimized_grid_energy_kwh": float(
            total_grid_energy
        ),
        "optimized_cost": float(
            total_cost
        ),
        "optimized_peak_demand_kw": float(
            peak_demand
        ),
        "solar_generated_kwh": float(
            total_solar_generated
        ),
        "solar_used_kwh": float(
            total_solar_used
        ),
        "solar_curtailed_kwh": float(
            total_solar_curtailed
        ),
        "renewable_utilization_pct": float(
            renewable_utilization
        ),
        "constraint_violations": int(
            total_constraint_violations
        ),
        "final_battery_soc": float(
            battery_soc
        ),
        "reward": total_reward,
        "actions": steps,
    }


# ---------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------

def health_check():

    policy, config, metadata = (
        load_artifacts()
    )

    return {
        "success": True,
        "status": "READY",
        "service": "ppo_inference",
        "model_loaded": policy is not None,
        "model": metadata["model_name"],
        "algorithm": metadata["model_type"],
        "policy": metadata["policy"],
        "observation_dimensions": (
            OBSERVATION_DIM
        ),
        "action_dimensions": ACTION_DIM,
        "forecast_horizon": (
            FORECAST_HORIZON
        ),
        "sampling_interval_minutes": (
            TIME_STEP_MINUTES
        ),
        "artifact_path": str(
            ARTIFACT_DIR
        ),
    }


# ---------------------------------------------------------------------
# Request handling
# ---------------------------------------------------------------------

def handle_request(request):

    if not isinstance(
        request,
        dict,
    ):
        raise ValueError(
            "Request must be a JSON object."
        )

    action = request.get(
        "action"
    )

    if action == "health":
        return health_check()

    if action == "optimize":

        forecast = request.get(
            "forecast"
        )

        return run_ppo_dispatch(
            forecast
        )

    raise ValueError(
        f"Unsupported PPO inference action: "
        f"{action}"
    )


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------

def main():

    try:

        raw_input = sys.stdin.read()

        if not raw_input.strip():
            raise ValueError(
                "No JSON request received."
            )

        request = json.loads(
            raw_input
        )

        result = handle_request(
            request
        )

        print(
            json.dumps(
                result,
                separators=(",", ":"),
            )
        )

    except Exception as error:

        print(
            json.dumps(
                {
                    "success": False,
                    "status": "ERROR",
                    "error": str(error),
                }
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()