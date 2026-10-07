// Modelo eleitoral Lula x Flávio: carga, validação, quiz, pontuação e comparação.
// As notas dos candidatos saem das respostas codificadas, com a mesma fórmula do usuário.
import { readFileSync } from 'node:fs';

export const ANSWER_SCORES = Object.freeze({
  STRONGLY_AGREE: 1.0,
  AGREE: 0.75,
  NEUTRAL: 0.5,
  DISAGREE: 0.25,
  STRONGLY_DISAGREE: 0.0
});

const ANSWER_LABELS = {
  pt: {
    STRONGLY_AGREE: 'Concordo totalmente',
    AGREE: 'Concordo',
    NEUTRAL: 'Neutro ou Depende',
    DISAGREE: 'Discordo',
    STRONGLY_DISAGREE: 'Discordo totalmente'
  },
  en: {
    STRONGLY_AGREE: 'Strongly agree',
    AGREE: 'Agree',
    NEUTRAL: 'Neutral or It depends',
    DISAGREE: 'Disagree',
    STRONGLY_DISAGREE: 'Strongly disagree'
  }
};

const QUESTIONS_PER_AXIS = { short: 3, extended: 5, extreme: 6 };
const CANDIDATE_IDS = ['lula-da-silva', 'flavio-bolsonaro'];
const SCORING_METHOD = 'mean-absolute-distance-v1';

export class HttpError extends Error
{
  constructor(status, message)
  {
    super(message);
    this.status = status;
  }
}



function badRequest(message)
{
  return new HttpError(400, message);
}



function require(condition, message)
{
  if (!condition) throw new Error(message);
}



const isText = value => typeof value === 'string' && value.trim() !== '';

export function normalizeLanguage(language)
{
  const value = typeof language === 'string' ? language.trim().toLowerCase() : '';
  return ['en', 'en-us', 'en-gb'].includes(value) ? 'en' : 'pt';
}



function round(value)
{
  return Math.round(value * 10) / 10;
}



function uniqueIdentifiers(identifiers)
{
  require(identifiers.every(isText), 'Blank election identifier.');
  const unique = new Set(identifiers);
  require(unique.size === identifiers.length, 'Duplicate election identifier or topic.');
  return unique;
}



const sameSet = (left, right) => left.size === right.size && [...left].every(value => right.has(value));

// Projeta os campos conhecidos, na mesma ordem dos records Java, para o JSON de saída não mudar.
const axisView = axis => ({
  id: axis.id, label: axis.label, leftPole: axis.leftPole, rightPole: axis.rightPole,
  leftColor: axis.leftColor ?? null, rightColor: axis.rightColor ?? null
});

const questionView = question => ({
  id: question.id, axisId: question.axisId, text: question.text, agreePole: question.agreePole,
  weight: question.weight, topic: question.topic, core: question.core === true
});

function validateQuestions(model, axisIdentifiers)
{
  uniqueIdentifiers(model.questions.map(question => question.topic));
  for (const question of model.questions)
  {
    require(axisIdentifiers.has(question.axisId), 'Unknown election question axis.');
    require(question.id.startsWith('br2026_') && isText(question.text), 'Invalid election question.');
    require(question.weight === 1 && ['LEFT', 'RIGHT'].includes(question.agreePole),
      'Election questions require unit weight and an explicit pole.');
  }
  for (const axisIdentifier of axisIdentifiers)
  {
    const questions = model.questions.filter(question => question.axisId === axisIdentifier);
    require(questions.length === 6, 'Each election axis requires six distinct questions.');
    for (const pole of ['LEFT', 'RIGHT'])
    {
      require(questions.filter(question => question.core && question.agreePole === pole).length === 3,
        'Each election axis requires three core questions per pole.');
    }
  }
}



