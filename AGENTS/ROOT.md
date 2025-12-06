# Stably AGENTS Root Protocol

This document defines how **agents** (orchestrators, workers, and tooling) are expected to use Stably. It does *not* change the runtime behavior of `@stably/core`; instead, it describes the rules and tradeoffs that keep Stably-based systems deterministic and safe.

Stably’s role is narrow and intentional:

> **Stably is a pure functional substrate for deterministic, contract-driven pipelines.
> It validates structure and generates sequences. It never executes behavior.**

Everything below assumes that separation of concerns is preserved.

---

## 0. Protocol Loading Requirement

Before performing **any** task in this repository — including analysis, code generation, refactors, test creation, dependency updates, or pull-request operations — agents **must** load and internalize all Stably protocol documents. This ensures deterministic behavior, prevents drift, and provides the full operational context before any modifications occur.

Agents must perform the following steps in order:

1. **Read this file first** (`AGENTS/ROOT.md`).  
2. **Then read the complete set of protocol files in the `/AGENTS` directory**, including:

   - `AGENTS/CODEGEN.md` — Code generation rules, test conventions, and allowed refactor scope  
   - `AGENTS/SCOPE.md` — Package, domain, and file-level boundaries  
   - `AGENTS/PR.CREATE.md` — Protocol for automated pull-request creation  
   - `AGENTS/PR.REVIEW.md` — Protocol for reviewing diffs and enforcing safety rules  
   - `AGENTS/DEPS.md` — Dependency management and upgrade constraints  
   - `AGENTS/ESCALATION.md` — When and how agents must stop and escalate  
   - `AGENTS/SECURITY.md` — Security posture and required safety checks for automated agents  

3. **Acknowledge and abide by all constraints** before performing any analysis or code modification.  
4. **Refuse or halt tasks** that would violate any rule defined across these documents.

Agents must not proceed with any repository modification until *all* documents listed above have been read and incorporated into the agent’s working instructions.

This requirement ensures:

- deterministic, predictable behavior  
- strict enforcement of architectural and operational guardrails  
- correct handling of refactors, tests, dependencies, and PR flows  
- alignment with security, scope, and escalation constraints  

Failure to load these documents constitutes a protocol violation.

---

## 1. Scope and Intent

Stably is designed to support **agentic systems** that:

* Build **pipelines as data** (arrays of domain actions)
* Use **contracts** to define structural rules and invariants
* Rely on **orchestrators** to walk pipelines and delegate work
* Use **workers** (and MCP tools, services, etc.) to perform side effects
* Use **evals** to assess outcomes and guide repairs or retries

This AGENTS root file governs:

* How agents should **treat Stably** (what it is and is not)
* The **minimum rules** for orchestrator behavior when using Stably
* How **validation, generation, and evals** fit together
* The **boundaries** that prevent drift and misuse

---

## 2. Roles in a Stably-Based System

Stably assumes four conceptual roles:

1. **Domain Contracts**

   * Define pipeline structure and invariants as *runtime JSON objects*.
   * Own the domain’s semantics and allowed behaviors.
   * Are authored and maintained by humans (or under explicit human review).

2. **Orchestrators**

   * Consume contracts and pipeline instances.
   * Use Stably to **validate** and **iterate** over pipelines.
   * Decide what to do with each action (delegate, retry, repair, abort).

3. **Workers**

   * Execute actions (API calls, file writes, MCP tools, etc.).
   * Have no direct dependency on Stably; they only see domain actions.

4. **Evals**

   * Inspect worker results and system state.
   * Inform orchestrator decisions, but do not change Stably’s core behavior.

> **Invariant:** Stably sits between contracts and orchestrators.
> It never reaches “down” into workers or “out” into external systems.

---

## 3. Non-Negotiable Rules

All agents that use Stably must respect the following core rules:

1. **Contracts Govern Structure**

   * Pipelines are validated against **domain contracts**, not ad-hoc rules.
   * Stably trusts the contract and enforces it; it does not infer missing constraints.

2. **Validation Before Generation**

   * `validatePipeline()` **must** succeed before `generate()` is called.
   * If validation fails, orchestrators **must not** call `generate()` on that pipeline instance.

3. **Actions Are Data, Not Behavior**

   * Stably treats actions as opaque values `{ type, payload }`.
   * It never interprets payloads or knows how actions are executed.

4. **No Side Effects in Stably**

   * Stably functions (`validatePipeline`, `validateAction`, `generate`, `createValidator`) must remain:

     * pure
     * deterministic
     * side-effect free
   * Agents **must not** request new side effects or stateful behavior inside `@stably/core`.

5. **Contracts Are Not Self-Mutating**

   * Orchestrators and workers **must not** modify contract definitions at runtime.
   * Changes to contracts are **versioned artifacts**, not in-flight behavior.

---

