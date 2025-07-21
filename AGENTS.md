# Stably Agents

## Overview
Stably is designed to model persistent, structured agent memory and task logic using composable generators. This document outlines the current agent system design.

## Agent Model
Each agent consists of:
- **Memory**: Persistent context, loaded from `memory/`
- **Behavior**: A generator function defining its action loop
- **Interface**: The external trigger (e.g. user message, system event)

## Agent Roles
- **Interpreter**: Parses input, infers intent, forwards to core agents.
- **Planner**: Breaks down goals into executable tasks.
- **Executor**: Performs or simulates action (e.g., API call, text generation).
- **Summarizer**: Condenses memory into high-signal state.

## File Structure
- `memory/prompts/` – Prompt scaffolds and generated snapshots
  - `scaffolds/`: Prompt format templates for agent roles
  - `generated/`: Last emitted prompts (for debug/log)
- `memory/agent-memory.yaml` – Persistent long-term memory
- `memory/agent-metrics.yaml` – Placeholder for structured metrics or logs
- `memory/preferences.md` – Style and tone preferences
- `memory/project-context.md` – Current task or session memory
- `memory/glossary.md` – Shared terms and vocabulary
- `AGENTS.md` – This system overview document
## Status
🟡 Placeholder structure complete — logic under development.
