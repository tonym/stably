# AGENT PROTOCOL: Pull Request Creation

This document defines how agents MUST create pull requests in the Stably repository.  
It ensures PRs remain **deterministic**, **minimal**, **auditable**, and aligned with the rules set in:

- `/AGENTS/ROOT.md`
- `/AGENTS/CODEGEN.md`

This protocol applies to *any* automated agent that prepares or opens a PR.

---

## 1. Purpose

PR creation is a **boundary event** in Stably’s workflow.  
It must represent a *coherent, isolated unit* of change:

- A single conceptual improvement or fix.
- Only changes directly related to that unit.
- No incidental formatting, refactors, or unrelated modifications.

All PRs must preserve Stably’s invariants:

- **pure functional core**
- **deterministic behavior**
- **no side effects**
- **contracts remain domain-owned and static**
- **codegen is strictly scoped**

---

## 2. PR Scope Requirements

Agents MUST:

1. Limit the PR to only the files necessary to support:
   - a generated feature,
   - a bug fix,
   - a correction to types, invariants, or examples,
   - or tests related to changed code.

2. Avoid multi-purpose PRs.  
   One PR = one change stream.

3. Ensure the PR:
   - compiles (`tsc`)
   - passes lint rules
   - passes all unit tests
   - updates documentation *only when affected behavior changes*

4. Include **no cross-domain edits** (e.g., do not modify non-Stably consumer code).

---

## 3. Branching Rules

Agents MUST:

- Create PRs **from `develop` into `develop`** (never directly into `main`).
- Use a descriptive branch name:
  ```
  feature/<short-description>
  fix/<short-description>
  chore/<short-description>
  docs/<short-description>
  test/<short-description>
  ```

Branch names MUST NOT include:

- timestamps  
- UUIDs  
- freeform chat text  

---

## 4. Commit Hygiene

Agents MUST:

1. Produce **atomic commits**, each representing a single logical step.  
2. Write commit messages in this format:

```
<type>: <short description>

<optional longer rationale>
```

Where `<type>` ∈ `{feat, fix, docs, test, chore, refactor}`.

3. Never include:
   - generated code not used in the PR
   - chatter from LLM reasoning
   - debugging artifacts
   - speculative or commented-out code

---

## 5. Required PR Description Template

Every PR created by an agent MUST follow this exact format:

```
## Summary
A short, single-paragraph explanation of what this PR does.

## Motivation
Why this change is necessary. If the PR fixes or improves something,
explain what triggered the need (e.g., contract change, bug, validation gap).

## Changes
- Bullet list of changes made
- Include only externally visible or semantically relevant changes

## Tests
- Which tests were added or modified
- Why those tests are sufficient under the “one expect per it” rule

## Alignment with AGENTS Protocol
- Confirms PR obeys ROOT.md invariants
- Confirms PR obeys CODEGEN.md constraints (if applicable)

## Notes for Reviewers
Anything reviewers must know; keep this section optional and minimal.
```

Agents MUST NOT alter the template.

---

## 6. Pre-Submission Checklist

Before opening a PR, the agent MUST verify:

- [ ] Only relevant files are changed.
- [ ] No unrelated formatting or refactoring exists.
- [ ] All types resolve cleanly (`tsc`).
- [ ] The PR introduces or updates tests only for the changed behavior.
- [ ] All lint rules would pass.
- [ ] All tests would pass.
- [ ] Documentation updates are included when necessary.
- [ ] PR description uses the required template.

If any requirement cannot be met, the PR MUST NOT be created.

---

## 7. PR Size Constraints

To maintain clarity:

- Prefer PRs under **300 lines changed** (additions + deletions).
- PRs MUST NOT exceed **1,000 lines changed**, except:
  - when modifying auto-generated files that are explicitly part of the feature
  - or when performing mechanical refactors allowed by a human directive

Large PRs without human instruction MUST be rejected by the agent.

---

## 8. Forbidden Actions

Agents creating PRs MUST NOT:

- Edit contract definitions in any consumer domain repo (Stably does not own them).
- Add side effects, I/O, or mutable state to the Stably core.
- Introduce nondeterminism in any generator or validator.
- Change the logic of `generate()`, `validatePipeline()`, or `validateAction()` unless explicitly instructed.
- Modify unrelated AGENTS files.
- Open more than one PR for the same logical change stream.

Any violation is considered system drift and MUST NOT be committed.

---

## 9. When to Abort PR Creation

Agents MUST abort PR creation when:

- The change cannot be cleanly isolated.
- Structural rules (ROOT.md) would be violated.
- The agent cannot guarantee test correctness.
- The change includes semantic domain decisions outside Stably’s scope.
- The PR requires human review before code generation continues.

Aborting is preferred over introducing drift.

---

## 10. Relationship to Other AGENTS Files

- `ROOT.md` defines what Stably fundamentally **is**.  
  PRs MUST uphold those invariants.

- `CODEGEN.md` defines constraints for generating or modifying code.  
  PR creation MUST ensure codegen changes respect those rules.

- Future files like `PR.REVIEW.md` or `STABLY.MCP.md` will further constrain behavior.  
  PR creation MUST adopt new rules as they land.

---

## 11. Summary

This protocol ensures PRs remain:

- **minimal**  
- **auditable**  
- **structurally correct**  
- **aligned with deterministic functional architecture**

By following this file, automated agents maintain Stably’s long-term integrity and prevent drift across versions.

---
