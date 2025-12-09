# python/stably-py/tests/test_core.py
from __future__ import annotations

from stably import Action, generate


def test_generate_yields_actions_in_order() -> None:
    actions: list[Action] = [
        {"type": "a", "payload": {"value": 1}},
        {"type": "b", "payload": {"value": 2}},
        {"type": "c", "payload": {"value": 3}},
    ]

    result = list(generate(actions))

    assert result == actions
