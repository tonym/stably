# CODEGEN

This document defines how automated agents **generate and edit code** in this repository.

It extends, but does not override, the rules in:

- `/AGENTS/ROOT.md` (Stably AGENTS Root Protocol)

If anything in this file appears to conflict with `ROOT.md`, **`ROOT.md` wins**. Codegen agents must treat both documents as binding.

---

## 1. Scope

This protocol applies whenever an automated agent is asked to:

- Create or edit source files (TypeScript, JavaScript, configuration, tests, examples, etc.).
- Generate or refactor documentation that describes code-level behavior.
- Propose changes to the `@stably/core` runtime or its surrounding tooling.

It **does not** change Stably’s runtime semantics. Stably remains:

- Pure
- Deterministic
- Domain-agnostic
- Structural-only (contracts + generators; no side effects)

Codegen agents operate *around* that core, not inside it.

---

## 2. Primary Goals

When generating or editing code in this repo, agents must optimize for:

1. **Preserving Stably’s invariants**

   - No side effects in core.
   - No hidden state.
   - No domain-specific semantics in `@stably/core`.

2. **Determinism and predictability**

   - The same inputs produce the same outputs.
   - Pipelines and validators are easy to reason about, test, and replay.

3. **Minimal, composable APIs**

   - Prefer small, orthogonal primitives over large frameworks.
   - Keep `@stably/core` narrow and focused.

4. **Human-auditable changes**

   - Changes should be easy to review, reason about, and roll back.
   - No “magic” behaviors that are hard to inspect.

---

## 3. When to Use /AGENTS/CODEGEN.md

Agents **must** treat this file as the canonical reference when:

- Generating or editing code in `packages/core`.
- Adding or modifying TypeScript types used by Stably.
- Creating examples or scaffolding that demonstrate Stably usage.
- Updating build, lint, or test configuration in a way that affects the core runtime.

If an agent is only editing non-code content (e.g. AGENTS docs, high-level README prose), they should still **respect ROOT.md**, but this file becomes advisory rather than strict.

---

## 4. Codegen Boundaries

### 4.1 `@stably/core` must remain pure

Within `packages/core`:

- ✅ Allowed:
  - Pure functions (`validatePipeline`, `validateAction`, `generate`, `createValidator`, and related helpers).
  - Type definitions and utilities that model contracts, actions, and generators.
  - Small, predictable helpers that operate on in-memory data.

- ❌ Forbidden:
  - I/O of any kind: file system, network, database, environment variables, etc.
  - Time-based logic (`Date.now()`, timers, randomness).
  - Global or mutable singleton state.
  - Domain-specific logic (business rules, MCP-specific behavior, tool invocation).

If a new feature requires any of the above, **it does not belong in `@stably/core`**. It should live in a separate package or consumer repo.

### 4.2 Contracts and actions stay domain-owned

Codegen agents **must not** move domain semantics into the core runtime.

- Contracts (`StablyContract<...>`) remain **runtime JSON(-like) data** owned by domains.
- `@stably/core` only knows enough to:
  - Check structure against the contract.
  - Produce a generator over an action sequence.

Any attempt to embed domain rules (business semantics, API endpoints, access controls, etc.) inside core types or functions is **out of bounds**.

---

## 5. TypeScript & Project Conventions

### 5.1 Language & tooling

- Primary implementation language: **TypeScript**.
- Use the existing **tsconfig** settings as the source of truth.
- Respect linting and formatting rules defined by:
  - `.eslint.config.js`
  - `.prettierrc`

Codegen agents must:

- Emit TypeScript that compiles without `tsc` errors under the repo’s configuration.
- Avoid introducing new compiler options or lint rules unless explicitly requested, and then document the change clearly.

### 5.2 Style guidelines

Within `packages/core` and related TypeScript:

- Prefer **functions and types** over classes and inheritance.
- Favor **immutability**:
  - Do not mutate function arguments.
  - Return new values instead of modifying existing ones.
- Prefer **explicit types** when adding public APIs.
- Narrow types as much as possible, especially for:
  - `StablyAction` variants
  - Contract structures
  - Validation results

Example patterns to follow:

```ts
// Good: pure, explicit, no side effects
export function validatePipeline<TAction>(
  actions: readonly StablyAction<TAction>[],
  contract: StablyContract<TAction>,
): ValidationResult {
  // ...
}
```

---

## 6. Required Workflow for Codegen Agents

