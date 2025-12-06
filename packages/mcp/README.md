@stably/mcp

The `@stably/mcp` package provides a thin Model Context Protocol (MCP) server that exposes Stably’s **structural** APIs as MCP tools.

It lets orchestrating agents call the same primitives that `@stably/core` exports:

- `validatePipeline(actions, contract)`
- `validateAction(action, contract)`
- `generate(actions)`

The server is deliberately minimal:

- ✅ Pure, deterministic structural checks (via `@stably/core`)
- ✅ One MCP tool per Stably primitive
- ❌ No orchestration, retries, or business semantics
- ❌ No hidden validation or behavior overlap between tools

`@stably/mcp` is a **non-core** package in the Stably monorepo. The canonical runtime behavior remains in `@stably/core`.

---

## Tools

The MCP server exposes three stateless tools:

1. `stably.validate_pipeline` → `validatePipeline(actions, contract)`
2. `stably.validate_action` → `validateAction(action, contract)`
3. `stably.generate` → `generate(actions)`

Each tool is a direct, transparent wrapper around the corresponding `@stably/core` function:

- No tool calls another tool internally.
- No implicit validation inside `stably.generate`.
- No domain semantics, no side effects.

The **AGENTS root** protocol still applies:

> Orchestrators must call `validatePipeline()` successfully before calling `generate()`.

The MCP server does **not** enforce this rule at runtime; it simply exposes the primitives so callers can implement the protocol correctly.

---

## Tool: `stably.validate_pipeline`

Validate a full pipeline instance (an array of actions) against a contract.

### Parameters

The tool expects:

- `contract` — a runtime JSON contract object compatible with `StablyContract<TAction>`
- `actions` — an array of domain actions

```jsonc
{
  "contract": {
    "id": "ui-core.docsPipeline",
    "steps": [
      { "id": "generateDocs", "actionType": "ui-core.generateDocs" },
      { "id": "verifyContracts", "actionType": "ui-core.verifyContracts" }
    ],
    "structural": {
      "requiredSteps": ["generateDocs", "verifyContracts"],
      "allowedActionTypes": [
        "ui-core.generateDocs",
        "ui-core.verifyContracts"
      ]
    }
  },
  "actions": [
    {
      "type": "ui-core.generateDocs",
      "payload": { "component": "Button" }
    },
    {
      "type": "ui-core.verifyContracts",
      "payload": { "component": "Button" }
    }
  ]
}
```

### Response

On success:

```jsonc
{
  "ok": true,
  "errors": []
}
```

On structural failure (for example, missing required step):

```jsonc
{
  "ok": false,
  "errors": [
    "Missing required step: verifyContracts"
  ]
}
```

The server forwards whatever structural diagnostics `@stably/core` returns, preserving the `{ ok, errors[] }` shape.

---

## Tool: `stably.validate_action`

Validate a single action against a contract.

### Parameters

```jsonc
{
  "contract": {
    "id": "ui-core.docsPipeline",
    "steps": [
      { "id": "generateDocs", "actionType": "ui-core.generateDocs" },
      { "id": "verifyContracts", "actionType": "ui-core.verifyContracts" }
    ],
    "structural": {
      "requiredSteps": ["generateDocs", "verifyContracts"],
      "allowedActionTypes": [
        "ui-core.generateDocs",
        "ui-core.verifyContracts"
      ]
    }
  },
  "action": {
    "type": "ui-core.generateDocs",
    "payload": { "component": "Button" }
  }
}
```

### Response

```jsonc
{
  "ok": true,
  "errors": []
}
```

or, if the action is not allowed:

```jsonc
{
  "ok": false,
  "errors": [
    "Action type ui-core.deleteComponent is not allowed by this contract."
  ]
}
```

This is a **structural** check. It does **not** guarantee that the action is semantically appropriate; it only ensures that it fits the contract.

---

## Tool: `stably.generate`

Create and exhaust a deterministic generator over a pipeline instance.

This tool wraps `generate(actions)` from `@stably/core` **without** adding validation or contract knowledge. It assumes the caller has already followed the AGENTS protocol, including validating the pipeline first.

### Parameters

```jsonc
{
  "actions": [
    {
      "type": "ui-core.generateDocs",
      "payload": { "component": "Button" }
    },
    {
      "type": "ui-core.verifyContracts",
      "payload": { "component": "Button" }
    }
  ]
}
```

There is no `contract` parameter here because `generate()` in `@stably/core` does not know or care about contracts. It treats the actions as immutable data.

