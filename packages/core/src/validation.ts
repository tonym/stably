// src/validation.ts

import type { StablyBaseAction, StablyAction, PipelineInstance } from './base';
import type { StablyContract, StablyContractStep, StablyStructuralRules } from './contract';

// Result types for validators.
// You can later upgrade `errors: string[]` to richer diagnostics.
export interface PipelineValidationResult {
  ok: boolean;
  errors: string[];
}

export interface ActionValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validate a full pipeline instance (actions[]) against a StablyContract.
 *
 * Enforces:
 * - allowedActionTypes (if provided)
 * - requiredSteps (if provided)
 * - simple order constraints
 * - transitions (if provided)
 *
 * This is the CANONICAL structural check that MUST pass
 * before generate(actions) is called by an orchestrator.
 */
export function validatePipeline<TAction extends StablyBaseAction, TContract extends StablyContract<TAction>>(
  actions: PipelineInstance<TAction>,
  contract: TContract
): PipelineValidationResult {
  const errors: string[] = [];
  const { steps, structural, transitions } = contract;
  const stepById = new Map<string, StablyContractStep<TAction>>();
  const stepByActionType = new Map<TAction['type'], StablyContractStep<TAction>[]>();

  for (const step of steps) {
    stepById.set(step.id, step);
    const list = stepByActionType.get(step.actionType) ?? [];
    list.push(step);
    stepByActionType.set(step.actionType, list);
  }

  const structuralRules: StablyStructuralRules = structural ?? {};

  // 1. allowedActionTypes
  if (structuralRules.allowedActionTypes && structuralRules.allowedActionTypes.length > 0) {
    const allowed = new Set(structuralRules.allowedActionTypes);
    actions.forEach((action, index) => {
      if (!allowed.has(action.type)) {
        errors.push(`Action at index ${index} has disallowed type "${action.type}".`);
      }
    });
  }

  // 2. requiredSteps — ensure each required step id appears at least once.
  if (structuralRules.requiredSteps && structuralRules.requiredSteps.length > 0) {
    const seenSteps = new Set<string>();

    actions.forEach(action => {
      const possibleSteps = stepByActionType.get(action.type as TAction['type']) ?? [];
      for (const s of possibleSteps) {
        seenSteps.add(s.id);
      }
    });

    for (const required of structuralRules.requiredSteps) {
      if (!seenSteps.has(required)) {
        errors.push(`Required step "${required}" does not appear in the pipeline instance.`);
      }
    }
  }

  // 3. orderConstraints — simple “before X after Y” checks by step id.
  if (structuralRules.orderConstraints && structuralRules.orderConstraints.length > 0) {
    const idToIndices = new Map<string, number[]>();

    actions.forEach((action, index) => {
      const possibleSteps = stepByActionType.get(action.type as TAction['type']) ?? [];
      for (const s of possibleSteps) {
        const list = idToIndices.get(s.id) ?? [];
        list.push(index);
        idToIndices.set(s.id, list);
      }
    });

    for (const { before, after } of structuralRules.orderConstraints) {
      const beforeIndices = idToIndices.get(before) ?? [];
      const afterIndices = idToIndices.get(after) ?? [];

      if (beforeIndices.length === 0 || afterIndices.length === 0) {
        // Missing steps will be reported by requiredSteps if configured.
        continue;
      }

      const minAfter = Math.min(...afterIndices);
      const maxBefore = Math.max(...beforeIndices);
      if (maxBefore > minAfter) {
        errors.push(`Order constraint violated: step "${before}" must appear before "${after}".`);
      }
    }
  }

  // 4. transitions — ensure adjacent step ids are allowed transitions, if provided.
  if (transitions && transitions.length > 0) {
    const transitionMap = new Map<string, Set<string>>();
    transitions.forEach(rule => {
      transitionMap.set(rule.from, new Set(rule.to));
    });

    const stepIdsForActions = actions.map(action => {
      const possibleSteps = stepByActionType.get(action.type as TAction['type']) ?? [];
      // If multiple steps share an actionType, we cannot disambiguate without more info.
      // For now, pick the first one; domains should avoid ambiguous mappings.
      return possibleSteps[0]?.id;
    });

    for (let i = 0; i < stepIdsForActions.length - 1; i++) {
      const fromId = stepIdsForActions[i];
      const toId = stepIdsForActions[i + 1];

      if (!fromId || !toId) {
        continue;
      }

      const allowedNext = transitionMap.get(fromId);
      if (allowedNext && !allowedNext.has(toId)) {
        errors.push(`Transition from step "${fromId}" to "${toId}" is not allowed by the contract.`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

/**
 * Validate a single action against a StablyContract.
 *
 * This enforces LOCAL invariants:
 * - the action's type exists in the contract
 * - (optionally) that associated step metadata is present
 *
 * It is NOT a replacement for validatePipeline.
 * Use it as a per-action guard inside an orchestrator loop if desired.
 */
export function validateAction<TAction extends StablyBaseAction, TContract extends StablyContract<TAction>>(
  action: StablyAction<TAction>,
  contract: TContract
): ActionValidationResult {
  const errors: string[] = [];
  const { steps, structural } = contract;
  const structuralRules: StablyStructuralRules = structural ?? {};

  const allowedTypes = structuralRules.allowedActionTypes;
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(action.type)) {
      errors.push(`Action has disallowed type "${action.type}".`);
    }
  }

  const stepForType = steps.find(step => step.actionType === action.type);
  if (!stepForType) {
    errors.push(`No contract step found for action type "${action.type}".`);
  }

  // NOTE: payload schema validation is left to the consumer.
  // Stably only knows the payloadSchemaId; you can plug in Zod/JSON Schema/etc.
  // here if you want a richer extension.
  return {
    ok: errors.length === 0,
    errors
  };
}

// Optional ergonomic helper: preload the contract into a validator object.
// This is pure sugar over the core functions.
export function createValidator<TAction extends StablyBaseAction, TContract extends StablyContract<TAction>>(contract: TContract) {
  return {
    contract,
    validatePipeline(actions: PipelineInstance<TAction>): PipelineValidationResult {
      return validatePipeline<TAction, TContract>(actions, contract);
    },
    validateAction(action: StablyAction<TAction>): ActionValidationResult {
      return validateAction<TAction, TContract>(action, contract);
    }
  };
}
