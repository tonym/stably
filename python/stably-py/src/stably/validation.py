# src/stably/validation.py
from __future__ import annotations

from __future__ import annotations

from typing import List

from .errors import ValidationError
from .types import Action, Contract, StructuralRules, ValidationResult


def _get_structural_rules(contract: Contract) -> StructuralRules:
    """
    Safely extract the structural rules from a contract, defaulting to an
    empty structure when not present.

    This keeps the validators resilient to partial or evolving contract shapes.
    """
    structural = contract.get("structural")
    if structural is None:
        return {}
    return structural


def validate_pipeline(actions: List[Action], contract: Contract) -> ValidationResult:
    """
    Validate a full pipeline instance against a structural contract.

    Structural checks (no semantics):

    - Disallowed action types
    - Missing required steps (represented as action types)
    - Illegal transitions between successive actions

    The result is an object with:
      { "ok": bool, "errors": list[str] }

    Stably does not throw by default; raising ValidationError is a consumer
    choice via helper functions or wrappers.
    """
    errors: list[str] = []

    contract_id = contract.get("id", "<unknown-contract>")
    structural = _get_structural_rules(contract)

    allowed_action_types = structural.get("allowed_action_types")
    required_steps = structural.get("required_steps", [])
    allowed_transitions = structural.get("allowed_transitions", {})

    # 1. Allowed action types
    if allowed_action_types is not None:
        allowed_set = set(allowed_action_types)
        for index, action in enumerate(actions):
            action_type = action.get("type")
            if action_type not in allowed_set:
                errors.append(
                    f"[{contract_id}] Action at index {index} has type "
                    f"'{action_type}', which is not allowed by this contract."
                )

    # 2. Required steps (as required action types)
    if required_steps:
        present_types = {action.get("type") for action in actions}
        for required in required_steps:
            if required not in present_types:
                errors.append(
                    f"[{contract_id}] Required action type '{required}' is "
                    f"missing from the pipeline."
                )

    # 3. Allowed transitions between successive actions
    if allowed_transitions:
        for index in range(len(actions) - 1):
            current_type = actions[index].get("type")
            next_type = actions[index + 1].get("type")

            # Only enforce transitions for current types explicitly present
            # in the transition map. If a type is absent, we consider its
            # transitions unconstrained by this contract.
            allowed_next = allowed_transitions.get(current_type)
            if allowed_next is not None and next_type not in allowed_next:
                errors.append(
                    f"[{contract_id}] Illegal transition at index {index}: "
                    f"'{current_type}' -> '{next_type}' is not permitted."
                )

    return {"ok": not errors, "errors": errors}


def validate_action(action: Action, contract: Contract) -> ValidationResult:
    """
    Validate a single action against the structural contract.

    This is intentionally lightweight and focuses on checks that make sense
    in isolation:

    - Disallowed action types

    More complex invariants (such as required steps or transitions) are
    evaluated at the pipeline level where the necessary context exists.
    """
    errors: list[str] = []

    contract_id = contract.get("id", "<unknown-contract>")
    structural = _get_structural_rules(contract)

    allowed_action_types = structural.get("allowed_action_types")
    action_type = action.get("type")

    if allowed_action_types is not None:
        if action_type not in allowed_action_types:
            errors.append(
                f"[{contract_id}] Action type '{action_type}' is not allowed "
                f"by this contract."
            )

    return {"ok": not errors, "errors": errors}


class _Validator:
    """
    Ergonomic helper for preloading a contract.

    Instances expose:
    - validate_pipeline(actions)
    - validate_action(action)

    This does not introduce any caching or hidden state that would change
    behavior across runs. It is a thin convenience wrapper.
    """

    def __init__(self, contract: Contract):
        self._contract = contract

    def validate_pipeline(self, actions: List[Action]) -> ValidationResult:
        return validate_pipeline(actions, self._contract)

    def validate_action(self, action: Action) -> ValidationResult:
        return validate_action(action, self._contract)

    def assert_valid_pipeline(self, actions: List[Action]) -> None:
        """
        Optional convenience: raise ValidationError when the pipeline is
        structurally invalid. This keeps the core validator pure while
        offering a more exception-friendly ergonomics when desired.
        """
        result = self.validate_pipeline(actions)
        if not result["ok"]:
            raise ValidationError(result["errors"])

    def assert_valid_action(self, action: Action) -> None:
        """
        Optional convenience: raise ValidationError when the action is
        structurally invalid.
        """
        result = self.validate_action(action)
        if not result["ok"]:
            raise ValidationError(result["errors"])


def create_validator(contract: Contract) -> _Validator:
    """
    Create a reusable validator bound to a specific contract.

    This mirrors the ergonomics of `createValidator` in the TypeScript core
    without extending Stably's semantics.
    """
    return _Validator(contract)
