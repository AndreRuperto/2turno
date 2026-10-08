import type { AnswerValue } from '../types/quiz';

declare const proposalRules:
{
    shuffleProposals<Item>(proposals: readonly Item[], random?: () => number): Item[];
    proposalVerdict(answer: AnswerValue): 'agree' | 'disagree' | 'neutral';
    firstPage(locator: string): number | null;
};

export default proposalRules;
