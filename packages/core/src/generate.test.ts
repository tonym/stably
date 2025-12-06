import { describe, expect, it } from 'vitest';

import { generate } from './generate';

const sampleActions = [
  { type: 'first', payload: 1 },
  { type: 'second', payload: 2 }
] as const;

describe('generate', () => {
  it('yields actions in order', () => {
    const yielded = Array.from(generate(sampleActions));

    expect(yielded).toEqual(sampleActions);
  });
});
