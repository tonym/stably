# Stably Agents

## Overview
Stably is designed to model persistent, structured agent memory and task logic using composable generators. This document outlines the current agent system design.

## Agent Model
Each agent consists of:
- **Memory**: Persistent context, loaded from `memory/`
- **Behavior**: A generator function defining its action loop
- **Interface**: The external trigger (e.g. user message, system event)

## Agent Roles
- **Interpreter**: Translates user input into structured intent.
- **Planner**: Breaks down goals into discrete tasks and routes them to other agents.
- **Executor**: Carries out tasks directly or simulates execution.
- **Summarizer**: Distills memory or session history into concise summaries.
- **Generic Agent**: A fallback or base agent used for templating or scaffolding.

## File Structure
- `memory/` – Top-level memory directory
  - `prompts/` – Prompt scaffolds and generated snapshots
    - `scaffolds/` – Prompt format templates for agent roles
    - `generated/` – Last emitted prompts (for debug/log)
  - `agent-memory.yaml` – Persistent long-term memory
  - `agent-metrics.yaml` – Placeholder for structured metrics or logs
  - `preferences.md` – Style and tone preferences
  - `project-context.md` – Current task or session memory
  - `glossary.md` – Shared terms and vocabulary
- `AGENTS.md` – This system overview document

## Examples

### Updating long-term memory
A summarizer agent may append to `memory.yaml` like so:

```yaml
summaries:
  - date: 2025-07-21
    topic: "planner output"
    content: "Planner decomposed user goal into 3 executable tasks."

## Status
🟡 Placeholder structure complete — logic under development.
