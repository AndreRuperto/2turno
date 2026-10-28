import type { ElectionProposal } from '../types/election';
import type { AnswerValue, Axis, Question, QuizPayload } from '../types/quiz';
import presentation from './electionPresentation.cjs';

interface HistoricalMatch
{
    id: string;
    name: string;
    period: string;
    portrait: string;
    shortName: string;
    biography: { pt: string; en: string };
    description: { pt: string; en: string };
    scores: Record<string, number | null>;
    sources: { title: string; url: string }[];
    similarity: number;
    coverage: number;
    user: Record<string, number>;
}

declare const extremistMode:
{
    createRadicalQuiz(axes: Axis[], language?: string, proposals?: ElectionProposal[], savedIdentifiers?: string[]): QuizPayload;
    scoreRadicalAnswers(answers: Record<string, AnswerValue>, questions?: Question[]): Record<string, number>;
    policySignals(scores: Record<string, number>, answers?: Record<string, AnswerValue>): Record<string, number>;
    classifyRadicalProfile(scores: Record<string, number>, answers?: Record<string, AnswerValue>, language?: string): ReturnType<typeof presentation.classificationLabels>;
    historicalComparisons(scores: Record<string, number>, answers: Record<string, AnswerValue>): HistoricalMatch[];
};

export default extremistMode;
