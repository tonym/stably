# Dependency Protocol (AGENTS/DEPS.md)

This document defines how automated agents MUST manage, modify, or reason about dependencies in the Stably repository.

Its purpose is to preserve Stably’s architectural invariants:

- Pure functional, deterministic core  
- No side effects or domain semantics inside `@stably/core`  
- Strict separation between core, orchestrators, workers, and evals  
- Minimal, auditable, stable dependency surface  

This file works *in combination with*:

- `/AGENTS/ROOT.md`
- `/AGENTS/CODEGEN.md`
- `/AGENTS/SCOPE.md`
- `/AGENTS/ESCALATION.md`

If any rule here appears to conflict with ROOT.md, **ROOT.md wins**.

---

## 1. Scope

This protocol applies to any automated agent action that involves:

- Adding, removing, or updating dependencies in `package.json`
- Modifying TypeScript configuration that affects module resolution
- Introducing new packages to any workspace folder
- Changing versions of existing dependencies or devDependencies
- Proposing internal package relationships within the Stably repo

Agents must treat dependency changes as **structural modifications** requiring explicit justification, narrow scope, and deterministic impact.

Agents MUST NOT perform dependency changes without explicit instruction.

---

## 2. Dependency Philosophy

Stably’s dependency model is intentionally minimal.

### 2.1 Core Principle
`@stably/core` must depend **only on packages that do not introduce:**

- side effects  
- environment access  
- nondeterminism  
- domain-specific semantics  
- observable behaviors outside pure computation  

### 2.2 Acceptable dependencies for `@stably/core`

These are allowed:

- TypeScript (a dev-only dependency)
- Utility/typing packages that provide *pure compile-time types*  
- Minimal runtime utilities, but only if they are:
  - pure functions,
  - dependency-free themselves,
  - fully deterministic.

### 2.3 Forbidden dependencies for `@stably/core`

Agents MUST NOT introduce dependencies that perform or require:

- I/O (fs, net, http)
- Randomness or time
- Node.js environment features
- Browser environment features
- Validation libraries with side effects or implicit coercion
- Schema engines with runtime execution semantics
- Frameworks or orchestration tooling
- Testing libraries beyond the established project tooling

If a desired feature requires such a dependency, it MUST be implemented *by consumers*, not inside Stably.

---

## 3. Dependency Boundaries by Package

### 3.1 `packages/core`

Agents MUST treat this package as **pure and sealed**.

Allowed:
- Type-level utilities
- Internal helpers
- Minimal pure runtime utilities (rare and must be justified)

Forbidden:
- Any new runtime dependency unless explicitly approved through human review
- Any dependency that requires bundling, environment assumptions, or initialization logic

### 3.2 Example or future workspace packages

These may depend on:

- MCP tooling  
- Orchestrator frameworks  
- File or network utilities  
- Domain-specific packages  

BUT agents must not:

- Move such dependencies into `packages/core`
- Allow them to influence `core` types, invariants, or behavior

---

## 4. Rules for Adding Dependencies

Agents MUST follow this process before adding any dependency:

### 4.1 Justification Requirements
Every new dependency proposal MUST include:

- Why the dependency is needed  
- Whether the functionality can be expressed with pure TypeScript  
- Why the dependency does not violate ROOT.md invariants  
- Which workspace package will own it  

If justification cannot be clearly articulated, the dependency MUST be rejected.

### 4.2 Safety Checks
Agents MUST reason through:

- determinism  
- absence of side effects  
- bundle impact  
- TypeScript compatibility  
- version stability  

If any check fails: **abort** (per ESCALATION.md).

---

## 5. Rules for Updating Dependencies

### 5.1 Allowed Updates
Agents may update dependencies **only** when:

- explicitly instructed  
- updating dev-only tooling (e.g., TypeScript, ESLint)  
- addressing security patches  
- resolving incompatibilities that block compilation  

### 5.2 Forbidden Updates
Agents MUST NOT update dependencies:

- opportunistically  
- for cosmetic/tooling preference  
- to major versions without explicit instruction  
- across the entire workspace unless instructed  

Major updates MUST be controlled by a human because they risk:

- type changes  
- runtime differences  
- nondeterministic interactions  

---

## 6. Removing Dependencies

Removal is allowed only when:

- the dependency is unused  
- the dependency violates purity or determinism  
- the package it belonged to no longer needs that capability  
- removal does not break the expected contract model  

Agents MUST verify that removal does not introduce:

- type errors  
- dead code  
- implicit semantic changes  

---

## 7. Versioning and Lockfiles

Agents MUST:

- Respect the existing version ranges  
- Maintain semver-compatible updates unless explicitly instructed  
- Preserve lockfile accuracy (never modify manually)  

Agents MUST NOT:

- Change lockfile entries without changing `package.json`  
- Introduce version drift  
- Add resolutions or overrides without instruction  

---

## 8. Dependency Drift Control

Agents must enforce deterministic dependencies:

- No duplicate versions unless unavoidable  
- No transitive dependencies that introduce side effects  
- No implicit peer dependencies  
- No environment-dependent dependencies  

If dependency drift appears (e.g., type mismatches, transitive side effects), the agent MUST:

- Stop  
- Trigger escalation (per ESCALATION.md)  
- Provide a diagnostic summary  

---

## 9. Forbidden Actions

Agents MUST NOT:

- Add dependencies to `@stably/core` that could introduce side effects  
- Add orchestrator, worker, or eval libraries to core  
- Modify dependencies in consumer repos  
- Modify domain contracts or contract tooling  
- “Upgrade everything at once”  
- Add speculative or unused dependencies  
- Introduce build complexity (bundlers, CLI frameworks, transpilers)

These are violations of ROOT, CODEGEN, and SCOPE.

---

## 10. When to Escalate

Agents MUST escalate (and stop) when:

- A dependency appears to violate purity or determinism  
- A dependency performs runtime validation or schema interpretation  
- A requested change contradicts ROOT.md  
- Versioning constraints cannot be resolved cleanly  
- A human decision is required for tradeoffs (e.g., library choice)

Escalation protocol must follow `/AGENTS/ESCALATION.md`.

---

## 11. Summary

The Stably dependency surface MUST remain:

- minimal  
- pure  
- deterministic  
- auditable  
- domain-agnostic  

Dependencies are not conveniences—they shape the stability and predictability of the entire agentic system.  
Agents MUST treat them as architectural artifacts governed by strict protocol.
