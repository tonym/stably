# SCOPE Protocol
This document defines **where automated agents may operate** within the Stably repository and the **strict boundaries** they must not cross.
It extends `/AGENTS/ROOT.md`, `/AGENTS/CODEGEN.md`, `/AGENTS/PR.CREATE.md`, and `/AGENTS/PR.REVIEW.md`.
If any rule in this file conflicts with ROOT, ROOT prevails.

Stably’s architecture depends on **narrow, predictable change surfaces**.
This protocol ensures agents modify only what is safe, intentional, and structurally coherent.

---

## 1. Purpose of SCOPE
The purpose of this protocol is to:

- Define *exactly which directories and files* agents may modify
- Define which areas are *completely forbidden*
- Prevent cross-domain or multi-intent changes
- Keep code edits narrow, deterministic, and auditable
- Protect Stably’s minimal surface area and architectural invariants

**Scope is where drift prevention begins.**

---

## 2. Allowed Edit Zones
Agents may only modify files when explicitly instructed or when required by the intent of the PR.

### 2.1 UI Package (`packages/stably-ts`)
Agents **MAY** modify:

- `src/*.ts` — pure functional core logic
- `src/types/*.ts` — type definitions
- `src/validation/*.ts` — structural validator logic
- `src/generator/*.ts` — generator helpers
- `README.md` — only when public API behavior changes
- Adjacent test files (`*.test.ts`) directly tied to changed code

All modifications must follow:

- purity and determinism
- immutability
- structural-only validation rules
- no domain semantics or side effects

### 2.2 Root Documentation
Agents **MAY** modify:

- `/AGENTS/*.md` — only when documenting new constraints or protocols
- `/README.md` — only when public behavior changes

### 2.3 Configuration Files
Agents **MAY** update:

- `tsconfig.json`
- linting / formatting configs
- build metadata

…but **only** when the change is required to support a valid, narrow PR intent.
Config updates MUST NOT accompany code changes unless necessary.

---

## 3. Forbidden Edit Zones
Agents must **NOT** modify the following under any circumstances unless explicitly instructed by a human:

### 3.1 Contract Definitions
Stably does **not** own domain contracts.

Agents MUST NOT edit:

- external domain repositories
- consumer-facing contract files
- example domain contracts except when explicitly told to create or update scaffolding

### 3.2 Orchestrator or Worker Logic
Agents MUST NOT modify:

- orchestrator implementations
- worker/MCP integration code
- eval logic

These are outside Stably’s scope and belong to consuming systems.

### 3.3 Build or Repository Plumbing
Agents MUST NOT edit:

- GitHub workflows
- CI/CD configuration
- package publishing scripts
- versioning automation

Unless specifically instructed.

### 3.4 Multi-Domain or Cross-Package Changes
Agents may not modify more than one package unless:

- the human explicitly directs the change,
- the change is mechanical (e.g., renaming a symbol across files), AND
- it remains within a single conceptual PR intent.

### 3.5 Unrelated Documentation
Agents may not update:

- wiki pages
- consumer docs
- examples unrelated to the PR purpose

No opportunistic or speculative edits.

---

## 4. Scope Rules for Tests
Agents may only modify tests that correspond to changed code.

They MUST NOT:

- update unrelated tests
- reorganize folders
- add new test suites beyond the PR’s intent

Tests exist to reflect code changes, not vice-versa.

### 4.1 Regression test scope

- Test changes are in scope only when they:
  - Directly exercise the behavior this task is fixing or adding, and
  - Are located in the same logical package/domain as the code change.
- It is acceptable for a focused regression test to target previously untested code **when** the test exists solely to reproduce or guard the bug being fixed.
- Any broader test additions or refactors remain out of scope and MUST trigger escalation under AGENTS/ESCALATION.md.

---

## 5. Scope of Refactors
Refactors are **forbidden** unless explicitly directed by a human.

Refactor includes:

- renaming functions
- reorganizing files
- deduplicating helpers
- rewriting types
- structural movement of modules

Agents MUST treat any unrequested refactor as out of scope.

---

## 6. Single-Intent Editing Requirement
Everything an agent edits must satisfy the rule:

> **One PR = One Intent = One Change Surface**

Agents MUST NOT:

- combine bugfixes with features
- update documentation unrelated to the code change
- batch multiple small improvements
- include cleanup edits

If the agent detects multiple potential change streams, it MUST escalate (see ESCALATION protocol).

---

## 7. Size-Based Scope Enforcement
Scope is tightly correlated to PR size:

- **Preferred:** < 300 changed lines
- **Maximum:** < 1000 changed lines (unless instructed otherwise)

Agents MUST treat exceeding these limits as a scope violation.

Large diffs suggest drift, ambiguity, or multi-intent behavior.

---

## 8. Drift Detection
Agents must treat any of the following as drift and therefore out of scope:

- touching orchestrator or worker code
- adding semantics to the core
- expanding Stably’s API surface
- embedding domain logic into contracts
- modifying behavior of `generate`, `validatePipeline`, or `validateAction` without explicit instruction
- removing test determinism
- renaming foundational types (`StablyAction`, `StablyContract`, etc.)

Drift MUST trigger escalation.

---

## 9. When Scope Is Uncertain
If an agent cannot determine whether a file is in scope, it MUST:

1. **Stop**
2. **Ask for human clarification**, or
3. **Escalate according to AGENTS/ESCALATION.md** (when available)

Ambiguity is not permission.

---

## 10. Summary
**Scope defines the safe boundaries of agent behavior.**
Agents must operate only where allowed, modify only what is necessary, and avoid all opportunistic or ambiguous edits.
Narrow scope ensures Stably remains:

- deterministic
- pure
- structurally minimal
- predictable across time

If any uncertainty arises, agents MUST escalate rather than guess.
