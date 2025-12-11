import { describe, expect, it } from 'vitest';

import type { StablyContract } from './contract.types';
import { createValidator, validateAction, validatePipeline } from './validation';

type SampleAction = { type: 'start' | 'middle' | 'end' | 'other' };

const baseContract: StablyContract<SampleAction> = {
  id: 'sample',
  steps: [
    { id: 's1', actionType: 'start' },
    { id: 's2', actionType: 'middle' },
    { id: 's3', actionType: 'end' }
  ],
  transitions: [{ from: 's1', to: ['s2', 's3'] }],
  structural: {
    allowedActionTypes: ['start', 'middle', 'end'],
    requiredSteps: ['s1', 's3'],
    orderConstraints: [{ before: 's1', after: 's3' }]
  }
};

describe('validatePipeline', () => {
  it('marks a valid pipeline as ok', () => {
    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>(
      [{ type: 'start' }, { type: 'middle' }, { type: 'end' }],
      baseContract
    );

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('treats missing structural rules as an empty object', () => {
    const contract: StablyContract<SampleAction> = {
      id: 'minimal',
      steps: [{ id: 's1', actionType: 'start' }]
    };

    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>([{ type: 'start' }], contract);

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('reports disallowed action types', () => {
    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>([{ type: 'start' }, { type: 'other' }], baseContract);

    expect(result).toEqual({
      ok: false,
      errors: ['Action at index 1 has disallowed type "other".', 'Required step "s3" does not appear in the pipeline instance.']
    });
  });

  it('reports missing required steps', () => {
    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>([{ type: 'start' }], baseContract);

    expect(result).toEqual({ ok: false, errors: ['Required step "s3" does not appear in the pipeline instance.'] });
  });

  it('flags order constraint violations', () => {
    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>([{ type: 'end' }, { type: 'start' }], baseContract);

    expect(result).toEqual({ ok: false, errors: ['Order constraint violated: step "s1" must appear before "s3".'] });
  });

  it('detects invalid transitions', () => {
    const contractWithTransitions: StablyContract<SampleAction> = {
      ...baseContract,
      transitions: [
        { from: 's1', to: ['s2'] },
        { from: 's2', to: ['s3'] }
      ]
    };
    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>(
      [{ type: 'start' }, { type: 'end' }],
      contractWithTransitions
    );

    expect(result).toEqual({ ok: false, errors: ['Transition from step "s1" to "s3" is not allowed by the contract.'] });
  });

  it('skips order-constraint errors when referenced steps never appear', () => {
    const contractWithMissingOrderSteps: StablyContract<SampleAction> = {
      id: 'order-skip',
      steps: [
        { id: 's1', actionType: 'start' },
        { id: 's2', actionType: 'end' }
      ],
      structural: {
        orderConstraints: [
          { before: 's1', after: 'missing-step' },
          { before: 'missing-before', after: 's2' }
        ]
      }
    };

    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>(
      [{ type: 'start' }, { type: 'end' }],
      contractWithMissingOrderSteps
    );

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('treats an empty pipeline as ok when no structural rules require steps', () => {
    const contract: StablyContract<SampleAction> = {
      id: 'empty-allowed',
      steps: [
        { id: 's1', actionType: 'start' },
        { id: 's2', actionType: 'end' }
      ]
      // no structural.requiredSteps, no allowedActionTypes
    };

    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>([], contract);

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('allows required steps to appear multiple times', () => {
    const result = validatePipeline<SampleAction, StablyContract<SampleAction>>(
      [
        { type: 'start' },
        { type: 'middle' },
        { type: 'start' },
        { type: 'end' },
        { type: 'end' }
      ],
      baseContract
    );

    expect(result).toEqual({ ok: true, errors: [] });
  });

});

describe('validateAction', () => {
  it('returns ok for actions present in the contract', () => {
    const result = validateAction<SampleAction, StablyContract<SampleAction>>({ type: 'start' }, baseContract);

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('handles missing structural rules with no allowed types defined', () => {
    const contract: StablyContract<SampleAction> = {
      id: 'no-structural',
      steps: [{ id: 's1', actionType: 'start' }]
    };

    const result = validateAction<SampleAction, StablyContract<SampleAction>>({ type: 'start' }, contract);

    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('rejects actions with disallowed types', () => {
    const contractWithLimits: StablyContract<SampleAction> = {
      ...baseContract,
      structural: { ...baseContract.structural, allowedActionTypes: ['start'] }
    };
    const result = validateAction<SampleAction, StablyContract<SampleAction>>({ type: 'end' }, contractWithLimits);

    expect(result).toEqual({ ok: false, errors: ['Action has disallowed type "end".'] });
  });

  it('reports missing step definitions', () => {
    const contractMissingStep: StablyContract<SampleAction> = {
      ...baseContract,
      steps: [{ id: 's1', actionType: 'start' }]
    };
    const result = validateAction<SampleAction, StablyContract<SampleAction>>({ type: 'end' }, contractMissingStep);

    expect(result).toEqual({ ok: false, errors: ['No contract step found for action type "end".'] });
  });

  it('can accumulate both disallowed-type and missing-step errors', () => {
    const contractWithLimits: StablyContract<SampleAction> = {
      ...baseContract,
      steps: [{ id: 's1', actionType: 'start' }], // drops 'end' step
      structural: {
        ...baseContract.structural,
        allowedActionTypes: ['start'] // end is disallowed
      }
    };

    const result = validateAction<SampleAction, StablyContract<SampleAction>>(
      { type: 'end' },
      contractWithLimits
    );

    expect(result).toEqual({
      ok: false,
      errors: [
        'Action has disallowed type "end".',
        'No contract step found for action type "end".'
      ]
    });
  });
});

describe('createValidator', () => {
  it('wraps pipeline and action validation with the provided contract', () => {
    const validator = createValidator<SampleAction, StablyContract<SampleAction>>(baseContract);

    expect(validator.validatePipeline([{ type: 'start' }, { type: 'end' }])).toEqual(
      validatePipeline<SampleAction, StablyContract<SampleAction>>([{ type: 'start' }, { type: 'end' }], baseContract)
    );

    expect(validator.validateAction({ type: 'start' })).toEqual(
      validateAction<SampleAction, StablyContract<SampleAction>>({ type: 'start' }, baseContract)
    );
  });

  it('does not mutate the provided contract instance', () => {
    const original: StablyContract<SampleAction> = {
      ...baseContract,
      structural: {
        ...(baseContract.structural ?? {}),
        allowedActionTypes: [...(baseContract.structural?.allowedActionTypes ?? [])]
      }
    };

    const snapshot = JSON.parse(JSON.stringify(original));

    const validator = createValidator<SampleAction, StablyContract<SampleAction>>(original);

    // Run both methods to ensure they don't modify the contract
    validator.validatePipeline([{ type: 'start' }, { type: 'end' }]);
    validator.validateAction({ type: 'start' });

    expect(original).toEqual(snapshot);
  });
});
