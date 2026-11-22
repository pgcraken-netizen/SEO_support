import { expect, it } from 'vitest';
import { completedSteps } from './guide';
import { newProject, sampleProject } from './model';

it('starts a sample at step one and resumes an existing project from actual records', () => {
  expect(completedSteps(sampleProject())).toEqual([false,false,false,false,false]);
  const p = newProject('テスト','https://example.com','車検');
  expect(completedSteps(p)).toEqual([true,false,false,false,false]);
  p.keywords[0].history.push({ date:'2026-11-22', rank:null });
  p.competitors.push({ id:'peer', name:'他社', url:'https://example.org', scores:[null,0,null] });
  p.selfScores = [20,null,null];
  expect(completedSteps(p)).toEqual([true,true,false,false,false]);
  p.selfScores[1] = 0;
  expect(completedSteps(p)[3]).toBe(true);
});
