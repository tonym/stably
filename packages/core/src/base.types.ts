// src/base.ts

// Minimal base so domain actions always have a type tag.
// Domains extend this with their own fields.
export interface StablyBaseAction {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Marker alias: a StablyAction IS a domain action.
// This keeps Stably generic and domain-agnostic.
export type StablyAction<TDomainAction extends StablyBaseAction> = TDomainAction;

// Given a specific actions array type, this is the generator
// that will walk it and yield each action in order.
export type StablyGenerator<TActions extends readonly StablyAction<StablyBaseAction>[]> = Generator<TActions[number], void, unknown>;

// A convenience alias for “the concrete pipeline instance”
// (a validated list of actions for a specific run).
export type PipelineInstance<TAction extends StablyBaseAction = StablyBaseAction> = readonly StablyAction<TAction>[];
