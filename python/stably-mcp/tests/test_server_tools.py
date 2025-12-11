# python/stably-mcp/tests/test_server_tools.py

from __future__ import annotations

from stably_mcp.server import (
    validatePipeline,
    validateAction,
    generatePipeline,
)


CONTRACT = {
    "id": "docs",
    "structural": {
        "allowed_action_types": ["init", "write", "verify"],
        "required_steps": ["init", "verify"],
        "allowed_transitions": {
            "init": ["write"],
            "write": ["verify"],
        },
    },
}


def make_valid_actions() -> list[dict]:
    return [
        {"type": "init", "payload": {}},
        {"type": "write", "payload": {"component": "Button"}},
        {"type": "verify", "payload": {}},
    ]


def test_validate_pipeline_tool_with_valid_pipeline():
    actions = make_valid_actions()

    result = validatePipeline(actions=actions, contract=CONTRACT)

    assert isinstance(result, dict)
    assert result["ok"] is True


def test_validate_pipeline_tool_with_invalid_pipeline():
    # Invalid: missing required "verify" step
    actions = [
        {"type": "init", "payload": {}},
        {"type": "write", "payload": {"component": "Button"}},
    ]

    result = validatePipeline(actions=actions, contract=CONTRACT)

    assert isinstance(result, dict)
    assert result["ok"] is False


def test_validate_action_tool_valid():
    action = {"type": "init", "payload": {}}

    result = validateAction(action=action, contract=CONTRACT)

    assert isinstance(result, dict)
    assert result["ok"] is True


def test_validate_action_tool_invalid():
    action = {"type": "bogus", "payload": {}}

    result = validateAction(action=action, contract=CONTRACT)

    assert isinstance(result, dict)
    assert result["ok"] is False


def test_generate_pipeline_tool_round_trips_actions():
    actions = make_valid_actions()
    original = list(actions)  # keep a copy to ensure no mutation

    result = generatePipeline(actions=actions)

    assert isinstance(result, dict)
    assert "sequence" in result

    sequence = result["sequence"]

    # The generated sequence should be structurally equivalent
    assert sequence == actions

    # And the original list should not have been mutated
    assert actions == original
