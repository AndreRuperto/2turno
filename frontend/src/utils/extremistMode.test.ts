import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import profiles from '../data/electionProfiles.generated.json';
import type { AnswerValue } from '../types/quiz';

const require = createRequire(import.meta.url);
const mode = require('./extremistMode.cjs');



describe('Separate extremist policy mode', () =>
{
    it('has 40 distinct bilingual questions and equal coverage of all twelve axes', () =>
    {
        const portuguese = mode.createRadicalQuiz(profiles.axes.pt, 'pt');
        const english = mode.createRadicalQuiz(profiles.axes.en, 'en');
        expect(portuguese.questions).toHaveLength(40);
        expect(portuguese.questions.length).toBeLessThanOrEqual(40);
        expect(new Set(portuguese.questions.map((question: { id: string }) => question.id)).size).toBe(40);
        for (const axis of profiles.axes.pt)
            expect(portuguese.questions.filter((question: { axisId: string }) => question.axisId === axis.id)).toHaveLength(['coordenacao', 'direitos_sociais', 'diplomacia_eleitoral', 'contrapesos'].includes(axis.id) ? 4 : 3);
        expect(portuguese.questions.filter((question: { agreePole: string }) => question.agreePole === 'LEFT')).toHaveLength(19);
        expect(english.questions.map((question: { id: string }) => question.id)).toEqual(portuguese.questions.map((question: { id: string }) => question.id));
        expect(english.questions[0].text).not.toBe(portuguese.questions[0].text);
        expect(portuguese.questions.every((question: { id: string }) => question.id.startsWith('radical_'))).toBe(true);
    });

    it.each([0, 50, 100])('scores every axis in its documented direction at %s', score =>
    {
        const quiz = mode.createRadicalQuiz(profiles.axes.pt);
        const answers = Object.fromEntries(quiz.questions.map((question: { id: string; agreePole: string }) =>
            [question.id, score === 50 ? 'NEUTRAL' : (question.agreePole === 'LEFT') === (score === 100) ? 'STRONGLY_AGREE' : 'STRONGLY_DISAGREE']));
        expect(Object.values(mode.scoreRadicalAnswers(answers))).toEqual(Array(12).fill(score));
    });

    it('rejects missing, foreign, and invalid answers', () =>
    {
        const quiz = mode.createRadicalQuiz(profiles.axes.pt);
        const answers: Record<string, AnswerValue> = Object.fromEntries(quiz.questions.map((question: { id: string }) => [question.id, 'NEUTRAL']));
        expect(() => mode.scoreRadicalAnswers({})).toThrow();
        expect(() => mode.scoreRadicalAnswers({ ...answers, foreign: 'NEUTRAL' })).toThrow();
        expect(() => mode.scoreRadicalAnswers({ ...answers, radical_01: 'WRONG' })).toThrow();
    });

    it('reaches far left and far right with ordinary agreement rather than requiring every strongest answer', () =>
    {
        const scores = Object.fromEntries(profiles.axes.pt.map(axis => [axis.id, 75]));
        expect(mode.classifyRadicalProfile(scores, {}, 'en').family).toBe('far-left');
        expect(mode.classifyRadicalProfile(Object.fromEntries(profiles.axes.pt.map(axis => [axis.id, 25])), {}, 'en').family).toBe('far-right');
        expect(mode.classifyRadicalProfile(Object.fromEntries(profiles.axes.pt.map(axis => [axis.id, 50])), {}, 'en').family).toBe('centre');
    });

    it('requires explicit racial exclusion, minority-rights rejection, nationalism and authoritarianism for Nazi traits', () =>
    {
        const scores = Object.fromEntries(profiles.axes.pt.map(axis => [axis.id, 50]));
        const answers = { radical_34: 'AGREE', radical_36: 'AGREE', radical_35: 'DISAGREE', radical_39: 'AGREE', radical_38: 'AGREE', radical_37: 'AGREE', radical_20: 'DISAGREE' };
        scores.diplomacia_eleitoral = 25;
        expect(mode.classifyRadicalProfile(scores, answers, 'en').subtype).toBe('national-socialism');
        expect(mode.classifyRadicalProfile(scores, { ...answers, radical_37: 'NEUTRAL' }, 'en').subtype).not.toBe('national-socialism');
        expect(mode.classifyRadicalProfile(scores, { ...answers, radical_20: 'AGREE' }, 'en').subtype).not.toBe('national-socialism');
        expect(mode.classifyRadicalProfile(scores, { ...answers, radical_34: 'DISAGREE', radical_36: 'DISAGREE', radical_39: 'DISAGREE' }, 'en').subtype).not.toBe('national-socialism');
        expect(mode.classifyRadicalProfile(scores, answers, 'pt').family).toBe('far-right');
    });

    it('provides sourced historical estimates without filling in unassessed themes', () =>
    {
        const scores = Object.fromEntries(profiles.axes.pt.map(axis => [axis.id, 50]));
        const matches = mode.historicalComparisons(scores, {});
        expect(matches.map((match: { id: string }) => match.id)).toEqual(['mussolini', 'mao', 'kim-jong-un', 'hitler', 'stalin', 'pol-pot', 'franco']);
        for (const match of matches)
        {
            const assessed = Object.values(match.scores).filter(score => score !== null);
            expect(match.coverage).toBe(assessed.length);
            expect(match.similarity).toBeGreaterThanOrEqual(0);
            expect(match.similarity).toBeLessThanOrEqual(100);
            expect(match.sources.length).toBeGreaterThan(0);
        }
        expect(matches.find((match: { id: string }) => match.id === 'mao').scores.exclusion).toBeNull();
    });

});

