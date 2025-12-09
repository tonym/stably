# src/stably/types.py
from __future__ import annotations

from typing import Any, Iterable, TypedDict


class Action(TypedDict):
    """
    A single pipeline action.

    Domains are free to extend this via TypedDict inheritance, but at minimum
    every action must include a `type` field. The `payload` is domain-defined
    and opaque to Stably.
    """

    type: str
    payload: Any


class StructuralRules(TypedDict, total=False):
    """
    Structural invariants for a pipeline.

    These are intentionally minimal and structural only. Semantics live in
    orchestrators, workers, and evals – not in the Stably core.
    """

    # Action types that are permitted in this pipeline.
    allowed_action_types: list[str]

    # Step IDs that must appear at least once in a valid pipeline.
    required_steps: list[str]


class StepDefinition(TypedDict):
    """
    A single step in the pipeline contract.

    `id` is a stable identifier for the step.
    `action_type` is the action.type value associated with this step.
    """

    id: str
    action_type: str


class Contract(TypedDict, total=False):
    """
    A runtime contract describing the structure of a pipeline.

    Domains may extend this structure (e.g., `domain`, `metadata`) as long
    as the core fields remain structurally compatible.
    """

    id: str
    steps: list[StepDefinition]
    structural: StructuralRules


class ValidationResult(TypedDict):
    """
    Result of a structural validation.

    Stably uses a simple ok/errors model to keep validation predictable and
    easy to integrate into orchestrator flows.
    """

    ok: bool
    errors: list[str]


# Convenience alias for any iterable of actions that can back a pipeline.
ActionIterable = Iterable[Action]
