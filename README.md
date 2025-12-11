# Stably

(Stably is pre-release and is not yet available on NPM or PiPI)

**Stably** is a minimal, pure functional substrate for building **deterministic, contract-driven pipelines** across languages and runtimes.

It is a **multi-package monorepo** consisting of:

- **`packages/stably-ts`** — The TypeScript core runtime (formerly `@stably/core`)
- **`python/stably-py`** — A Python port of the same deterministic substrate
- **`packages/stably-mcp`** — A stateless MCP server exposing Stably validation and generator capabilities

Across all packages, Stably guarantees the same invariant:

> **Stably provides structure, not execution.**  
> Pipelines are pure data. Contracts govern structure.  
> Orchestrators, workers, and evals live outside Stably.

Stably does **not** run workflows, call APIs, interpret domain semantics, or manage tools.  
It exists to ensure that pipelines remain **predictable, inspectable, and side-effect free**.

---

## Monorepo Packages

### **1. `stably-ts` — TypeScript core runtime**

Located at: `packages/stably-ts`

Provides:

- `validatePipeline(actions, contract)`
- `validateAction(action, contract)`
- `generate(actions)` — a pure ES6 generator
- `createValidator(contract)`

This package is the canonical reference implementation of Stably’s deterministic substrate.

---

### **2. `stably-py` — Python core runtime**

Located at: `python/stably-py`

A feature-complete Python implementation of Stably’s core concepts:

- Pure validation of pipeline structure
- Deterministic stepping through action sequences
- Zero interpretation, side effects, or domain logic

It mirrors the TS API surface closely, enabling agents, orchestrators, and toolchains to use Stably in Python ecosystems.

---

### **3. `stably-mcp` — MCP Server (stateless)**

Located at: `packages/stably-mcp`

A stateless Model Context Protocol server that exposes:

- Pipeline validation
- Pipeline generation (step iteration)
- Structural inspection utilities

This server allows external agents—Prism orchestrators, developer tools, editors, CI systems—to consume Stably pipelines over MCP without embedding Stably directly.

---

## What Stably Provides

* A **pure validation layer** for structural correctness
* A **deterministic generator** that yields actions exactly as written
* A **contract model** describing allowed actions and invariants
* A governed set of **AGENTS specifications** defining how automated agents should interact with the repo

Stably enforces three core principles:

### 1. **Pipelines are pure data**

An ordered array of `{ type, payload }`.  
No filtering, mutation, or interpretation.

### 2. **Contracts govern structure**

Domains define:

- allowed action types  
- required steps  
- transitions and ordering  
- structural invariants  

Stably enforces these *exactly as written*.

### 3. **Execution belongs outside Stably**

- Orchestrators walk pipelines  
- Workers perform side effects  
- Evals assess results  

Stably remains deterministic and side-effect free.

---

## Development Status

Stably’s architecture, core runtime, and monorepo structure are **feature complete**.  
Upcoming work includes:

- Expanding the Python core with tests and packaging
- Finishing the MCP server wrapper and tools
- Adding orchestrator and eval examples in a separate package
- Performance and diagnostics improvements

Stably is stable enough for real systems and agentic pipelines, but intentionally remains at a pre-versioned state until integration examples are complete.

---

## License

MIT © 2025
Stably is open source and free to use in commercial and non-commercial systems.


