# stably-mcp

**stably-mcp** is a **stateless MCP (Model Context Protocol) server** that exposes the deterministic, side-effect–free primitives of **stably-py** as MCP tools.

It provides **no semantics, no I/O, no orchestration logic, and no state**. It is a thin, safe, pure pass-through layer over the Stably substrate, suitable for agent frameworks and orchestrators that communicate via MCP rather than Python imports.

---

## Features

### ✅ Pure Pass-Through API

The server exposes three tools, each mapped directly to the underlying `stably-py` functions:

* **validatePipeline** → `stably.validate_pipeline`
* **validateAction** → `stably.validate_action`
* **generatePipeline** → `stably.generate` (materialized into a list)

The server does **not** interpret, mutate, or transform the pipeline.

---

### ✅ Stateless by Design

Every tool invocation is completely isolated:

* No saved sessions
* No pipeline memory
* No caching or mutation
* No side effects

This ensures safety, reproducibility, and deterministic behavior.

---

### ✅ Deterministic

Because Stably is a pure, contract-driven substrate, all results are deterministic.

---

## MCP Tools

### **validatePipeline(actions, contract)**

Validate a full pipeline instance.

Returns a `ValidationResult`:

```json
{
  "ok": true,
  "errors": []
}
```

If invalid, the result contains a list of structural errors.

---

### **validateAction(action, contract)**

Validate a single action against the contract.

Useful for per-step validation inside a client orchestrator.

---

### **generatePipeline(actions)**

Returns the deterministic sequence of actions produced by `stably.generate`.

```json
{
  "sequence": [
    { "type": "init" },
    { "type": "write", "payload": {...} },
    { "type": "verify" }
  ]
}
```

⚠️ **No validation is performed here** — callers should validate beforehand.

---

## Example (Client Perspective)

```python
from mcp.client import MCPClient

client = MCPClient("stably-mcp")

# Validate
result = client.call("validatePipeline", actions=actions, contract=contract)
if not result["ok"]:
    raise ValueError(result["errors"])

# Generate
steps = client.call("generatePipeline", actions=actions)["sequence"]
```

---

## Running the Server

Local:

```bash
python -m stably_mcp.server
```

Docker:

```Dockerfile
FROM python:3.11-slim
WORKDIR /app

COPY . .
RUN pip install .

CMD ["python", "-m", "stably_mcp.server"]
```

---

## Design Principles

* **Infrastructure boundary only** — not an execution engine
* **Never** infers semantics or performs runtime decisions
* **Never** mutates or interprets pipeline values
* **Never** holds state between requests
* **Always** preserves separation between validation and orchestration

---

## Dependencies

* `stably-py` — deterministic pipeline substrate
* `mcp` — Python MCP reference implementation

---

## When to Use stably-mcp

Use this package when:

* A non-Python orchestrator must perform Stably validation
* You need a predictable MCP interface for pipeline structure checks
* You want a safe, pure, minimal boundary around Stably primitives

Do **not** use it for:

* Execution or semantic interpretation of pipeline steps
* Contract generation
* Stateful pipeline management
* Business logic or domain workflows

Those belong to your orchestrators and workers.

---

## License

MIT © 2025