function validateCandidate(candidate, axisIdentifiers, questionIdentifiers, sourceIdentifiers)
{
  require(sameSet(new Set(Object.keys(candidate.answers)), questionIdentifiers), 'Incomplete candidate answers.');
  require(Object.values(candidate.answers).every(answer => answer in ANSWER_SCORES), 'Invalid candidate answer.');
  require(sameSet(new Set(Object.keys(candidate.evidence)), axisIdentifiers), 'Incomplete candidate evidence.');
  uniqueIdentifiers(candidate.uncertainQuestionIds);
  for (const questionIdentifier of candidate.uncertainQuestionIds)
  {
    require(candidate.answers[questionIdentifier] === 'NEUTRAL', 'Uncertain candidate answers must remain neutral.');
  }
  for (const evidence of Object.values(candidate.evidence))
  {
    require(['low', 'medium', 'high'].includes(evidence.confidence), 'Invalid confidence.');
    require(evidence.sourceIds.length > 0 && evidence.sourceIds.every(source => sourceIdentifiers.has(source)),
      'Unknown candidate evidence source.');
    require(isText(evidence.summary) && isText(evidence.summaryEnglish) && isText(evidence.locator),
      'Missing evidence explanation.');
  }
}



function validateModel(model)
{
  const axisIdentifiers = uniqueIdentifiers(model.axes.map(axis => axis.id));
  require(axisIdentifiers.size === 12, 'Exactly twelve election axes are required.');
  require(isText(model.title) && isText(model.description), 'Missing election text.');
  model.axes.forEach(axis => require(isText(axis.label) && isText(axis.leftPole) && isText(axis.rightPole),
    'Missing election axis text.'));
  require(isText(model.modelId), 'Election model identifier missing.');
  require(/^\d{4}-\d{2}-\d{2}$/.test(model.asOf) && !Number.isNaN(Date.parse(model.asOf)), 'Invalid asOf date.');
  const questionIdentifiers = uniqueIdentifiers(model.questions.map(question => question.id));
  validateQuestions(model, axisIdentifiers);
  const sourceIdentifiers = uniqueIdentifiers(model.sources.map(source => source.id));
  model.sources.forEach(source => require(source.url.startsWith('https://') && isText(source.title),
    'Invalid election source.'));
  const candidateIdentifiers = uniqueIdentifiers(model.candidates.map(candidate => candidate.id));
  require(sameSet(candidateIdentifiers, new Set(CANDIDATE_IDS)),
    'The election comparison requires Lula and Flávio Bolsonaro.');
  model.candidates.forEach(candidate =>
    validateCandidate(candidate, axisIdentifiers, questionIdentifiers, sourceIdentifiers));
}



function candidateView(candidate, english)
{
  const evidence = Object.fromEntries(Object.entries(candidate.evidence).map(([axisId, item]) => [axisId, {
    confidence: item.confidence,
    summary: english ? item.summaryEnglish : item.summary,
    summaryEnglish: item.summaryEnglish,
    sourceIds: [...item.sourceIds],
    locator: item.locator
  }]));
  return {
    id: candidate.id, name: candidate.name, party: candidate.party, number: candidate.number,
    answers: { ...candidate.answers }, uncertainQuestionIds: [...candidate.uncertainQuestionIds], evidence
  };
}



const proposalView = proposal => ({
  id: proposal.id, text: proposal.text, proponentId: proposal.proponentId,
  topic: proposal.topic, sourceId: proposal.sourceId, sourceLocator: proposal.sourceLocator
});

function buildModel(source, english)
{
  return {
    modelId: source.modelId,
    asOf: source.asOf,
    title: source.title,
    description: source.description,
    axes: source.axes.map(axisView),
    questions: source.questions.map(questionView),
    proposals: (source.proposals ?? []).map(proposalView),
    candidates: source.candidates.map(candidate => candidateView(candidate, english)),
    sources: source.sources.map(({ id, title, url, kind, accessedAt }) => ({ id, title, url, kind, accessedAt }))
  };
}



