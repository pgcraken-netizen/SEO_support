import {describe,it,expect} from 'vitest';
import {sampleProject,initialStore,isStore,median,upsertObservation,latest,csvCell} from './model';
describe('SEO data integrity',()=>{
 it('validates a full backup and rejects invalid ranks',()=>{const s=initialStore();expect(isStore(s)).toBe(true);s.projects[0].keywords[0].history[0].rank=0;expect(isStore(s)).toBe(false)});
 it('overwrites a date without duplicating measurements',()=>{const k=sampleProject().keywords[0];const updated=upsertObservation(k,{date:'2026-11-22',rank:null});expect(updated.history.length).toBe(k.history.length);expect(latest(updated)?.rank).toBe(null)});
 it('does not turn missing comparisons into zero',()=>{expect(median([])).toBe(null);expect(median([52,88,60])).toBe(60);expect(median([50,60])).toBe(55)});
 it('escapes spreadsheet formulas',()=>{expect(csvCell('=1+1')).toBe('"\'=1+1"');expect(csvCell('a"b')).toBe('"a""b"')});
});
