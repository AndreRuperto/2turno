import { describe, expect, it } from 'vitest';
import { answeredElectionCount, parseElectionProgress, restoreElectionQuiz, type ElectionProgress } from './electionProgress';
import type { QuizPayload } from '../types/quiz';

const NOW = 1_800_000_000_000;

function progress(overrides: Partial<ElectionProgress> = {}): ElectionProgress
{
  return {
    v: 1,
    mode: 'election',
    variant: 'extended',
    questionIds: ['br2026_tax_01', 'br2026_guns_02', 'br2026_state_03'],
    answers: { br2026_tax_01: 'AGREE', br2026_guns_02: 'STRONGLY_DISAGREE' },
    questionIndex: 2,
    savedAt: NOW - 1000,
    ...overrides
  };
}

function payload(): QuizPayload
{
  return {
    title: '2 Turno',
    description: '',
    variant: 'extended',
    questionCount: 4,
    questionsPerAxis: 0,
    axes: [],
    answerOptions: [],
    questions: ['br2026_state_03', 'br2026_tax_01', 'br2026_guns_02', 'br2026_env_04'].map(id => ({
      id, axisId: id.split('_')[1], text: id, agreePole: 'LEFT' as const, weight: 1
    }))
  };
}

describe('parseElectionProgress', () =>
{
  it('aceita um progresso válido dos dois modos', () =>
  {
    expect(parseElectionProgress(JSON.stringify(progress()), NOW)).toEqual(progress());
    expect(parseElectionProgress(JSON.stringify(progress({ mode: 'extremist', variant: 'short' })), NOW)?.mode).toBe('extremist');
  });

  it('descarta ausente, quebrado ou de outra versão', () =>
  {
    expect(parseElectionProgress(null, NOW)).toBeNull();
    expect(parseElectionProgress('{quebrado', NOW)).toBeNull();
    expect(parseElectionProgress('null', NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ v: 2 })), NOW)).toBeNull();
  });

  it('descarta progresso antigo demais ou com data no futuro', () =>
  {
    expect(parseElectionProgress(JSON.stringify(progress({ savedAt: NOW - 8 * 24 * 60 * 60 * 1000 })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ savedAt: NOW + 5 * 60 * 1000 })), NOW)).toBeNull();
  });

  it('descarta modo, variante, resposta ou posição desconhecidos', () =>
  {
    expect(parseElectionProgress(JSON.stringify(progress({ mode: 'outro' as never })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ variant: 'enorme' as never })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ answers: { br2026_tax_01: 'TALVEZ' as never } })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ answers: [] as never })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ questionIds: [] })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ questionIndex: -1 })), NOW)).toBeNull();
    expect(parseElectionProgress(JSON.stringify(progress({ questionIndex: 1.5 })), NOW)).toBeNull();
  });
});

describe('restoreElectionQuiz', () =>
{
  it('remonta as perguntas na ordem guardada, mesmo que o servidor mande em outra', () =>
  {
    const quiz = restoreElectionQuiz(payload(), progress());
    expect(quiz?.questions.map(question => question.id)).toEqual(['br2026_tax_01', 'br2026_guns_02', 'br2026_state_03']);
    expect(quiz?.questionCount).toBe(3);
  });

  it('não retoma se alguma pergunta deixou de existir', () =>
  {
    expect(restoreElectionQuiz(payload(), progress({ questionIds: ['br2026_tax_01', 'br2026_removida_99'] }))).toBeNull();
  });
});

describe('answeredElectionCount', () =>
{
  it('conta só respostas de perguntas desta sequência', () =>
  {
    expect(answeredElectionCount(progress({ answers: { br2026_tax_01: 'AGREE', br2026_fora_01: 'AGREE' } }))).toBe(1);
  });
});
