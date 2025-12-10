from __future__ import annotations

from mcp.server import Server
from mcp.types import TextContent

from stably import (
    validate_pipeline,
    validate_action,
    generate,
)


server = Server("stably-mcp")


# --------------------------
# validatePipeline Tool
# --------------------------
@server.tool()
def validatePipeline(actions: list[dict], contract: dict):
    """
    Validate an entire pipeline instance against a Stably contract.

    Pure pass-through → no side effects, no semantics.
    """
    result = validate_pipeline(actions, contract)
    return result


# --------------------------
# validateAction Tool
# --------------------------
@server.tool()
def validateAction(action: dict, contract: dict):
    """
    Validate a single action against the contract.

    Pure structural validation.
    """
    result = validate_action(action, contract)
    return result


# --------------------------
# generate Tool
# --------------------------
@server.tool()
def generatePipeline(actions: list[dict]):
    """
    Deterministically generate the full pipeline sequence.

    `stably.generate()` returns a Python generator — MCP cannot stream
    Python iterators — so we materialize the full list before sending.

    This does NOT validate. Call validatePipeline first.
    """
    stream = list(generate(actions))
    return {"sequence": stream}


# --------------------------
# Entrypoint
# --------------------------
def run():
    """
    Run the MCP server.

    Stateless: every call is isolated.
    """
    server.run()


if __name__ == "__main__":
    run()
