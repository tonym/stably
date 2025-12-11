# src/stably/core.py
from __future__ import annotations

from collections.abc import Generator
from typing import TypeVar

from .types import Action, ActionIterable

TAction = TypeVar("TAction", bound=Action)


def generate(actions: ActionIterable) -> Generator[TAction, None, None]:
    """
    Create a deterministic generator over a pipeline instance.

    The generator must:
    - yield each action exactly once
    - preserve the original order
    - introduce no side effects, caching, or hidden state

    Orchestrators own all interpretation and side effects; Stably only
    guarantees the structural walk over the provided data.
    """
    # We intentionally do not copy or transform the iterable beyond iteration
    # itself, to keep the behavior predictable and memory-friendly.
    for action in actions:
        # type: ignore[assignment]
        yield action  # TAction is constrained to Action; callers narrow further
