import type { Axis } from '../types/quiz';

interface CandidateProfile
{
    id: string;
    name: string;
    party: string;
    number: number;
    scores: Record<string, number>;
}

declare const alignment:
{
    alignmentAreas(scores: Record<string, number>, candidateScores: Record<string, number>, axes: Axis[]): { aligned: string[]; different: string[] };
    compareProfiles(scores: Record<string, number>, candidates: CandidateProfile[], axes: Axis[]): {
        candidates: (CandidateProfile & { distance: number; compatibility: number })[];
        closestCandidateIds: string[];
    };
};

export default alignment;