describe('Proposal questions inside the forty-question mode', () =>
{
    it('keeps forty questions, four proposals, stable saved orders and independent compatibility', () =>
    {
        for (let attempt = 0; attempt < 30; attempt += 1)
        {
            const quiz = mode.createRadicalQuiz(profiles.axes.pt, 'pt', profiles.proposals.pt);
            expect(quiz.questions).toHaveLength(40);
            expect(new Set(quiz.questions.map((question: { id: string }) => question.id)).size).toBe(40);
            const proposals = quiz.questions.filter((question: { proposalId?: string }) => question.proposalId);
            expect(proposals).toHaveLength(4);
            for (const identifier of ['lula-da-silva', 'flavio-bolsonaro'])
                expect(proposals.filter((question: { id: string }) => profiles.proposals.pt.find(proposal => proposal.id === question.id)?.proponentId === identifier)).toHaveLength(2);
            const identifiers = quiz.questions.map((question: { id: string }) => question.id);
            for (const identifier of ['radical_20', 'radical_34', 'radical_35', 'radical_36', 'radical_37', 'radical_38', 'radical_39', 'radical_40'])
                expect(identifiers).toContain(identifier);
            const restored = mode.createRadicalQuiz(profiles.axes.en, 'en', profiles.proposals.en, identifiers);
            expect(restored.questions.map((question: { id: string }) => question.id)).toEqual(identifiers);
            const answers: Record<string, AnswerValue> = Object.fromEntries(quiz.questions.map((question: { id: string; proposalId?: string }) =>
                [question.id, question.proposalId ? 'STRONGLY_AGREE' : 'NEUTRAL']));
            const before = mode.scoreRadicalAnswers(answers, quiz.questions);
            const changed = { ...answers };
            for (const proposal of proposals) changed[proposal.id] = 'STRONGLY_DISAGREE';
            expect(mode.scoreRadicalAnswers(changed, quiz.questions)).toEqual(before);
            expect(Object.values(before)).toEqual(Array(12).fill(50));
            expect(mode.classifyRadicalProfile(before, changed)).toEqual(mode.classifyRadicalProfile(before, answers));
        }
    });
});
