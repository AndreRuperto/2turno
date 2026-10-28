import type { Axis, Pole, QuizPayload, QuizVariant, SubmittedAnswer } from './quiz';

export interface ElectionProposal
{
  axisId: string;
  agreePole: Pole;
  sourceUrl: string;
  verifiedAt: string;
  id: string;
  text: string;
  proponentId: string;
  topic: string;
  sourceId: string;
  sourceLocator: string;
}

export interface ElectionQuiz
{
  modelId: string;
  asOf: string;
  quiz: QuizPayload;
  /** Propostas dos planos, exibidas no resultado. Opcional para tolerar uma API anterior. */
  proposals?: ElectionProposal[];
}

export interface ElectionAnswerRequest
{
  modelId: string;
  variant: QuizVariant;
  answers: SubmittedAnswer[];
}

export interface ElectionVectorRequest
{
  modelId: string;
  scores: Record<string, number>;
}

export interface ElectionAxisComparison
{
  axis: Axis;
  userScore: number;
  candidateScores: Record<string, number>;
}

export interface ElectionCandidateMatch
{
  id: string;
  name: string;
  party: string;
  number: number;
  distance: number;
  compatibility: number;
}

export interface ElectionComparison
{
  modelId: string;
  asOf: string;
  scoringMethod: 'mean-absolute-distance-v1';
  proposalAnswers?: SubmittedAnswer[];
  axes: ElectionAxisComparison[];
  candidates: ElectionCandidateMatch[];
  closestCandidateIds: string[];
  answeredQuestionCounts: Record<string, number>;
}