## 4. Orchestrator Behavior (Required Pattern)

Any orchestrator using Stably must follow this loop, conceptually:

1. **Plan construction**

   * Build a pipeline as an ordered array of domain actions.
   * Optionally, this plan may be constructed dynamically (e.g., via an LLM).

2. **Structural validation**

   * Call `validatePipeline(actions, contract)`.
   * If `!ok`, orchestrator:

     * logs or reports structural errors
     * **does not** execute the pipeline
     * may attempt a *new* plan, but must re-validate before continuing

3. **Generator creation**

   * If the pipeline is valid, call `generate(actions)` to get a generator.
   * The generator itself holds **no side effects** and is safe to inspect or replay.

4. **Per-step execution loop**

   * For each `action` yielded by the generator:

     1. **Optional structural guard**

        * Call `validateAction(action, contract)` as a local safety check.
     2. **Delegate to a worker**

        * Pass `action` to domain workers (MCP tools, services, etc.).
     3. **Run evals (optional but recommended)**

        * Evaluate worker outputs against domain expectations.
        * Decide: continue, retry, repair, or abort.

5. **Early termination**

   * If the orchestrator decides to stop:

     * call `generator.return()` to signal early termination
     * log/record why (for observability and audits)

> **Invariant:** Orchestrators are responsible for *when* and *why* a pipeline runs.
> Stably only guarantees *what* the pipeline is, structurally.

---

## 5. Validation Philosophy

Stably provides two core validation entry points:

* `validatePipeline(actions, contract)`
* `validateAction(action, contract)`

Agents must treat them as:

1. **Structural Safety Nets**

   * They ensure that actions and sequences align with what the contract declares:

     * allowed action types
     * required steps
     * ordering and transitions (where specified)

2. **Not Semantic Evaluators**

   * They do **not** guarantee that:

     * an API call succeeded
     * a document was written correctly
     * a contract change is appropriate for the business
   * Those concerns belong to **evals and domain logic**, not Stably.

3. **Static View of a Dynamic System**

   * When pipelines are rebuilt dynamically (e.g., after an eval failure), each new pipeline:

     * is treated as a **new plan**
     * must pass `validatePipeline()` before execution

> **Rule for agents:** Treat Stably’s validators as **structural fences**, not babysitters.

---

## 6. Evals and System-Level Safety

Evals sit *outside* Stably but interact closely with orchestrators that use it.

Agents should follow these guidelines:

1. **System Eval Before Critical Pipelines**

   * Before a critical orchestrator runs a pipeline, it may run a **system eval** that:

     * verifies domain MCP tools align with the contract
     * confirms no known drift between contracts and runtime capabilities

2. **Per-Step Eval**

   * After each worker action:

     * run evals to assess results
     * decide whether to proceed, retry, repair, or abort

3. **Evals Never Modify Stably**

   * Evals may:

     * propose a new pipeline
     * propose contract updates (as human-reviewed artifacts)
   * But they must **not** alter Stably’s core behavior or bypass structural validation.

---

## 7. Drift Control and Versioning

To keep Stably-based systems stable over time:

1. **Contracts as Versioned Artifacts**

   * Domain contracts should be versioned and reviewed like any other API.
   * Changes to contract structure are *breaking changes* for pipelines.

2. **Library Stability**

   * Stably aims to keep its core API (`validatePipeline`, `validateAction`, `generate`, `createValidator`) stable and minimal.
   * New functionality should be considered carefully and justified in terms of:

     * determinism
     * purity
     * domain-agnosticism

3. **AGENTS Files as Operational Canon**

   * Any new agent patterns (e.g., MCP server integration, multi-stage orchestrators, repair strategies) should be documented in:

     * additional `/AGENTS/*` files
     * without relaxing the invariants in this root document

---

## 8. What Agents Must Never Do

To preserve Stably’s integrity, agents **must not**:

* Ask for side effects inside `@stably/core`.
* Treat Stably as a workflow engine, task runner, or job scheduler.
* Modify domain contracts dynamically at runtime.
* Skip `validatePipeline()` before calling `generate()`.
* Treat `validateAction()` as a semantic guarantee.
* Use Stably to store or mutate long-term state, memory, or preferences.

Stably exists so that:

* pipelines are **predictable**
* structure is **enforced**
* agentic systems have a **deterministic core**

Everything else belongs to your domains, orchestrators, workers, and evals.

---

## 9. Extending This Protocol

When extending Stably (or building on top of it):

* Add new AGENTS documents (e.g., `STABLY.MCP.md`, `STABLY.EVALS.md`) to describe:

  * how new patterns interact with this root protocol
  * what new guarantees or constraints are introduced
* Keep this file as the **single source of truth** for:

  * what Stably is
  * what agents may assume
  * what must never change

If a proposed change conflicts with this document, the conflict should be made explicit and resolved **before** any code is merged.

