import type { ElectionProposal } from '../types/election';
import type { AnswerValue, Question, QuizPayload } from '../types/quiz';

declare const proposalRules:
{
    shuffleProposals<Item>(proposals: readonly Item[], random?: () => number): Item[];
    proposalVerdict(answer: AnswerValue): 'agree' | 'disagree' | 'neutral';
    proposalQuestions(proposals: ElectionProposal[]): Question[];
    selectQuizQuestions(payload: QuizPayload, proposals: ElectionProposal[], random?: () => number): QuizPayload;
    mixRadicalProposals(questions: Question[], proposals: ElectionProposal[], random?: () => number): Question[];
    firstPage(locator: string): number | null;
};

export default proposalRules;
