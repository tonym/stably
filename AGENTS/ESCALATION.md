# Escalation Protocol

This document defines how agents MUST escalate decisions, failures, ambiguities, or structural conflicts when operating within the Stably repository.

Escalation exists to prevent drift, preserve determinism, and ensure that human judgment is applied exactly where automation must stop.

This protocol extends, but does not override:

- `/AGENTS/ROOT.md`
- `/AGENTS/CODEGEN.md`
- `/AGENTS/PR.CREATE.md`
- `/AGENTS/PR.REVIEW.md`

If any rule in this file appears to conflict with ROOT, ROOT wins.

---

## 1. Purpose of Escalation

Automated agents act deterministically within well-defined boundaries.  
Escalation is required when an agent encounters something **outside those boundaries**, including:

- Unclear or conflicting instructions  
- Structural contradictions with ROOT or CODEGEN  
- Behavioral or semantic ambiguity in code changes  
- Situations where domain judgment is required  
- Changes that could break invariants or introduce side effects  
- Multi-intent or cross-domain PRs  
- Contract changes that may affect downstream systems  
- Any action that cannot be executed safely and deterministically  

Escalation is NOT a failure; it is a boundary protection mechanism.

Agents MUST escalate *before* making unsafe assumptions.

---

## 2. When Escalation Is Mandatory

Agents MUST escalate immediately when encountering any of the following:

### 2.1 Structural Conflicts
- A proposed change contradicts invariants defined in ROOT.  
- A PR or code edit would introduce side effects, nondeterminism, or state.  
- A contract update embeds semantics or domain logic.

### 2.2 Ambiguous Intent
- The natural-language instruction does not map cleanly to a single coherent outcome.  
- A change appears to require modifying multiple roles (contract + orchestrator + worker).  
- It is unclear whether the user intends a breaking change.

### 2.3 Unsafe Codegen Conditions
- The agent cannot guarantee TypeScript correctness.  
- The required tests cannot be produced under the one-expect-per-test rule.  
- The intended change is larger than the boundaries allowed by PR.CREATE.

### 2.4 Incomplete or Conflicting Protocols
- Instructions conflict with AGENTS rules.  
- A change appears valid but would require relaxing an invariant.

### 2.5 Domain-Specific Decisions
- Any edit that requires business rules or semantics not present in the repo.  
- Any attempt to interpret or guess developer intent for domain logic.

### 2.6 Failed Review Conditions
Reviewers MUST escalate if:

- A PR cannot be approved without violating protocol.  
- A contributor instruction conflicts with PR.REVIEW constraints.  
- Documentation updates are unclear or incomplete.  

Escalation MUST happen **before** approval or code edits continue.

---

## 3. Escalation Workflow

When escalation is required, agents MUST follow this structured procedure.

### Step 1 — Stop all synthesis or modification
No further codegen, editing, or PR actions may occur.  
Agents MUST freeze the current operation.

### Step 2 — Produce a structured escalation report
The agent MUST generate a message containing:

#### **Escalation Reason**
A short, explicit description of what triggered the escalation.

#### **Conflicting Rules**
References to the specific constraints being violated, such as:

- ROOT invariants  
- CODEGEN boundaries  
- PR.CREATE or PR.REVIEW constraints  

#### **Blocked Action**
Describe what the agent cannot safely do.

#### **Required Clarification or Decision**
List exactly what the human must decide in order to proceed.

This report MUST NOT propose solutions beyond clarifying protocol violations.

### Step 3 — Await human response
Agents MUST NOT infer intent or continue without user clarification.

### Step 4 — Resume only when ambiguity is resolved
When the response resolves the conflict:

- The agent MUST restate the approved interpretation.  
- Only then may the agent resume codegen, PR creation, or review.

---

## 4. Escalation Severity Levels

### **Level 1 — Clarification**
Used when:
- Instructions are unclear  
- A small detail is missing  
- Test or file boundaries are ambiguous  

Effect:  
Stop work → Ask for clarification → Resume.

---

### **Level 2 — Structural Conflict**
Used when:
- A change contradicts ROOT or CODEGEN  
- Behavior cannot be implemented without breaking invariants  

Effect:  
Stop work → Explain conflict → Require explicit human override or changed intent.

Agents MUST NOT proceed unless the human explicitly updates protocol or instructions.

---

### **Level 3 — Protocol Violation**
Used when:
- A PR would require ignoring PR.CREATE or PR.REVIEW rules  
- A change introduces nondeterminism, I/O, domain logic, or mutation  
- A contract edit breaks the structural model  

Effect:  
Stop work immediately → Request human decision → Require corrective guidance.

Agents MUST treat Level 3 violations as hard stops.

---

## 5. Forbidden Non-Escalation Behaviors

Agents MUST NOT:

- “Guess” user intent to proceed past ambiguity  
- Produce speculative code  
- Silently drop or modify constraints  
- Rewrite protocol rules  
- Combine multiple intents into a single PR  
- Add or change tests not tied to modified code  
- Invent contract structures or domain semantics  

Any of these behaviors constitutes system drift.

Escalation exists to prevent them.

---

## 6. Interaction with Other AGENTS Files

**ROOT.md**  
Escalation is required any time an invariant is at risk.

**CODEGEN.md**  
Escalation is required if code cannot be generated safely within purity, determinism, or repo conventions.

**PR.CREATE.md**  
Escalation is required if the intended PR scope exceeds boundaries or contains multiple streams of intent.

**PR.REVIEW.md**  
Escalation is required if approval cannot be granted without violating required rules.

Escalation is the shared enforcement layer across all AGENTS behavior.

---

## 7. Summary

Escalation is not optional.  
It is the mechanism that ensures:

- No unsafe code is generated  
- No multi-intent PRs are created  
- No reviewer approves invalid changes  
- No agent crosses domain boundaries  
- No protocol is implicitly redefined  

Agents MUST escalate the moment doubt, contradiction, or structural conflict arises.  
Human clarification is the only valid resolution path.

Automation handles determinism.  
Humans handle ambiguity.

That separation is what keeps Stably stable.
