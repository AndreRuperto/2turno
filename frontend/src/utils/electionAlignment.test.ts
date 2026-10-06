import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import profiles from '../data/electionProfiles.generated.json';

const require = createRequire(import.meta.url);
const alignment = require('./electionAlignment.cjs');

describe('Politician profile alignment', () =>
{
    it('ranks an identical profile first with 100 percent affinity', () =>
    {
        for (const candidate of profiles.candidates)
        {
            const result = alignment.compareProfiles(candidate.scores, profiles.candidates, profiles.axes.en);
            expect(result.closestCandidateIds).toEqual([candidate.id]);
            expect(result.candidates[0].compatibility).toBe(100);
            expect(result.candidates[0].distance).toBe(0);
        }
    });

    it('uses mean absolute distance and preserves exact ties', () =>
    {
        const axes = [{ id: 'first', label: 'First' }, { id: 'second', label: 'Second' }];
        const candidates = [
            { id: 'left', scores: { first: 100, second: 100 } },
            { id: 'right', scores: { first: 0, second: 0 } }
        ];
        const result = alignment.compareProfiles({ first: 75, second: 25 }, candidates, axes);
        expect(result.closestCandidateIds).toEqual(['left', 'right']);
        expect(result.candidates.map((candidate: { compatibility: number }) => candidate.compatibility)).toEqual([50, 50]);
    });

    it('summarizes only areas within the stated proximity and difference thresholds', () =>
    {
        const axes = ['equal', 'near', 'different', 'opposite'].map(id => ({ id, label: id }));
        expect(alignment.alignmentAreas(
            { equal: 50, near: 60, different: 85, opposite: 100 },
            { equal: 50, near: 40, different: 50, opposite: 0 }, axes
        )).toEqual({ aligned: ['equal', 'near'], different: ['opposite', 'different'] });
        expect(alignment.alignmentAreas({ equal: 50 }, { equal: 50 }, [axes[0]]).different).toEqual([]);
    });

    it('rejects missing or invalid axes rather than presenting invented alignment', () =>
    {
        expect(() => alignment.compareProfiles({}, profiles.candidates, profiles.axes.pt)).toThrow();
        expect(() => alignment.alignmentAreas({ axis: 101 }, { axis: 50 }, [{ id: 'axis', label: 'Axis' }])).toThrow();
    });
});
