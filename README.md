# Stably

Stably is an experimental platform for building structured, memory-aware agents using generator functions in TypeScript.

It explores a pattern where agents:
- Operate as composable generators
- Construct prompts dynamically from contract definitions and memory state
- Maintain persistent memory, context, and preferences via a structured file system
- Yield intermediate steps to stabilize execution and create guardrails between agent phases

## Folder Structure

- `memory/` — Long-term memory, task context, agent preferences, and prompt scaffolds
- `packages/` — Code modules (planned)
- `examples/` — Reference agents and tasks (planned)

## Development Status

Project scaffolding is complete. Agent logic and workflows are under development.

## Learn More

See [`AGENTS.md`](./AGENTS.md) for an overview of the agent architecture and memory system.
