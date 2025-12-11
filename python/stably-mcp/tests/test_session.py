# python/stably-mcp/tests/test_session.py

from __future__ import annotations

from typing import List

from stably_mcp.session import PipelineSession, create_session


# A simple Stably-style contract for tests
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


def make_valid_actions() -> List[dict]:
    # Minimal valid pipeline for the contract above
    return [
        {"type": "init", "payload": {}},
        {"type": "write", "payload": {"component": "Button"}},
        {"type": "verify", "payload": {}},
    ]


def test_add_action_valid_appends():
    session = PipelineSession(contract=CONTRACT)
    action = {"type": "init", "payload": {}}

    result = session.add_action(action)

    assert result["ok"] is True
    assert session.snapshot() == [action]


def test_add_action_invalid_does_not_mutate():
    session = PipelineSession(contract=CONTRACT)
    invalid_action = {"type": "unknown", "payload": {}}

    result = session.add_action(invalid_action)

    assert result["ok"] is False
    # Session should not be mutated on failure
    assert session.snapshot() == []


def test_extend_actions_all_valid_commits_and_validates():
    session = PipelineSession(contract=CONTRACT)
    actions = make_valid_actions()

    result = session.extend_actions(actions)

    assert result["ok"] is True
    # Full sequence should be committed
    assert session.snapshot() == actions


def test_extend_actions_invalid_batch_is_atomic():
    session = PipelineSession(contract=CONTRACT)
    initial_actions = [{"type": "init", "payload": {}}]
    # Seed with one valid action
    session.extend_actions(initial_actions)

    new_batch = [
        {"type": "write", "payload": {"component": "Button"}},
        {"type": "bogus", "payload": {}},  # invalid type
    ]

    result = session.extend_actions(new_batch)

    # Batch should be rejected
    assert result["ok"] is False
    # Original actions should remain unchanged (atomic behavior)
    assert session.snapshot() == initial_actions


def test_clear_resets_pipeline():
    session = PipelineSession(contract=CONTRACT)
    session.extend_actions(make_valid_actions())

    assert len(session) > 0

    session.clear()

    assert len(session) == 0
    assert session.snapshot() == []


def test_validate_pipeline_and_is_valid():
    session = PipelineSession(contract=CONTRACT)
    session.extend_actions(make_valid_actions())

    full_result = session.validate_pipeline()
    assert full_result["ok"] is True
    assert session.is_valid() is True

    # Introduce an invalid action directly and ensure validation fails
    session.actions.append({"type": "invalid", "payload": {}})

    full_result_after = session.validate_pipeline()
    assert full_result_after["ok"] is False
    assert session.is_valid() is False


def test_generate_yields_deterministic_sequence():
    actions = make_valid_actions()
    session = PipelineSession(contract=CONTRACT)
    session.extend_actions(actions)

    generated = list(session.generate())

    # Generator should produce the same structural sequence
    assert generated == actions
    # And not mutate the stored actions
    assert session.snapshot() == actions


def test_iter_and_len_helpers():
    actions = make_valid_actions()
    session = PipelineSession(contract=CONTRACT)
    session.extend_actions(actions)

    # __len__
    assert len(session) == len(actions)
    # __iter__
    assert list(iter(session)) == actions


def test_from_actions_does_not_auto_validate():
    actions = make_valid_actions() + [
        {"type": "invalid", "payload": {}},
    ]

    session = PipelineSession.from_actions(CONTRACT, actions)

    # State should be taken as-is
    assert session.snapshot() == actions
    # But validation should fail
    result = session.validate_pipeline()
    assert result["ok"] is False


def test_create_session_helper():
    session = create_session(CONTRACT)

    assert isinstance(session, PipelineSession)
    assert session.contract == CONTRACT
    assert session.snapshot() == []
