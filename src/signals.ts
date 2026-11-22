import { median } from './model';
import type { Observation } from './model';

export type Tone = 'good' | 'near' | 'poor' | 'unknown';
export interface Signal {
  tone: Tone;
  label: string;
}

export function rankSignal(observation: Observation | undefined, target: number): Signal {
  if (!observation) return { tone: 'unknown', label: '未計測' };
  if (observation.rank === null) return { tone: 'poor', label: '100位圏外' };
  const distance = observation.rank - target;
  if (distance <= 0) return { tone: 'good', label: '目標達成' };
  return { tone: distance <= 3 ? 'near' : 'poor', label: '目標まであと' + distance + '位' };
}

export function scoreSignal(score: number | null, peers: (number | null)[]) {
  const measured = peers.filter((value): value is number => value !== null);
  const benchmark = median(measured);
  const difference = score === null || benchmark === null ? null : score - benchmark;
  let signal: Signal;
  if (difference === null) signal = { tone: 'unknown', label: '判定待ち' };
  else if (difference >= 0) signal = { tone: 'good', label: '基準達成' };
  else if (difference >= -10) signal = { tone: 'near', label: 'あと一歩' };
  else signal = { tone: 'poor', label: '要改善' };
  return { ...signal, difference, benchmark, count: measured.length };
}