For any non-trivial code change (new feature, refactor, or bugfix), agents must conceptually follow this loop:

### 6.1 Plan

1. **Summarize the intent** of the change in a few sentences.
2. **List affected files** and the nature of changes (add/edit/remove).
3. **Check for relevant AGENTS files**:
   - `/AGENTS/ROOT.md` (always)
   - `/AGENTS/CODEGEN.md` (this file)
   - Any future domain-specific AGENTS documents.

### 6.2 Edit

1. Apply **small, deliberate edits** instead of large, sweeping rewrites.
2. Maintain **backwards compatibility** for public APIs unless the change is explicitly allowed to be breaking.
3. Preserve existing patterns:
   - Result shapes (`{ ok: boolean; errors?: string[] }`).
   - Naming conventions (`validate*`, `*Contract`, `*Action`).

### 6.3 Validate

Conceptually, agents should assume the following checks must pass:

- TypeScript compilation (`tsc`) for the relevant packages.
- Linting (ESLint) for changed files.
- Unit tests for any code paths that are modified or added (when present).

Even if the agent cannot actually execute these commands, it must:

- Write code that would reasonably pass them.
- Avoid patterns that obviously introduce errors (unused imports, undefined symbols, etc.).

### 6.4 Document

Whenever codegen introduces new behavior or modifies existing behavior:

- Update or add docstrings / comments where they clarify intent.
- Update relevant README or AGENTS files if the change affects:
  - Public APIs
  - Invariants
  - Expected agent workflows

Documentation must be **consistent with the actual behavior** of the code.

---

## 7. Tests and Examples

When adding or changing functionality in `packages/core`:

- Prefer to **add or update tests** next to the code under test.
- Tests should:
  - Demonstrate determinism and structural validation.
  - Avoid side effects and external dependencies.
- When creating **examples** (e.g., in `examples/` or consumer repos):
  - Clearly separate domain-specific code from the pure Stably core.
  - Show the recommended pattern:
    1. Build pipeline as data.
    2. `validatePipeline()`.
    3. `generate()` and iterate.
    4. Orchestrator delegates to workers and evals.

---

## 8. Interaction with AGENTS/ROOT.md

All codegen activity must remain aligned with the **role separation** defined in `ROOT.md`:

- **Contracts**: declared as runtime data; define structure and invariants.
- **Orchestrators**: consume contracts and pipelines; call Stably.
- **Workers**: perform side effects; never depend on Stably directly.
- **Evals**: assess results and guide orchestrator decisions.

Codegen agents must not:

- Collapse multiple roles into one “god object”.
- Move orchestrator or worker logic into `@stably/core`.
- Make Stably aware of eval results or external system state.

---

## 9. Things Codegen Agents Must Never Do

To preserve the integrity of this repository and the Stably core, codegen agents must **not**:

1. **Introduce side effects into `@stably/core`**

   - No file system, network, time, randomness, or process-level behavior.

2. **Change Stably’s conceptual model**

   - Pipelines remain arrays of actions.
   - Contracts remain structural.
   - Generators remain pure streams over action arrays.

3. **Bypass structural validation**

   - Do not create helper utilities that implicitly call `generate()` without requiring `validatePipeline()` first.
   - Do not add shortcuts that assume validity without checks.

4. **Rewrite AGENTS/ROOT.md behaviorally**

   - Updates to ROOT are allowed only to clarify or tighten constraints, not to weaken them.
   - Any codegen proposal that contradicts ROOT must be treated as invalid.

5. **Embed secrets or environment-specific configuration**

   - No hard-coded tokens, keys, endpoints, or machine-specific paths.
   - Configuration for consumers belongs in their own repos.

---

## 10. Extending the CODEGEN Protocol

When new codegen patterns or tools are introduced:

- Prefer adding **new AGENTS files** (e.g., `AGENTS/MCP.md`, `AGENTS/ORCHESTRATOR.md`) that build on ROOT and CODEGEN.
- Keep this file focused on:
  - Purity
  - Determinism
  - Structural correctness
  - Repo-local coding conventions

If a proposed change requires relaxing any rule in this document, agents must:

1. Make the conflict explicit.
2. Defer to human review to update the protocol.
3. Only proceed once the protocol itself has been updated to reflect the new rule.

Stably’s purpose is to keep agentic systems structurally safe and predictable.
Codegen in this repository exists to **support that purpose**, not to compromise it.
