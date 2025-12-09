# src/stably/validation.py
from __future__ import annotations

from .errors import ValidationError
from .types import Action, Contract, ValidationResult


def validate_pipeline(actions: list[Action], contract: Contract) -> ValidationResult:
    """
    Validate a full pipeline instance against a structural contract.

    TODO: Implement parity with the TypeScript core:
    - illegal action types
    - missing required steps
    - order / mapping of steps to actions
    """
    return {"ok": True, "errors": []}


def validate_action(action: Action, contract: Contract) -> ValidationResult:
    """
    Validate a single action against the structural contract.

    TODO: Implement single-step checks mirroring validate_pipeline logic
    for the specific action.
    """
    return {"ok": True, "errors": []}


class _Validator:
    """
    Ergonomic helper for preloading a contract.

    Instances expose:
    - validate_pipeline(actions)
    - validate_action(action)
    """

    def __init__(self, contract: Contract):
        self._contract = contract

    def validate_pipeline(self, actions: list[Action]) -> ValidationResult:
        return validate_pipeline(actions, self._contract)

    def validate_action(self, action: Action) -> ValidationResult:
        return validate_action(action, self._contract)


def create_validator(contract: Contract) -> _Validator:
    """
    Create a reusable validator bound to a specific contract.
    """
    return _Validator(contract)
