# Stably

**Stably** is a minimal, pure functional substrate for building **deterministic, contract-driven pipelines** in TypeScript.
It is designed for systems where **orchestrators**, **workers**, and **evals** collaborate to execute and repair workflows — but where the structural core must remain **predictable, inspectable, and side-effect free**.

Stably provides:

* A **pure validation layer** (`validatePipeline`, `validateAction`)
* A **deterministic generator** (`generate`) for walking action sequences
* A **contract model** for describing allowed actions and structural invariants
* A growing set of **AGENTS specifications** defining how automated agents should use and modify Stably

Stably does **not** run workflows, call APIs, interpret semantics, or manage tools.
It exists to guarantee *structure* — not *execution*.

---

## Why Stably?

Modern agentic systems often mix:

* nondeterministic model behavior
* dynamic planning
* runtime corrections or retries
* domain-specific tool calls
* safety and evaluation layers

Without a deterministic core, these systems drift quickly and become untestable.

Stably solves that by enforcing three principles:

### 1. **Pipelines are pure data**

A pipeline is an ordered array of domain actions.
Stably never mutates, filters, or interprets them.

### 2. **Contracts govern structure**

Domains define contracts that specify:

* allowed action types
* required steps
* ordering or transitions
* structural invariants

Stably enforces these rules *exactly as written*.

### 3. **Execution belongs outside Stably**

Orchestrators walk pipelines.
Workers execute them.
Evals assess results.

Stably remains deterministic and side-effect free.

---

## Core Package: `@stably/core`

The core runtime lives in [`packages/core`](./packages/core).

It exposes three primitives:

### `validatePipeline(actions, contract)`

Checks that:

* all actions are allowed
* required steps appear
* ordering constraints are respected
* structural invariants hold

Must succeed before calling `generate()`.

### `validateAction(action, contract)`

Lightweight single-action validation.
Useful inside an orchestrator loop.

### `generate(actions)`

Returns a **pure ES6 generator** that yields the sequence exactly as provided.
No filtering, no branching, no side effects.

### `createValidator(contract)`

Ergonomic helper to preload a contract and reuse validators.

See the [core README](./packages/core/README.md) for detailed examples and typing guidance.

---

## Contract Model

Contracts are **runtime JSON objects** defining:

* the pipeline ID
* step definitions
* allowed action types
* structural rules

They are typed using `StablyContract<ActionType>` or domain extensions of it.

Stably never infers missing rules.
Domains are responsible for defining correct structure.

---

## The AGENTS Protocol

Automated agents that interact with this repository must follow the specifications in the [`/AGENTS`](./AGENTS) directory.

Current protocol files include:

* **ROOT.md** — What Stably is and is not; global invariants and role separation
* **CODEGEN.md** — Rules for agents generating or modifying Stably code
* **PR.CREATE.md** — How agents prepare and submit pull requests
* **PR.REVIEW.md** — How agents review diffs before approval

These constraints ensure that AI-augmented development remains:

* deterministic
* safe
* auditable
* aligned with Stably’s design philosophy

Future additions (e.g., EVALS, MCP, orchestrator patterns) will live here as well.

---

## Development Status

Stably is currently focused on:

* Finalizing the pure functional core
* Defining strict agent protocols
* Preparing for future integration with MCP servers and orchestrators
* Establishing robust test and codegen conventions

Upcoming work includes:

* A Stably MCP server package
* Example orchestrators using Stably as the structural substrate
* A suite of eval helpers (in a separate package)

---

## Contributing

Contributions are welcome — but with guardrails.

All changes must follow:

* **AGENTS/ROOT.md** for architectural invariants
* **AGENTS/CODEGEN.md** for code modifications
* **AGENTS/PR.REVIEW.md** for pull-request reviews
* Pure functional requirements (no side effects, no hidden state)

Before opening a PR, ensure:

* TypeScript builds cleanly
* Lint passes
* All tests pass
* Tests exist for any changed behavior

If unsure whether a change fits Stably’s philosophy, open an issue to discuss.

---

## License

MIT © 2025
Stably is open source and free to use in both commercial and non-commercial systems.
