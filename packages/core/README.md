# @stably/core

**Stably** is a small, pure functional substrate for building **deterministic, contract-driven pipelines**.
It is domain-agnostic, side-effect free, and designed to serve as the *structural core* of agent-orchestrated systems—particularly those that validate, execute, and repair workflows dynamically.

Stably provides three foundational capabilities:

1. **`validatePipeline()`** — validate a full pipeline instance against a structural contract
2. **`validateAction()`** — validate a single action against the contract
3. **`generate()`** — produce a deterministic generator over a validated pipeline instance

Optionally, Stably includes **`createValidator()`** for ergonomic contract preloading.

Stably does **not** interpret semantics, perform side effects, or know anything about MCP servers, agents, or domain logic. Those belong to your orchestrators and workers.

---

## Features

* **Functional Core** — all Stably primitives are pure, deterministic functions
* **Strongly Typed** — pipeline contracts and actions are type-safe and domain-extensible
* **Domain Agnostic** — no assumptions about MCP tooling, business logic, or evaluators
* **Deterministic Execution** — pipelines are treated as immutable values, walked by a pure generator
* **Composable** — integrates naturally with orchestrator loops, agent systems, and eval pipelines

---

## Installation

```bash
pnpm add @stably/core
# or
npm install @stably/core
# or
yarn add @stably/core
```

---

## Core Concepts

### Pipeline Actions

A *pipeline action* is a simple domain-defined object with at minimum a `type` field.

```ts
export interface StorefrontAction {
  type: 'prism.generateDocs' | 'prism.verifyContracts';
  payload: { component: string };
}
```

Stably treats actions as **data**, not behavior.

### Pipeline Contract

A *pipeline contract* defines:

* the set of allowable steps
* how actions map to steps
* allowed transitions
* structural invariants (required steps, ordering, allowed action types, etc.)

Example:

```ts
export interface StorefrontPipelineContract
  extends StablyContract<StorefrontAction> {
  id: 'storefront.docsPipeline';
  steps: [
    { id: 'generateDocs', actionType: 'prism.generateDocs' },
    { id: 'verifyContracts', actionType: 'prism.verifyContracts' }
  ];
  structural: {
    requiredSteps: ['generateDocs', 'verifyContracts'];
    allowedActionTypes: ['prism.generateDocs', 'prism.verifyContracts'];
  };
}
```

The contract enforces **structure**, not semantics.

---

## API Overview

### `validatePipeline(actions, contract)`

Validates a full array of actions (a **pipeline instance**) against a **StablyContract**.

```ts
const result = validatePipeline(actions, storefrontContract);

if (!result.ok) {
  console.error(result.errors);
  throw new Error('Pipeline structure invalid.');
}
```

Checks include:

* illegal action types
* missing required steps
* order constraints
* illegal transitions
* structural rules defined by the contract

This function **must succeed** before calling `generate()`.

---

### `validateAction(action, contract)`

Validates a **single** action against the pipeline contract.

Useful inside an orchestrator loop as a lightweight local guard.

```ts
const check = validateAction(action, storefrontContract);

if (!check.ok) {
  console.error(check.errors);
  throw new Error('Action invalid for this contract.');
}
```

This does **not** replace `validatePipeline()`.

---

### `generate(actions)`

Creates a deterministic **generator** over the validated actions array.

```ts
const generator = generate(actions);

let current = generator.next();
while (!current.done) {
  const action = current.value;
  // delegate to a worker agent, run evals, etc.
  current = generator.next();
}
```

Important notes:

* Stably does not modify, filter, or interpret the list.
* The generator has no side effects.
* Calling `.return()` signals early termination.

---

### `createValidator(contract)`

Optional ergonomic helper for preloading the contract:

```ts
const validator = createValidator(storefrontContract);

validator.validatePipeline(actions);
validator.validateAction(action);
```

This pattern is useful for orchestrators that operate on the same contract for many runs.

---

## Typical Usage

Below is a complete consumer example.

```ts
import {
  generate,
  validatePipeline,
  createValidator,
  type StablyAction,
  type StablyGenerator
} from '@stably/core';

import type {
  StorefrontAction,
  StorefrontPipelineContract
} from '@prism/storefront';

declare const storefrontContract: StorefrontPipelineContract;

// 1. Build a pipeline instance
const actions: StablyAction<StorefrontAction>[] = [
  { type: 'prism.generateDocs', payload: { component: 'Button' } },
  { type: 'prism.verifyContracts', payload: { component: 'Button' } }
];

// 2. Validate the entire pipeline instance
const structural = validatePipeline(actions, storefrontContract);
if (!structural.ok) throw new Error(structural.errors.join('\n'));

// 3. Generate a deterministic generator
const generator: StablyGenerator<typeof actions> = generate(actions);

// 4. Consume the pipeline
let current = generator.next();
while (!current.done) {
  const action = current.value;

  // optional: validate per action
  const perAction = validateAction(action, storefrontContract);
  if (!perAction.ok) throw new Error(perAction.errors.join('\n'));

  // delegate to worker, run evals, etc.
  // ...

  current = generator.next();
}
```

Stably never executes actions or interprets results—**that is the orchestrator’s job**.

---

## Why Determinism Matters

Stably is designed for agentic systems where:

* an orchestrator may rebuild pipelines dynamically
* evals may enforce semantic correctness
* workers may produce nondeterministic outputs
* retries, corrections, or insertions may occur at runtime

A Stably pipeline instance is **pure data**.
`generate()` is a **pure stream**.
Replaying the pipeline always yields the exact same sequence.

This keeps AI-augmented systems:

* testable
* inspectable
* auditable
* safe

And prevents “agent drift” by enforcing structural invariants up front.

---

## Design Philosophy

Stably follows three principles:

1. **Pure Core**
   No side effects, no hidden state, no I/O, no dynamic context.

2. **Contracts Govern Structure**
   Domains define their own pipeline contracts; Stably only enforces them.

3. **Deterministic Pipelines**
   Pipelines are immutable values, not processes. The orchestrator controls execution.

---

## When to Use Stably

Use Stably when you need:

* a deterministic blueprint for orchestration
* contract-driven pipelines
* safe agent workflows
* structured validation before execution
* repeatable, testable process definitions

Do **not** use Stably when you need:

* semantics, business logic, permissions
* side-effects or API calls
* run-time decision making (belongs in orchestrator)
* tool invocation (belongs in MCP servers / workers)

---

## License

MIT © 2025

---

## Contributing

PRs welcome. All functions must remain:

* pure
* deterministic
* domain-agnostic

Please open an issue before adding new contract fields or expanding surface area.
