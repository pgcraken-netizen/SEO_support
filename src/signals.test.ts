import { expect, it } from 'vitest';
import { rankSignal, scoreSignal } from './signals';

it('evaluates rank relative to each target and distinguishes missing from out of range', () => {
  const ranks = [2, 3, 6, 7, null].map(rank => rankSignal({ date: '2026-11-22', rank }, 3).tone);
  expect(ranks).toEqual(['good','good','near','poor','poor']);
  expect(rankSignal(undefined, 3).tone).toBe('unknown');
});

it('uses measured competitors only, retaining zero and the ten-point boundary', () => {
  expect(scoreSignal(30, [30,null,50])).toMatchObject({benchmark:40,count:2,tone:'near'});
  expect(scoreSignal(29, [40]).tone).toBe('poor');
  expect(scoreSignal(0, [0]).tone).toBe('good');
  expect(scoreSignal(20, [null]).tone).toBe('unknown');
  expect(scoreSignal(null, [0]).tone).toBe('unknown');
});
