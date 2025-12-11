# Root Makefile (Python only)
#
# This file is the hub for Python projects under ./python.
# Node/TS tasks live in package.json and are run via pnpm, not here.

.PHONY: python-test python-test-core python-install-core

# Run all Python tests for all Python projects.
# For now, this is just stably-py. When stably-mcp is added,
# extend this target to include its tests as well.
python-test: python-test-core

# Run tests for the stably-py core library
python-test-core:
	cd python/stably-py && pytest

# Install stably-py in editable mode with dev dependencies
python-install-core:
	cd python/stably-py && pip install -e .[dev]

.PHONY: stably-mcp-install stably-mcp-test stably-mcp-server

# Install stably-mcp in editable mode with dev extras (pytest, etc.)
stably-mcp-install:
	cd python/stably-mcp && pip install -e .[dev]

# Run the stably-mcp test suite
stably-mcp-test:
	cd python/stably-mcp && pytest

# Run the stably-mcp MCP server
stably-mcp-server:
	cd python/stably-mcp && python -m stably_mcp.server
