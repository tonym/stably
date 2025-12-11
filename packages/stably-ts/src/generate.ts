// src/generate.ts

import type { StablyBaseAction, StablyAction, StablyGenerator } from './base.types';

// Core generator factory.
// It takes an array of actions (a pipeline instance) and returns a generator.
// Pure and deterministic: no side effects, no contract logic, no validation.
export function* generate<TActions extends readonly StablyAction<StablyBaseAction>[]>(actions: TActions): StablyGenerator<TActions> {
  for (const action of actions) {
    yield action;
  }
}