function translateModel(portuguese, translation)
{
  const axisIdentifiers = uniqueIdentifiers(translation.axes.map(axis => axis.id));
  require(sameSet(axisIdentifiers, new Set(portuguese.axes.map(axis => axis.id))),
    'Election axis translations are incomplete.');
  uniqueIdentifiers(translation.questions.map(question => question.id));
  const translatedQuestions = new Map(translation.questions.map(question => [question.id, question.text]));
  require(sameSet(new Set(translatedQuestions.keys()), new Set(portuguese.questions.map(question => question.id))),
    'Election question translations are incomplete.');
  const translatedAxes = new Map(translation.axes.map(axis => [axis.id, axis]));
  const translatedProposals = new Map((translation.proposals ?? []).map(p => [p.id, p.text]));
  const english = {
    ...portuguese,
    title: translation.title,
    description: translation.description,
    axes: portuguese.axes.map(axis => translatedAxes.get(axis.id)),
    questions: portuguese.questions.map(question => ({ ...question, text: translatedQuestions.get(question.id) })),
    proposals: (portuguese.proposals ?? []).map(p => ({ ...p, text: translatedProposals.get(p.id) ?? p.text }))
  };
  validateModel(english);
  return buildModel(english, true);
}



function readJson(url)
{
  return JSON.parse(readFileSync(url, 'utf8'));
}



export function loadElection(dataDirectory = new URL('../data/', import.meta.url))
{
  const source = readJson(new URL('elections/brazil-2026.json', dataDirectory));
  validateModel(source);
  const translation = readJson(new URL('i18n/en/elections/brazil-2026.json', dataDirectory));
  return createElection({ pt: buildModel(source, false), en: translateModel(source, translation) });
}



