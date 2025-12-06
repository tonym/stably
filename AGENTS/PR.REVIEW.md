# PR Review Protocol

This document defines how agents MUST review pull requests in the Stably repository.  
It ensures that automated reviews remain predictable, domain-agnostic, and aligned with Stably’s architectural invariants.

PR reviews are **structural**, **disciplined**, and **non-creative**.  
Agents performing reviews MUST follow the rules below exactly.

---

## 1. Purpose of PR Review

The reviewer’s job is to ensure that:

- Code changes are **safe**, **minimal**, and **structurally correct**
- Stably’s invariants (pure functions, deterministic behavior, no side effects) are preserved
- Tests match the changes and follow repository conventions
- Documentation is updated when required
- No unrelated or opportunistic edits are included

Reviewers MUST NOT:

- Rewrite code for stylistic preference
- Suggest new features, abstractions, or APIs not present in the PR
- Introduce domain semantics or side-effect logic into Stably

The purpose is **validation**, not innovation.

---

## 2. Scope of Review

A review MUST examine:

1. **Changed code**  
   Only the files included in the PR diff. Reviewers MUST NOT respond to unrelated files.

2. **Tests associated with changes**  
   - Exactly one expectation per test  
   - Table tests allowed  
   - Only tests that correspond to modified or added code

3. **Documentation updates**  
   If public APIs or invariants changed, README or AGENTS documents MUST be updated.

4. **Commit boundaries**  
   PR must contain only changes relevant to a single coherent intent.

---

## 3. Structural Checklist (Required)

For every PR, the reviewer MUST verify the following:

### 3.1 Purity and Determinism  
- No side effects (I/O, randomness, time, network, filesystem)  
- No mutation of input arguments  
- No hidden state or implicit stateful behavior  
- No introduction of nondeterministic ordering

### 3.2 API Integrity  
- Public API shape remains stable unless PR explicitly declares a breaking change  
- All types are correctly exported and consistent  
- Return shapes follow established conventions  
  `{ ok: boolean; errors?: string[] }`

### 3.3 Contract + Action Definitions  
If contracts or actions are changed:  
- They remain runtime JSON objects  
- They do not embed semantics, tools, or environment behavior  
- They do not violate the structural role boundaries documented in `AGENTS/ROOT.md`

### 3.4 Generator Semantics  
If `generate()` or related code is touched:  
- Sequence iteration remains deterministic  
- `.return()` behavior is not altered  
- No new branching, filtering, or interpretation logic is added

### 3.5 Validation Logic  
Changes MUST preserve:  
- structural-only validation  
- no semantic evaluation  
- no integration with domain workers or tools

---

## 4. Test Review Rules

Reviewers MUST verify:

1. Tests cover only changed or newly added code  
2. Every `it` block contains exactly one expectation  
3. Table-driven tests follow a consistent shape  
4. No test includes side effects, external dependencies, or nondeterminism  
5. All tests pass in principle (the reviewer MUST reason through correctness even if they cannot run them)

If tests are missing or incomplete, the PR cannot be approved.

---

## 5. Documentation Review Rules

If a PR modifies:

- Public API
- Contract shapes
- Validation behavior
- Generator rules
- Required agent behavior

Then the reviewer MUST verify updates to:

- `packages/core/README.md`
- Related AGENTS documents

If docs are missing or inconsistent, the PR cannot be approved.

---

## 6. Review Tone and Structure

Review comments MUST be:

- Clear and directive (“must”, not “maybe consider”)
- Focused on violations of rules or needed clarifications
- Free from speculation about desired architecture or features
- Never conversational, emotional, or stylistic

Permitted examples:

- “This introduces a side effect and must be removed.”
- “This change breaks the return-shape invariant and must be corrected.”
- “This test contains multiple expectations and must be split.”

Forbidden examples:

- “I think we could make this more elegant by…”
- “What if Stably supported…”
- “It would be nice if…”

---

## 7. Approval Rules

A PR MAY be approved only if:

- All structural and invariance checks pass  
- All required tests exist and are valid  
- Documentation is updated where applicable  
- The PR is scoped to a single intent  
- No unrelated files were modified  

If any requirement fails, the reviewer MUST request changes.

Agents MUST NEVER approve a PR that violates constraints for the sake of convenience.

---

## 8. What Reviewers Must Never Do

Reviewers MUST NOT:

1. Introduce new features or APIs in their comments  
2. Provide rewritten code unless correcting an explicit violation  
3. Suggest merging without tests  
4. Suggest merging documentation-changing PRs without doc updates  
5. Approve a PR with more than one intent or domain of change  
6. Request changes that contradict `AGENTS/ROOT.md` or Stably’s invariants

---

## 9. Alignment with Root Protocol

All PR review behavior MUST remain consistent with:

- `AGENTS/ROOT.md`
- the deterministic-functional design of Stably
- separation of contracts, orchestrators, workers, and evals
- the principle that Stably is **pure structure**, never semantics

If a PR implies or requires behavior that conflicts with ROOT, reviewers MUST block the PR until the conflict is resolved.

---

## 10. Summary

PR review is an enforcement mechanism for:

- determinism  
- structural purity  
- narrow scope  
- repository safety  
- predictable agent behavior  

Reviewers MUST treat these procedures as binding protocol.

If any rule conflicts with convenience or agent heuristics, the protocol wins.