### Behavior

Internally, the MCP server:

1. Calls `generate(actions)` from `@stably/core`.
2. Exhausts the resulting generator.
3. Returns the resulting sequence.

It does **not**:

- Call `validatePipeline()` for you.
- Inspect or interpret action payloads.
- Add or remove actions.

### Response

```jsonc
{
  "sequence": [
    {
      "type": "ui-core.generateDocs",
      "payload": { "component": "Button" }
    },
    {
      "type": "ui-core.verifyContracts",
      "payload": { "component": "Button" }
    }
  ]
}
```

If `actions` is structurally invalid relative to some contract, that is a **caller error**. Per the AGENTS root protocol, orchestrators are responsible for calling `stably.validate_pipeline` before calling `stably.generate`.

Stably’s generator remains:

- Pure
- Deterministic
- Side-effect free

The MCP server preserves those properties exactly.

---

## How an orchestrator might use these tools

A canonical MCP-only orchestrator loop mirrors the examples in `@stably/core`:

1. **Construct a candidate pipeline**

   Build `actions[]` in your domain, plus a runtime contract object.

2. **Validate the pipeline**

   Call `stably.validate_pipeline`:

   ```jsonc
   {
     "tool": "stably.validate_pipeline",
     "params": {
       "contract": { /* domain contract JSON */ },
       "actions": [ /* pipeline actions */ ]
     }
   }
   ```

   - If `ok: false`, use `errors` to repair the plan and re-validate.
   - Only proceed when `ok: true`.

3. **Optionally validate individual actions**

   Orchestrators typically call stably.validate_action inside the pipeline execution loop, after each next() step, to structurally guard actions before delegating them to workers.

4. **Generate the deterministic sequence**

   Call `stably.generate`:

   ```jsonc
   {
     "tool": "stably.generate",
     "params": {
       "actions": [ /* same validated pipeline actions */ ]
     }
   }
   ```

   The response’s `sequence` field is the materialized view of what `generate(actions)` would yield.

5. **Run your own execution loop**

   Walk `sequence` locally:

   - Delegate actions to workers / tools.
   - Run evals after each step.
   - Decide to continue, retry, repair, or abort.

At no point does the MCP server act as an orchestrator or executor. It only surfaces Stably’s structural primitives over MCP.

---

## Relationship to `@stably/core`

`@stably/mcp` depends on `@stably/core` and must respect the Stably architectural canon:

- **Core invariants**

  - `@stably/core` remains:
    - pure
    - deterministic
    - side-effect free
    - domain-agnostic

  - Each core function has a single responsibility:
    - `validatePipeline()` validates a pipeline against a contract.
    - `validateAction()` validates a single action against a contract.
    - `generate()` walks the actions array as-is.

- **MCP layer**

  - `@stably/mcp`:
    - is allowed to run a process and host MCP tools
    - may log, perform I/O, and listen for connections
    - must not change the semantics of `validatePipeline`, `validateAction`, or `generate`
    - must not interpret domain semantics or mutate contracts

If you are in a TypeScript environment, prefer consuming `@stably/core` directly. Use `@stably/mcp` when:

- Your orchestrator environment can call MCP tools but not TypeScript directly.
- You want a shared structural substrate for multiple agents or processes.

---

## Running the server

> **Note:** Implementation details (CLI, config, etc.) are not finalized.

A likely integration pattern:

```bash
pnpm add @stably/mcp
```

Then start the server via a small script:

```ts
import { runStablyMcpServer } from '@stably/mcp';

runStablyMcpServer({
  // optional configuration:
  // port, logging, contract loading strategy, etc.
});
```

The server will register:

- `stably.validate_pipeline`
- `stably.validate_action`
- `stably.generate`

…as MCP tools, ready for consumption by compatible agent runtimes.

---

## When to use `@stably/mcp`

Use this package when:

- You need a **structural substrate** for pipelines in an MCP-based agent runtime.
- You want to centralize Stably’s validation and generator behavior behind MCP.
- You want to keep orchestrators and workers slim, while still enforcing the AGENTS root protocol.

Do **not** use this package when:

- You want a workflow engine, job scheduler, or task runner.
- You need business logic, permissions, or domain semantics.
- You intend to store long-lived pipeline state on the server or execute steps there.

Those responsibilities belong to your orchestrators, workers, and evals—not to Stably.

---

## License

MIT © 2025  
Non-core package of the Stably monorepo.