function createElection(models)
{
  const portuguese = models.pt;
  const questionsById = new Map(portuguese.questions.map(question => [question.id, question]));

  const getModel = language => models[normalizeLanguage(language)];

  function validateModelIdentifier(modelIdentifier)
  {
    if (modelIdentifier !== portuguese.modelId)
    {
      throw badRequest('Use o identificador do modelo eleitoral atual; resultados de outro quiz não são compatíveis.');
    }
  }

  function questionsPerAxis(variant)
  {
    if (!Object.hasOwn(QUESTIONS_PER_AXIS, variant)) throw badRequest('Formato de quiz inválido.');
    return QUESTIONS_PER_AXIS[variant];
  }

  function getQuiz(variant, language)
  {
    const model = getModel(language);
    const perAxis = questionsPerAxis(variant);
    const labels = ANSWER_LABELS[normalizeLanguage(language)];
    return {
      modelId: model.modelId,
      asOf: model.asOf,
      proposals: model.proposals,
      quiz: {
        title: model.title,
        description: model.description,
        variant,
        questionCount: perAxis * model.axes.length,
        questionsPerAxis: variant === 'extreme' ? 0 : perAxis,
        axes: model.axes,
        questions: model.questions,
        answerOptions: Object.entries(ANSWER_SCORES).map(([id, score]) =>
          ({ id, label: labels[id], scoreTowardAgreement: score })),
        archetypeQuestions: []
      }
    };
  }

  // Média das contribuições para o primeiro polo, por eixo; eixo sem resposta fica em 50.
  function scoreVector(answers)
  {
    const totals = new Map();
    for (const { questionId, answer } of answers)
    {
      const question = questionsById.get(questionId);
      const agreement = ANSWER_SCORES[answer];
      const leftScore = question.agreePole === 'LEFT' ? agreement : 1 - agreement;
      const total = totals.get(question.axisId) ?? { sum: 0, weight: 0 };
      total.sum += leftScore * question.weight;
      total.weight += question.weight;
      totals.set(question.axisId, total);
    }
    return Object.fromEntries(portuguese.axes.map(axis =>
    {
      const total = totals.get(axis.id);
      const raw = total ? total.sum / total.weight * 100 : 50;
      return [axis.id, round(Math.max(0, Math.min(100, raw)))];
    }));
  }

  const candidateVectors = Object.fromEntries(portuguese.candidates.map(candidate => [candidate.id,
    scoreVector(Object.entries(candidate.answers).map(([questionId, answer]) => ({ questionId, answer })))]));

  function validateRequestShape(request)
  {
    if (!request || typeof request !== 'object' || Array.isArray(request)) throw badRequest('Corpo da requisição inválido.');
  }

  function validateAnswers(request)
  {
    if (!isText(request.modelId) || !isText(request.variant) || !Array.isArray(request.answers)
      || request.answers.length === 0 || request.answers.length > 72
      || request.answers.some(answer => !answer || typeof answer !== 'object' || !isText(answer.questionId)
        || !Object.hasOwn(ANSWER_SCORES, answer.answer)))
    {
      throw badRequest('Respostas inválidas.');
    }
    validateModelIdentifier(request.modelId);
    const perAxis = questionsPerAxis(request.variant);
    const answeredIdentifiers = new Set();
    const answeredTopics = new Set();
    for (const answer of request.answers)
    {
      const question = questionsById.get(answer.questionId);
      if (!question || !question.core || answeredIdentifiers.has(answer.questionId) || answeredTopics.has(question.topic))
      {
        throw badRequest('As respostas devem usar perguntas eleitorais distintas do núcleo do quiz.');
      }
      answeredIdentifiers.add(answer.questionId);
      answeredTopics.add(question.topic);
    }
    const counts = {};
    for (const axis of portuguese.axes)
    {
      const answered = request.answers.map(answer => questionsById.get(answer.questionId))
        .filter(question => question.axisId === axis.id);
      const leftCount = answered.filter(question => question.agreePole === 'LEFT').length;
      if (answered.length !== perAxis || Math.abs(2 * leftCount - answered.length) > 1)
      {
        throw badRequest('Responda o número previsto de perguntas por eixo, equilibrado entre os dois polos.');
      }
      counts[axis.id] = answered.length;
    }
    return counts;
  }

  function compareVector(userVector, language, answerCounts)
  {
    const model = getModel(language);
    const distances = Object.fromEntries(model.candidates.map(candidate => [candidate.id,
      model.axes.reduce((sum, axis) => sum + Math.abs(userVector[axis.id] - candidateVectors[candidate.id][axis.id]), 0)
        / model.axes.length]));
    const minimum = Math.min(...Object.values(distances));
    return {
      modelId: model.modelId,
      asOf: model.asOf,
      scoringMethod: SCORING_METHOD,
      axes: model.axes.map(axis => ({
        axis,
        userScore: userVector[axis.id],
        candidateScores: Object.fromEntries(model.candidates.map(candidate =>
          [candidate.id, candidateVectors[candidate.id][axis.id]]))
      })),
      candidates: [...model.candidates]
        .sort((left, right) => distances[left.id] - distances[right.id])
        .map(candidate => ({
          id: candidate.id, name: candidate.name, party: candidate.party, number: candidate.number,
          distance: round(distances[candidate.id]), compatibility: round(100 - distances[candidate.id])
        })),
      closestCandidateIds: model.candidates.map(candidate => candidate.id)
        .filter(id => Math.abs(distances[id] - minimum) < 0.0000001),
      answeredQuestionCounts: answerCounts
    };
  }

  function score(request, language)
  {
    validateRequestShape(request);
    const counts = validateAnswers(request);
    return compareVector(scoreVector(request.answers), language, counts);
  }

  function compare(request, language)
  {
    validateRequestShape(request);
    if (!isText(request.modelId)) throw badRequest('Informe o identificador do modelo eleitoral.');
    validateModelIdentifier(request.modelId);
    const scores = request.scores;
    const axisIdentifiers = new Set(portuguese.axes.map(axis => axis.id));
    if (!scores || typeof scores !== 'object' || Array.isArray(scores)
      || !sameSet(new Set(Object.keys(scores)), axisIdentifiers)
      || Object.values(scores).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100))
    {
      throw badRequest('Informe os doze eixos eleitorais, com valores entre 0 e 100.');
    }
    return compareVector(scores, language, {});
  }

  return { getModel, getQuiz, questionsPerAxis, scoreVector, candidateVectors, score, compare };
}
