import type { AnswerValue, QuizPayload, QuizVariant } from '../types/quiz';

// Quiz do 2 Turno deixado pela metade: fica guardado no navegador para a pessoa
// continuar de onde parou em outra visita, em vez de recomeçar do zero.
const STORAGE_KEY = '2turno-progress';
const VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type ElectionProgressMode = 'election' | 'extremist';

export interface ElectionProgress
{
  v: number;
  /** Quiz eleitoral ou modo extremista (perguntas e cálculo diferentes). */
  mode: ElectionProgressMode;
  variant: QuizVariant;
  /** Perguntas sorteadas nesta tentativa, na ordem exibida. */
  questionIds: string[];
  answers: Record<string, AnswerValue>;
  questionIndex: number;
  savedAt: number;
}

const ANSWER_VALUES: ReadonlySet<string> = new Set(['STRONGLY_AGREE', 'AGREE', 'NEUTRAL', 'DISAGREE', 'STRONGLY_DISAGREE']);
const VARIANTS: ReadonlySet<string> = new Set(['short', 'extended', 'extreme']);



// Valida o que veio do disco: dado antigo, editado à mão ou de outra versão é descartado.
export function parseElectionProgress(raw: string | null, now = Date.now()): ElectionProgress | null
{
  if (!raw) return null;
  try
  {
    const data = JSON.parse(raw) as Partial<ElectionProgress> | null;
    if (!data || typeof data !== 'object' || data.v !== VERSION) return null;
    if (typeof data.savedAt !== 'number' || now - data.savedAt > MAX_AGE_MS || data.savedAt > now + 60_000) return null;
    if (data.mode !== 'election' && data.mode !== 'extremist') return null;
    if (typeof data.variant !== 'string' || !VARIANTS.has(data.variant)) return null;
    if (!Array.isArray(data.questionIds) || !data.questionIds.length || !data.questionIds.every(id => typeof id === 'string')) return null;
    if (!Number.isInteger(data.questionIndex) || (data.questionIndex as number) < 0) return null;
    const answers = data.answers;
    if (typeof answers !== 'object' || answers === null || Array.isArray(answers)
      || !Object.values(answers).every(answer => typeof answer === 'string' && ANSWER_VALUES.has(answer))) return null;
    return data as ElectionProgress;
  }
  catch
  {
    return null;
  }
}



export function loadElectionProgress(): ElectionProgress | null
{
  try { return parseElectionProgress(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}



export function saveElectionProgress(progress: Omit<ElectionProgress, 'v' | 'savedAt'>): void
{
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, v: VERSION, savedAt: Date.now() })); }
  catch { /* Sem armazenamento (aba privada, cota cheia): o quiz segue, só sem retomada. */ }
}



export function clearElectionProgress(): void
{
  try { window.localStorage.removeItem(STORAGE_KEY); }
  catch { /* Nada a limpar. */ }
}



export function answeredElectionCount(progress: ElectionProgress): number
{
  return progress.questionIds.filter(id => progress.answers[id]).length;
}



// Remonta o quiz com as mesmas perguntas, na mesma ordem. Se alguma pergunta deixou
// de existir (o conteúdo mudou depois de um deploy), não dá para retomar com segurança.
export function restoreElectionQuiz(payload: QuizPayload, progress: ElectionProgress): QuizPayload | null
{
  const byId = new Map(payload.questions.map(question => [question.id, question]));
  const questions = progress.questionIds.map(id => byId.get(id));
  if (questions.some(question => !question)) return null;
  return { ...payload, questions: questions as QuizPayload['questions'], questionCount: questions.length };
}
