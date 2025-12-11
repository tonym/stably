# stably-py

**Stably** is a small, pure, deterministic substrate for building contract-driven pipelines in Python.

It is domain-agnostic, side-effect free, and designed to serve as the structural core of orchestrator-based systems—particularly those that validate, execute, and repair workflows dynamically.

This package is the Python counterpart to `stably-ts`, providing the same deterministic primitives in a Pythonic runtime.

Stably provides three foundational capabilities:

- **`validate_pipeline()`** — validate an entire pipeline instance against a contract  
- **`validate_action()`** — validate a single action  
- **`generate()`** — produce a deterministic generator over a validated pipeline instance  

Optionally, **`create_validator()`** provides an ergonomic helper for preloading a contract.

Stably does not interpret semantics, run side effects, connect to MCP servers, or contain domain logic. Those belong to your orchestrators and workers.

---

## Features

- **Pure Functional Core** — all primitives are deterministic and side-effect free  
- **Domain Agnostic** — treats actions as plain data  
- **Deterministic Generators** — pipelines are immutable values walked by a pure generator  
- **Composable** — integrates naturally with orchestrator loops, agent systems, and eval workflows  

---

## Installation

```bash
pip install stably-core
# or for development:
pip install -e .[dev]
```

---

## Core Concepts

### Pipeline Actions

A pipeline action is a simple Python `dict` with at least a `type` field:

```python
from stably import Action

action: Action = {
    "type": "generate_docs",
    "payload": {"component": "Button"},
}
```

Stably treats actions as **data**, not behavior.

---

### Pipeline Contracts

A contract defines:

- allowable action types  
- required steps that must appear at least once  
- allowed transitions between steps  
- structural invariants that must hold for the pipeline  

Example contract:

```python
from stably import Contract

contract: Contract = {
    "id": "demo",
    "structural": {
        "allowed_action_types": ["a", "b", "c"],
        "required_steps": ["a", "c"],
        "allowed_transitions": {
            "a": ["b"],
            "b": ["c"],
        },
    },
}
```

Stably enforces structure, *not semantics*.

---

## API Overview

### `validate_pipeline(actions, contract)`

Validate a full pipeline instance:

```python
from stably import validate_pipeline

result = validate_pipeline(actions, contract)

if not result["ok"]:
    raise ValueError(result["errors"])
```

Checks include:

- illegal action types  
- missing required steps  
- illegal transitions  
- structural invariants  

---

### `validate_action(action, contract)`

Validate a single action:

```python
from stably import validate_action

check = validate_action(action, contract)

if not check["ok"]:
    raise ValueError(check["errors"])
```

Useful inside orchestrator loops as a lightweight guard.

---

### `generate(actions)`

Produce a deterministic generator:

```python
from stably import generate

gen = generate(actions)

for step in gen:
    # delegate to worker agents, apply evals, etc.
    ...
```

Notes:

- the generator never mutates the action list  
- iteration order is fixed  
- no caching or hidden state  

---

### `create_validator(contract)`

Preload a contract and reuse the validator:

```python
from stably import create_validator

validator = create_validator(contract)

validator.assert_valid_pipeline(actions)
validator.assert_valid_action(action)
```

This pattern is ideal for orchestrators running many pipelines against the same contract.

---

## Typical Usage Example

```python
from stably import (
    generate,
    validate_pipeline,
    validate_action,
    create_validator,
    Action,
)

contract = {
    "id": "docs",
    "structural": {
        "allowed_action_types": ["init", "write", "verify"],
        "required_steps": ["init", "verify"],
        "allowed_transitions": {
            "init": ["write"],
            "write": ["verify"],
        },
    },
}

actions: list[Action] = [
    {"type": "init", "payload": {}},
    {"type": "write", "payload": {"component": "Button"}},
    {"type": "verify", "payload": {}},
]

# 1. Validate the full pipeline
structural = validate_pipeline(actions, contract)
if not structural["ok"]:
    raise ValueError(structural["errors"])

# 2. Generate a deterministic stream
for action in generate(actions):
    # optional: validate per-action
    per_action = validate_action(action, contract)
    if not per_action["ok"]:
        raise ValueError(per_action["errors"])

    # delegate to a worker, run evals, etc.
    ...
```

---

## Why Determinism Matters

Stably is built for AI-augmented systems where:

- orchestrators may rebuild pipelines dynamically  
- retries or corrections may happen at runtime  
- workers may produce nondeterministic outputs  
- evals may enforce semantic correctness  

Stably treats pipelines as **immutable values**.  
Replaying the pipeline always yields the exact same sequence.

This ensures:

- testability  
- auditability  
- reproducibility  
- system-level safety  

---

## When to Use Stably

Use Stably for:

- deterministic orchestration  
- contract-driven pipelines  
- safe agent workflows  
- structured validation  
- repeatable process definitions  

Do **not** use Stably for:

- business logic  
- side effects or I/O  
- runtime decision-making  
- external tool invocation  

Those belong to orchestrators and domain workers.

---

## License

MIT © 2025

Contributions welcome—Stably must remain:

- pure  
- deterministic  
- domain-agnostic  
- contract-driven  

Please open an issue before expanding contract surface area.
