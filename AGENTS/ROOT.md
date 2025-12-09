# Stably AGENTS Root Protocol

This document defines the canonical rules governing how **agents**—orchestrators, workers, refactorers, codemods, evaluation agents, and repository automation—interact with the Stably project.

It sits at the **top of the AGENTS hierarchy**. If any other protocol appears to conflict with this file, **ROOT.md wins**.

Stably’s architectural stance is narrow and intentional:

> **Stably is a pure functional substrate for deterministic, contract-driven pipelines.  
> It validates structure and generates sequences. It never performs behavior.**

This file establishes the guardrails that keep Stably deterministic, safe, and maintainable across languages, runtimes, and orchestrator ecosystems.

---

## 0. Protocol Loading Requirement

Before performing **any** task in this repository—including analysis, refactor, code generation, test creation, dependency updates, or PR workflows—agents **must** load the complete AGENTS suite.

Agents must perform the following steps **in order**:

1. **Read this file first** (`AGENTS/ROOT.md`).  
2. Then load every protocol document in `/AGENTS`, including:
   - `SCOPE.md` — domain boundaries, ownership, and what agents may touch  
   - `DEPS.md` — dependency rules  
   - `CODEGEN.md` — code-generation, test patterns, and rewrite limits  
   - `PR.CREATE.md` — how to create PRs  
   - `PR.REVIEW.md` — how to review diffs  
   - `ESCALATION.md` — when agents must stop and escalate  
   - `SECURITY.md` — security posture and required safety checks  
3. Internalize all constraints.  
4. Refuse or halt tasks that violate any rule in the loaded protocol set.

This step prevents architectural drift, nondeterministic rewrites, and dependency pollution.

**Agents must not modify the repo until all AGENTS documents have been loaded.**

---

## 1. Architectural Model

Stably sits inside the broader Prism hierarchy, which defines:

- a **hub-and-spoke architecture**,  
- **deterministic cores** with bounded nondeterminism at system edges, and  
- strict drift-control protocols.

Within that system:

- Stably is a **spoke**, not a hub.  
- It exposes a **deterministic substrate** that orchestrators and workers may depend on.  
- It owns **no side effects**, **no semantics**, and **no orchestration policies**.

Stably’s scope:

- Structural validation of pipelines  
- Deterministic sequence generation  
- Contract enforcement  
- Zero business logic  
- Zero runtime decisions  
- Zero I/O of any kind

If a behavior is dynamic, stateful, side-effectful, or environment-dependent, **it belongs to orchestrators—not Stably.**

---

## 2. Polyglot Substrate Model

Stably now includes **two parallel language runtimes** that must remain architecturally equivalent:

### 2.1 `stably-ts` (TypeScript)
- Resides in `packages/stably-ts`  
- Pure functional substrate for browser/Node agent systems  
- Previously known as `@stably/core`  

### 2.2 `stably-py` (Python)
- Resides in `python/stably-py`  
- Mirrors the TypeScript substrate in Python  
- Provides identical structural guarantees:
  - pure functions  
  - deterministic iteration  
  - contract-driven validation  
  - zero runtime dependencies  
  - no side effects  

### 2.3 What fails (violations)
- TS substrate calling into Python substrate  
- Python substrate importing or depending on TS substrate  
- Either substrate growing side effects, I/O, or semantics  
- Adding domain-specific intelligence (MCP, evals, AI models, etc.) inside substrate packages  

### 2.4 What works
- Parallel substrate implementations where:
  - each is pure  
  - each is deterministic  
  - each validates the same conceptual contract shape  
  - each exposes only the structural API:
    - `validate_pipeline`
    - `validate_action`
    - `create_validator`
    - `generate`

Substrate symmetry keeps orchestrators portable and prevents cross-language drift.

---

## 3. Deterministic Contract Execution

Stably enforces **structural determinism**:

- A pipeline is an **immutable value**.  
- A generator is a **pure walk** over that value.  
- Validation is **structural**, not semantic.  
- The pipeline **must replay identically** given the same input.

### 3.1 What fails
- Introducing caching, memoization, timestamps, randomness  
- Mutating actions or contracts at runtime  
- Inferring semantics beyond structural invariants  
- Adding side-effectful validation layers (I/O, network, file system)

### 3.2 What works
- Pure data flowing through deterministic validation  
- Generators that yield in fixed order and have no hidden state  
- Contracts expressed as JSON-like data structures  
- Orchestrators owning all interpretation and side effects

---

## 4. Agent Responsibilities

Agents interacting with Stably must follow these principles:

1. **Never add semantics, domain knowledge, or execution behavior to Stably.**  
2. **Preserve determinism.** Any code change must not modify ordering, iteration rules, or contract semantics.  
3. **Honor domain boundaries** as defined in `SCOPE.md`.  
4. **Respect purity rules** as defined in `DEPS.md`.  
5. **Avoid opportunistic refactors.** Only change what the user explicitly requests.  
6. **Escalate** when a change risks violating determinism or substrate purity.

---

## 5. Drift Control Rules

Drift control ensures the substrate remains stable over long time spans.

Agents must:

- Preserve API surface stability unless explicitly instructed  
- Maintain parity between TS and Python substrates  
- Avoid expanding contract fields unless approved  
- Refuse additions that change the conceptual model or widen substrate responsibilities  

If a change affects the conceptual model of Stably’s substrate, **agents must escalate immediately**.

---

## 6. Hub–Spoke Interaction Rules

Stably is a spoke. The hub is Prism.

**Agents must not reverse this dependency.**

### Forbidden:
- Adding dependencies from Prism projects into Stably  
- Making Stably reach into orchestrators, workers, PromptUI, MCP tooling  
- Expanding Stably’s responsibilities upward into reasoning or execution flows  

### Allowed:
- Orchestrators depend on Stably  
- Domain evaluators depend on Stably  
- MCP servers depend on Stably  
- Stably remains dependency-minimal and domain-agnostic  

---

## 7. File-Level Governance

### 7.1 Agents must follow:
- `CODEGEN.md` for transformations and file rewrites  
- `DEPS.md` for dependency changes  
- `SCOPE.md` for domain boundaries  
- `PR.*.md` for PR workflows  
- `ESCALATION.md` when uncertain  
- `SECURITY.md` at all times  

### 7.2 No agent may override or skip ROOT.md.

ROOT.md is the binding contract for how Stably evolves.

---

## 8. Summary (Define → Fail → Work)

### Define  
Stably is a deterministic, pure, contract-driven pipeline substrate maintained symmetrically in TypeScript and Python.

### Show what fails  
- Side effects  
- Runtime semantics  
- Cross-language coupling  
- Dependency growth  
- Implicit or nondeterministic behavior  
- Mutations of actions, contracts, or substrate state  

### Show what works  
- Pure structural validation  
- Deterministic sequence generation  
- JSON-like contract definitions  
- Parallel TS + Python substrates  
- Orchestrator-owned semantics and effects  
- Strict adherence to AGENTS protocols  

---

Agents must use this document as the root specification when operating anywhere inside the Stably repository.  
If in doubt: **do nothing, escalate, and request clarification.**
