# python/stably-mcp/src/stably_mcp/session.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Iterator, List, Sequence

from stably import (
    Action,
    Contract,
    ValidationResult,
    generate,
    validate_action,
    validate_pipeline,
)


@dataclass
class PipelineSession:
    """
    A small, deterministic helper for building and validating a `stably`
    pipeline over time.

    This is designed to be embedded inside an MCP-style server or any
    orchestrator that wants to:

    - incrementally accept actions (e.g., from tool results or user input)
    - validate each action against a contract as it is proposed
    - validate the full pipeline before execution
    - generate a deterministic stream of actions for execution

    All behavior here is pure with respect to the pipeline value:

    - The session holds an in-memory list of actions.
    - Validation is delegated to the underlying `stably` substrate.
    - Generation uses `stably.generate`, which is deterministic.
    - There is no I/O, transport, or environment access.
    """

    contract: Contract
    actions: List[Action] = field(default_factory=list)

    # --- Incremental construction -------------------------------------------------

    def add_action(self, action: Action) -> ValidationResult:
        """
        Validate a single action against the contract and append it to
        the pipeline if valid.

        This is useful inside an MCP handler where each tool result or
        user step becomes a candidate `Action`.

        Returns the `ValidationResult` from `stably.validate_action`.

        Example usage (inside an MCP tool or handler):

            result = session.add_action(action)
            if not result["ok"]:
                # surface errors back to the client
        """
        result = validate_action(action, self.contract)
        if result["ok"]:
            self.actions.append(action)
        return result

    def extend_actions(self, new_actions: Iterable[Action]) -> ValidationResult:
        """
        Validate a batch of actions and append them if the full batch is valid.

        The batch is treated atomically:

        - If every action is valid, they are all appended.
        - If any action is invalid, none are appended.

        Returns a `ValidationResult` summarizing the batch.
        """
        # Copy current pipeline so we don't mutate on failure
        candidate: List[Action] = list(self.actions)

        for action in new_actions:
            check = validate_action(action, self.contract)
            if not check["ok"]:
                # Return the first failing result; nothing is appended
                return check
            candidate.append(action)

        # All good: commit the new sequence
        self.actions = candidate
        return validate_pipeline(self.actions, self.contract)

    def clear(self) -> None:
        """
        Reset the session to an empty pipeline.

        This is useful when an orchestrator wants to start a new run
        while reusing the same session object.
        """
        self.actions.clear()

    # --- Validation helpers -------------------------------------------------------

    def validate_pipeline(self) -> ValidationResult:
        """
        Validate the entire pipeline (all actions accumulated so far)
        against the contract.

        This is typically called:

        - just before generating / executing the pipeline, or
        - before persisting a pipeline instance.
        """
        return validate_pipeline(self.actions, self.contract)

    def is_valid(self) -> bool:
        """
        Convenience helper: return True if the current pipeline is
        structurally valid for the contract.
        """
        result = self.validate_pipeline()
        return bool(result["ok"])

    # --- Deterministic generation -------------------------------------------------

    def generate(self) -> Iterator[Action]:
        """
        Create a deterministic generator over the current pipeline.

        Precondition: the caller should typically ensure the pipeline is
        valid (e.g., by calling `validate_pipeline()` or `is_valid()`
        and handling any errors) before consuming this generator.

        The generator:

        - does not mutate the pipeline
        - yields actions in a fixed order
        - has no side effects
        """
        # We intentionally rely on the stable behavior of `stably.generate`.
        return generate(self.actions)

    # --- Introspection ------------------------------------------------------------

    def snapshot(self) -> list[Action]:
        """
        Return a shallow copy of the current action list.

        This is useful for:

        - serializing pipeline state (e.g., into an MCP session store)
        - logging or debugging
        - replaying in an offline context
        """
        return list(self.actions)

    def __len__(self) -> int:  # pragma: no cover - trivial
        return len(self.actions)

    def __iter__(self) -> Iterator[Action]:  # pragma: no cover - convenience
        """
        Iterate over the current actions without creating a generator.

        This does *not* perform validation.
        """
        return iter(self.actions)

    # --- Convenience constructors -------------------------------------------------

    @classmethod
    def from_actions(cls, contract: Contract, actions: Sequence[Action]) -> PipelineSession:
        """
        Create a `PipelineSession` from an existing sequence of actions.

        The pipeline is **not** validated automatically; call
        `validate_pipeline()` or `is_valid()` as needed.
        """
        return cls(contract=contract, actions=list(actions))


def create_session(contract: Contract) -> PipelineSession:
    """
    Ergonomic helper to create a new, empty `PipelineSession` for a contract.

    This mirrors the `create_validator()` helper in `stably`, but is
    scoped to pipeline construction and deterministic generation instead
    of raw validation primitives.

    Example (inside an MCP server setup):

        from stably_mcp import create_session

        session = create_session(contract)

        # Later, inside a tool:
        result = session.add_action(action)
        if not result["ok"]:
            # surface structural errors to the caller

        if session.is_valid():
            for step in session.generate():
                # delegate `step` to a worker agent, etc.
    """
    return PipelineSession(contract=contract)
