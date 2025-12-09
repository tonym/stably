# python/stably-py/tests/test_validation.py
from __future__ import annotations

from stably import (
    Action,
    Contract,
    ValidationError,
    create_validator,
    validate_action,
    validate_pipeline,
)


def _demo_contract() -> Contract:
    return {
        "id": "demo",
        "structural": {
            "allowed_action_types": ["a", "b", "c"],
            "required_steps": ["a", "c"],
            "allowed_transitions": {
                "a": ["b"],  # after 'a', only 'b' is allowed
                "b": ["c"],  # after 'b', only 'c' is allowed
            },
        },
    }


def test_validate_pipeline_ok_for_valid_sequence() -> None:
    contract = _demo_contract()
    actions: list[Action] = [
        {"type": "a", "payload": {}},
        {"type": "b", "payload": {}},
        {"type": "c", "payload": {}},
    ]

    result = validate_pipeline(actions, contract)

    assert result["ok"] is True


def test_validate_pipeline_rejects_disallowed_action_type() -> None:
    contract = _demo_contract()
    actions: list[Action] = [
        {"type": "a", "payload": {}},
        {"type": "x", "payload": {}},  # not allowed by contract
        {"type": "c", "payload": {}},
    ]

    result = validate_pipeline(actions, contract)

    assert result["ok"] is False


def test_validate_pipeline_rejects_missing_required_step() -> None:
    contract = _demo_contract()
    # Missing required "c"
    actions: list[Action] = [
        {"type": "a", "payload": {}},
        {"type": "b", "payload": {}},
    ]

    result = validate_pipeline(actions, contract)

    assert result["ok"] is False


def test_validate_pipeline_rejects_illegal_transition() -> None:
    contract = _demo_contract()
    # 'c' is not an allowed successor of 'a' per allowed_transitions
    actions: list[Action] = [
        {"type": "a", "payload": {}},
        {"type": "c", "payload": {}},
    ]

    result = validate_pipeline(actions, contract)

    assert result["ok"] is False


def test_validate_action_ok_for_allowed_type() -> None:
    contract = _demo_contract()
    action: Action = {"type": "a", "payload": {}}

    result = validate_action(action, contract)

    assert result["ok"] is True


def test_validate_action_rejects_disallowed_type() -> None:
    contract = _demo_contract()
    action: Action = {"type": "x", "payload": {}}

    result = validate_action(action, contract)

    assert result["ok"] is False


def test_create_validator_assert_valid_pipeline_raises_on_invalid() -> None:
    contract = _demo_contract()
    validator = create_validator(contract)
    actions: list[Action] = [
        {"type": "a", "payload": {}},
        {"type": "x", "payload": {}},  # invalid type
    ]

    error_raised = False
    try:
        validator.assert_valid_pipeline(actions)
    except ValidationError:
        error_raised = True

    assert error_raised is True
