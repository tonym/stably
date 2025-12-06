// src/contract.ts

import type { StablyBaseAction } from './base.types';

// A single step definition in the contract.
// It ties a logical step id to an actionType and optional flags Stably cares about.
export interface StablyContractStep<TAction extends StablyBaseAction = StablyBaseAction> {
  id: string; // e.g. "addToken"
  actionType: TAction['type']; // e.g. "tokens.add"
  payloadSchemaId?: string; // optional: external schema id
  terminal?: boolean; // pipeline may legally end here
}

// Allowed transitions between steps (by id).
export interface StablyTransitionRule {
  from: string; // step id
  to: string[]; // allowed next step ids
}

// Structural rules Stably can enforce at pipeline-validation time.
export interface StablyStructuralRules {
  allowedActionTypes?: string[]; // whitelist of legal action types
  requiredSteps?: string[]; // steps that must appear at least once
  orderConstraints?: Array<{
    // simple “A must come before B”
    before: string;
    after: string;
  }>;
  allowDynamicInsertion?: boolean; // whether orchestrator may insert new steps
  maxDepth?: number; // optional limit for branching depth
}

// Minimal contract Stably requires.
// Domains (like Prism) can extend this with evalHooks, escalationRules, etc.
export interface StablyContract<TAction extends StablyBaseAction = StablyBaseAction> {
  id: string; // e.g. "storefront.tokenUpdate"
  steps: readonly StablyContractStep<TAction>[];
  transitions?: readonly StablyTransitionRule[];
  structural?: StablyStructuralRules;
}
