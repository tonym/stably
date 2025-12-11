# Dependency Protocol (AGENTS/DEPS.md)

- `/AGENTS/CODEGEN.md`
- `/AGENTS/SCOPE.md`
- `/AGENTS/ESCALATION.md`

If any rule here appears to conflict with `ROOT.md`, **ROOT.md wins**.

---

## 1. Scope

This protocol applies to any automated agent action that involves:

- Adding, removing, or updating dependencies in `package.json`
- Adding, removing, or updating dependencies in `pyproject.toml`
- Modifying TypeScript configuration that affects module resolution
- Modifying Python tooling configuration that affects import resolution (e.g. `pythonpath`, editable installs)
- Introducing new packages to any workspace folder
- Changing versions of existing `dependencies`, `devDependencies`, or Python extras
- Proposing internal package relationships within the Stably repo

Agents must treat dependency changes as **structural modifications** requiring:

- explicit justification,
- narrow scope, and
- deterministic impact.

Agents MUST NOT perform dependency changes without explicit instruction.

---

## 2. Dependency Philosophy

Stably’s dependency model is intentionally minimal.

### 2.1 Core Principle

Both `stably-ts` and `stably-core` must depend **only on packages that do not introduce:**

- side effects
- environment access
- nondeterminism
- domain-specific semantics
- observable behaviors outside pure computation

The core libraries are **pure substrates**. Orchestrators and consumers own side effects.

### 2.2 Acceptable dependencies for `stably-ts`

These are allowed:

- TypeScript (dev-only)
- Utility/typing packages that provide *pure compile-time types*
- Minimal runtime utilities, but only if they are:
  - pure functions,
  - dependency-free themselves, and
  - fully deterministic and domain-agnostic.

### 2.3 Forbidden dependencies for `stably-ts`

Agents MUST NOT introduce dependencies that perform or require:

- I/O (`fs`, `net`, `http`, fetch-like APIs)
- Randomness or time
- Node.js environment features
- Browser environment features
- Validation libraries with side effects or implicit coercion
- Schema engines with runtime execution semantics
- Frameworks or orchestration tooling
- Testing libraries beyond the established project tooling
- Any MCP, LLM, or agent-specific runtime

If a desired feature requires such a dependency, it MUST be implemented **by consumers**, not inside `stably-ts`.

### 2.4 Acceptable dependencies for `stably-core` (Python)

`python/stably-py` (`stably-core` on PyPI) is the Python mirror of the same philosophy:

Allowed:

- The Python standard library
- Minimal, pure, deterministic helpers with no I/O or environment access
- Dev-only tooling such as:
  - `pytest` (and plugins approved in this repo)
  - packaging/build tools explicitly required by `pyproject.toml`

Forbidden in `stably-core` runtime dependencies:

- Networking, HTTP clients, or database drivers
- Filesystem access
- Time or randomness utilities beyond what is required for tests
- Frameworks, ORMs, or orchestration layers
- LLM/agent/MCP-specific runtimes
- Heavy runtime type/validation frameworks with implicit coercion

As with `stably-ts`, any domain- or environment-specific logic belongs in **consumer code**, not in `stably-core`.

---

## 3. Workspace Boundaries

### 3.1 `packages/stably-ts`

Agents MUST treat this package as **pure and sealed**.

Allowed:

- Type-level utilities
- Internal helpers
- Minimal pure runtime utilities (rare and must be justified in-context)
- Dev tooling that:
  - is already established in the repo, or
  - is explicitly requested by a human with a rationale

Forbidden:

- Any new runtime dependency unless explicitly approved through human review
- Any dependency that requires bundling, environment assumptions, or initialization logic
- Any dependency that couples `stably-ts` to MCP, LLM, or agent infrastructure

### 3.2 `python/stably-py` (`stably-core`)

Agents MUST treat this package as the **Python core substrate** with the same purity guarantees.

Allowed:

- `pytest` and minimal test tooling as configured in `pyproject.toml`
- Pure helper utilities that do not introduce I/O, environment access, or nondeterminism
- Editable install + extras used strictly for dev/test (e.g. `.[dev]`)

Forbidden:

- Adding runtime dependencies that perform I/O, networking, or process control
- Introducing frameworks, ORMs, or orchestration runtimes
- Pulling in LLM clients, MCP servers, or agent frameworks
- Adding heavy validation or schema engines as runtime requirements

If additional Python tooling is needed for **examples, MCP servers, or orchestrators**, it MUST live in a separate package or directory (e.g. a future `stably-mcp`), **not** in `python/stably-py`.

### 3.3 Example or future workspace packages

Example or future packages may depend on:

- MCP tooling
- Orchestrator frameworks
- File or network utilities
- Domain-specific packages

BUT agents must not:

- Move such dependencies into `packages/stably-ts`
- Move such dependencies into `python/stably-py`
- Introduce cross-package dependencies that make the core packages depend on examples, MCP layers, or orchestrators

Core packages (`stably-ts`, `stably-core`) must remain **leaf-agnostic**: they can be depended on, but they do not depend on domain layers.

---

## 4. Agent Workflow for Dependency Changes

### 4.1 Preconditions

Before changing any dependency file (`package.json`, `pyproject.toml`, etc.), agents MUST:

1. Check for existing references in:
   - `AGENTS/DEPS.md`
   - `AGENTS/CODEGEN.md`
   - `AGENTS/SCOPE.md`
2. Explain *why* the change is needed in the PR description or commit message.
3. Confirm the change does not violate the purity guarantees for core packages.

If there is any ambiguity, agents MUST assume **the change is not allowed** and escalate per `AGENTS/ESCALATION.md`.

### 4.2 Safe operations

The following are generally safe **when explicitly requested** by a human and when they do not violate earlier sections:

- Bumping dev-only tooling versions within the same major range (e.g. `pytest` 8.x → 8.y).
- Adding test-only utilities to `devDependencies` or Python extras **outside** core runtime paths.
- Updating TypeScript or Python tooling versions already in use.

Even for these, agents MUST:

- keep diffs minimal,
- avoid opportunistic refactors in the same change, and
- ensure tests still run via the documented commands (e.g. `pnpm test`, `make python-test`).

### 4.3 Changes requiring explicit human review

Agents MUST treat these as **high-risk** and require explicit human approval (via issue/PR comments or instructions):

- Adding new runtime dependencies to `packages/stably-ts`
- Adding new runtime dependencies to `python/stably-py`
- Introducing new workspace-level tooling (e.g. new test runners, build tools)
- Changing module resolution strategies (TS `paths`, Python `pythonpath`, etc.)
- Adding transitive couplings between core packages and domain-specific packages

For such changes, agents should:

- Propose the change,
- Document rationale and alternatives,
- Wait for human approval before merging.

---

## 5. Examples

### 5.1 Allowed

- ✅ Add `pytest>=8.0.0` to the `dev` extra in `python/stably-py/pyproject.toml` when setting up tests, if not already present and explicitly requested.
- ✅ Bump `typescript` dev dependency in `packages/stably-ts` from `5.5.x` to `5.6.x` to match project tooling, with tests passing.
- ✅ Add a lightweight, pure utility package for types or compile-time helpers in `packages/stably-ts`, when justified.

### 5.2 Forbidden

- ❌ Add `axios`, `node-fetch`, or similar HTTP clients to `packages/stably-ts` or `python/stably-py`.
- ❌ Add ORM/frameworks (
