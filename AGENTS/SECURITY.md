# Security Protocol (AGENTS/SECURITY.md)

This document defines how automated agents MUST treat security concerns in the Stably repository.

Its purpose is to:

- Protect Stably from supply-chain risk  
- Prevent privilege escalation through agent actions  
- Preserve strict purity and determinism guarantees  
- Ensure Stably never becomes a vector for sensitive data exposure  
- Enforce predictable, auditable, minimal dependency behavior  

This protocol extends but does not override:

- `/AGENTS/ROOT.md`
- `/AGENTS/CODEGEN.md`
- `/AGENTS/PR.CREATE.md`
- `/AGENTS/PR.REVIEW.md`
- `/AGENTS/SCOPE.md`
- `/AGENTS/DEPS.md`
- `/AGENTS/ESCALATION.md`

If any rule here appears to conflict with ROOT.md, **ROOT.md wins**.

---

## 1. Stably’s Security Model

Stably is designed to be:

- **Pure** — no I/O, no secrets, no environment access  
- **Deterministic** — same inputs → same outputs  
- **Structural-only** — no semantics, no execution, no state  
- **Domain-agnostic** — no knowledge of systems, tools, or networks  

Nothing in `@stably/core` depends on or interacts with external systems.

Security concerns arise only from:

- Dependency changes  
- Agent behavior that touches infrastructure or privileged actions  
- PR changes that alter determinism or side-effect boundaries  
- Human-executed build, CI, or publication steps  

This protocol governs how agents MUST behave to avoid compromising any of those guarantees.

---

## 2. Zero Secrets Rule

Agents MUST NOT:

- Insert secrets, tokens, passwords, API keys, or credentials into the repo  
- Reference environment variables  
- Add configuration files that could store sensitive values  
- Introduce code that reads, writes, or depends on secret material  

Agents MUST assume:

**All content committed to the Stably repo is public forever.**

If a user instruction appears to require storing or manipulating secrets, the agent MUST escalate (per `/AGENTS/ESCALATION.md`).

---

## 3. Zero Side-Effects Rule (Security Variant)

Any side-effect capability increases the attack surface.

Agents MUST NOT introduce into `@stably/core`:

- File reads/writes  
- Network access  
- Dynamic imports  
- Randomness or timers  
- Browser APIs  
- Worker threads  
- System calls  

Agents MUST reject any PR or proposal—including user instructions—that would cause such code to appear in the core.

If a change belongs in an orchestrator, worker, or MCP layer, agents must redirect or escalate.

---

## 4. Dependency Safety Rules

Dependencies are a security boundary.

Agents MUST:

- Avoid introducing dependencies that have I/O, side effects, or eval-like semantics  
- Reject dependencies not required by explicit human instruction  
- Review dependency version ranges for stability and minimality  
- Assume all new dependencies carry supply-chain risk  

Agents MUST NOT:

- Add transitive dependencies indirectly through convenience libraries  
- Update dependencies merely for novelty or style  
- Add dependencies that have not been justified in `/AGENTS/DEPS.md`  

If a dependency cannot be confidently evaluated, **the action must be escalated**.

---

## 5. Code Integrity and Review Safety

Agents MUST ensure that all code changes:

- Are minimal  
- Are deterministic  
- Do not change security boundaries implicitly  
- Follow PR and Review protocols exactly  

Review agents MUST reject any PR that:

- Adds logic that can mutate global state  
- Adds logic that depends on host environment  
- Adds logic that allows a domain pipeline to alter Stably behavior  
- Includes hidden or unused code paths  
- Includes obfuscated or non-human-auditable code  

Agents must assume that **complexity is a security vector**.

---

## 6. Repository Hygiene Rules

Agents MUST:

- Maintain readable, auditable files  
- Preserve commit history clarity  
- Avoid adding build artifacts  
- Avoid adding scripts or automation that execute code automatically  
- Avoid introducing shell scripts or CI tasks unless explicitly instructed  

Agents MUST NOT:

- Add pre/post-install npm scripts  
- Add code generation that runs implicitly  
- Add bundlers, compilers, or transpilers with side-effectful behavior  

If uncertainty arises, the correct action is escalation.

---

## 7. Sensitive Areas Requiring Mandatory Escalation

Agents MUST escalate (stop and request human direction) when:

1. **Any user instruction involves secrets**, credentials, or authentication  
2. **A dependency has ambiguous or unclear behavior**  
3. **A change touches build or publication tooling**  
4. **A PR modifies files with potential execution (e.g., scripts, CI YAML)**  
5. **A dependency or code path includes parsing/execution of user input**  
6. **A change could permit domain actors to bypass Stably’s structural guarantees**  
7. **Code complexity increases to a point where deterministic review is impaired**  

If the agent cannot confidently assess security impact → escalate.

---

## 8. Security in Example Packages

Examples (future `stably-examples/`, `@stably/mcp-server`, etc.) may include I/O and network operations.

However:

- Agents MUST keep those dependencies isolated from `@stably/core`  
- Agents MUST NOT allow example capabilities to “leak” into core runtime  
- Example packages must still follow minimal dependency, no-secrets, and escalation rules  

---

## 9. Security Expectations for Orchestrators, Workers, MCP Tools (Informational Only)

Although orchestrators/workers are OUTSIDE this repo, agents must assume:

- They may handle sensitive data  
- They may integrate with privileged systems  
- They must NEVER cause Stably to depend on or embed their semantics  

Stably remains a **structural** layer with **zero security footprint**.

---

## 10. Forbidden Actions

Agents MUST NOT:

- Add authentication logic  
- Add encryption/decryption logic  
- Add security-token validation  
- Add logging with sensitive data  
- Add data persistence  
- Add privilege escalation pathways  
- Add “debug modes”  
- Add real-world identities or credentials  

Stably must remain architecture-only, never identity- or privilege-aware.

---

## 11. Summary

The Stably SECURITY protocol ensures:

- Deterministic and pure core behavior  
- No secrets or privileged data  
- Minimal and auditable dependency surface  
- Safe, disciplined agent behavior  
- Strict separation of Stably from execution, networking, and domain semantics  

Security in Stably means reducing risk by reducing surface area.

Agents MUST treat this protocol as binding and MUST escalate when uncertain.
