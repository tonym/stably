# SCOPE Protocol

This document defines **where automated agents may operate**, **what boundaries they may not cross**, and **how domain separation is preserved** across the Stably repository.

It inherits from `ROOT.md`.  
If any rule here appears to conflict with ROOT, **ROOT.md wins**.

Stably’s architectural safety depends on **narrow, predictable change surfaces**.  
Scope is the mechanism that prevents drift, protects substrate purity, and keeps polyglot implementations aligned.

---

## 1. Purpose of SCOPE

This protocol exists to:

- Define *exactly which directories and files* agents are permitted to modify  
- Define *which areas are strictly forbidden*  
- Prevent cross-domain or multi-intent PRs  
- Maintain deterministic substrate behavior across TypeScript and Python  
- Ensure updates remain local, minimal, and intentional  
- Protect Stably’s conceptual boundaries inside the broader Prism architecture  

**Scope is the first line of defense against architectural drift.**

---

## 2. Stably Domains

Stably is composed of two runtime substrates and their associated test/config surfaces:

1. **`packages/stably-ts`** — TypeScript substrate  
2. **`python/stably-py`** — Python substrate

Both must remain:

- deterministic  
- pure  
- domain-agnostic  
- structurally equivalent in conceptual behavior  
- free of side effects, I/O, semantics, or environment coupling  

Agents must treat these two packages as **parallel leaves** in the dependency DAG.

No runtime or build-time dependency may exist between them.

---

## 3. Allowed Edit Zones

Agents may modify files **only when explicitly instructed** or when a change is required by the narrow scope of the task.

### 3.1 `packages/stably-ts` (TypeScript substrate)

Allowed:

- `src/*.ts` — pure core logic  
- `src/types/*.ts` — structural type definitions  
- `src/validation/*.ts` — structural validators  
- `src/generator/*.ts` — deterministic generator logic  
- Adjacent test files when directly tied to modified code  
- `README.md` — only when public API surface changes  

Changes must preserve:

- purity  
- determinism  
- immutability  
- contract-driven structural constraints  

### 3.2 `python/stably-py` (Python substrate)

Allowed:

- `src/stably/*.py` — core Python substrate logic  
- `tests/*.py` — only for directly related modifications  
- `pyproject.toml` — only for requirements or minimal tool adjustments  
- `README.md` — only when API surface changes  

Changes must:

- mirror TS substrate conceptual behavior  
- keep runtime dependencies empty/minimal and pure  
- avoid semantics or environment coupling  

### 3.3 Root-Level Documentation

Agents may modify:

- `/AGENTS/*.md` — protocol layer definitions  
- `/README.md` — project-level API or architecture updates  

Agents may never modify AGENTS protocols unless explicitly instructed.

### 3.4 Configuration Files

Allowed **only when required by the task**, and only minimal updates:

- `tsconfig.*.json`  
- linting/formatting configs  
- Python tooling configs (`pyproject.toml`, `.flake8`, etc.)  
- Monorepo orchestration configs (e.g., `pnpm-workspace.yaml`)  

Configuration updates must not accompany unrelated code changes.

---

## 4. Forbidden Edit Zones

Unless explicitly instructed by a human, agents must **NOT** modify:

### 4.1 Domain Code Outside Stably

Forbidden:

- Any folder under `/packages/*` except `packages/stably-ts`  
- Any folder under `/python/*` except `python/stably-py`  
- PromptUI, orchestrator code, domain workers, MCP tools  
- Any file that introduces semantics, behavior, I/O, or nondeterminism  

### 4.2 GitHub Infrastructure

Forbidden:

- `.github/workflows/*`  
- repository-level CI/CD definitions  
- security policy files not explicitly assigned  
- release automation  

### 4.3 Build, Release, or Dependency Infrastructure

Forbidden unless explicitly authorized:

- `package.json` at the repo root  
- `pnpm-lock.yaml`  
- Node dependency trees outside stably-ts  
- Python dependency trees outside stably-py  

### 4.4 Cross-Language Integration

Agents must not:

- cause TS substrate to depend on Python substrate  
- cause Python substrate to depend on TS substrate  
- introduce shared build tooling that couples the two  
- merge conceptual models across the languages  

Each substrate must remain a **standalone leaf module**.

---

## 5. Polyglot Symmetry Enforcement

Stably’s TS and Python substrates must remain:

- structurally aligned  
- API-aligned  
- semantically equivalent at the structural level  

Agents must ensure:

- no API is added to one substrate without explicit instruction to coordinate parity  
- no validator/generator behavior diverges  
- no new contract field is introduced unilaterally  

### What fails

- Adding `validate_contract()` to Python but not TS  
- Introducing side-effect guards in TS but not Python  
- Changing iteration or error-shape semantics unequally  

### What works

- Parallel updates where logic is purely structural  
- Tests ensuring equivalent behavior  
- Documentation clarifying substrate symmetry  

---

## 6. Multi-Intent Restrictions

Agents must limit every PR or update to **one intent only**, such as:

- “Add contract validation rule”  
- “Refactor core generator implementation”  
- “Update documentation”  
- “Add missing test coverage”  

Forbidden:

- Changing TS and Python substrates *and* build configs *and* documentation in one PR  
- Updates that alter both domain logic and infrastructure  
- Co-mingling dependency changes with functional refactors  

When in doubt, agents must **split the work** or **escalate**.

---

## 7. Summary (Define → Fail → Work)

### Define  
Stably is composed of two pure, deterministic substrates—TS and Python—each a standalone leaf module in the Prism architecture.

### Show what fails  
- Cross-language dependencies  
- Side effects, semantics, or nondeterminism  
- Multi-intent PRs  
- Expanding substrate responsibilities  
- Editing forbidden domains  

### Show what works  
- Narrow, structural updates  
- Deterministic logic in isolated substrate modules  
- Documentation updates when explicitly requested  
- Maintaining TS/Python conceptual symmetry  
- Escalation when boundaries are unclear  

---

Agents must treat SCOPE.md as a binding contract.  
If a change may violate scope, the correct action is:  
**stop, refuse, escalate, and request clarification.**
