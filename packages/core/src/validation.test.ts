import { describe, expect, it } from 'vitest';

import type { StablyContract } from './contract';
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
});

describe('validateAction', () => {
  it('returns ok for actions present in the contract', () => {
    const result = validateAction<SampleAction, StablyContract<SampleAction>>({ type: 'start' }, baseContract);

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
});

describe('createValidator', () => {
  it('wraps pipeline and action validation with the provided contract', () => {
    const validator = createValidator<SampleAction, StablyContract<SampleAction>>(baseContract);

    expect(validator.validatePipeline([{ type: 'start' }, { type: 'end' }])).toEqual(
      validatePipeline<SampleAction, StablyContract<SampleAction>>([{ type: 'start' }, { type: 'end' }], baseContract)
    );
  });
});
