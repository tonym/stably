# python/stably-mcp/src/stably_mcp/__init__.py
from __future__ import annotations

"""
stably_mcp

A small, deterministic helper layer for wiring `stably` pipelines into
MCP-style servers.

This package stays deliberately narrow:

- It does **not** perform I/O or speak any transport.
- It does **not** depend on a specific MCP implementation.
- It **only** handles:
  - incremental, contract-driven pipeline construction
  - structural validation via `stably`
  - deterministic generation over a validated pipeline

Your MCP server (or any other orchestrator) is responsible for:

- receiving requests / tool calls
- mapping them into `stably.Action` values
- delegating execution to workers
- persisting or replaying `PipelineSession` state
"""

from .session import PipelineSession, create_session

__all__ = [
    "PipelineSession",
    "create_session",
]
