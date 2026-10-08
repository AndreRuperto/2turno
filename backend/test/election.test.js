// Porte do antigo ElectionComparisonTest (Java), com os mesmos valores esperados.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { ANSWER_SCORES, HttpError, loadElection } from '../src/election.js';

const election = loadElection();
const model = election.getModel('pt');
const ANSWERS = Object.keys(ANSWER_SCORES);

const answersFor = (questions, answer) => questions.map(question => ({ questionId: question.id, answer }));
const scoreAll = (answer, language = 'pt') =>
  election.score({ modelId: model.modelId, variant: 'extreme', answers: answersFor(model.questions, answer) }, language);
const neutralAnswers = () => answersFor(model.questions, 'NEUTRAL');

function assertBadRequest(action)
{
  assert.throws(action, error => error instanceof HttpError && error.status === 400);
}



describe('modelo eleitoral', () =>
{
  test('tem 12 eixos distintos e temas do núcleo equilibrados', () =>
  {
    assert.equal(model.axes.length, 12);
    assert.equal(model.questions.length, 72);
    assert.ok(model.questions.every(question => question.core));
    assert.equal(new Set(model.questions.map(question => question.id)).size, 72);
    assert.equal(new Set(model.questions.map(question => question.topic)).size, 72);
    for (const axis of model.axes)
    {
      const questions = model.questions.filter(question => question.axisId === axis.id);
      assert.equal(questions.length, 6);
      assert.equal(questions.filter(question => question.agreePole === 'LEFT').length, 3);
      assert.equal(questions.filter(question => question.agreePole === 'RIGHT').length, 3);
    }
    const general = JSON.parse(readFileSync(new URL('../data/questions-pool.json', import.meta.url), 'utf8'));
    assert.equal(general.length, 240);
    const generalIds = new Set(general.map(question => question.id));
    assert.ok(model.questions.every(question => !generalIds.has(question.id)));
  });

  for (const variant of ['short', 'extended', 'extreme'])
  {
    test(`quiz ${variant} mantém o contrato de seleção`, () =>
    {
      const quiz = election.getQuiz(variant, 'pt');
      assert.equal(quiz.modelId, 'brazil-presidential-2026-v2');
      assert.equal(quiz.quiz.questionCount, election.questionsPerAxis(variant) * 12);
      assert.equal(quiz.quiz.questions.length, 72);
      assert.deepEqual(quiz.quiz.archetypeQuestions, []);
      assert.deepEqual(quiz.quiz.answerOptions.map(option => option.id), ANSWERS);
    });
  }

  for (const variant of ['short', 'extended'])
  {
    test(`resultados aceitam seleção equilibrada no formato ${variant}`, () =>
    {
      const perAxis = election.questionsPerAxis(variant);
      const answers = model.axes.flatMap(axis => answersFor(
        model.questions.filter(question => question.axisId === axis.id).slice(0, perAxis), 'NEUTRAL'));
      const result = election.score({ modelId: model.modelId, variant, answers }, 'pt');
      assert.equal(result.axes.length, 12);
      assert.equal(result.axes[0].userScore, 50);
      assert.equal(result.answeredQuestionCounts.coordenacao, perAxis);
    });
  }

  test('a tradução preserva notas e metadados das perguntas', () =>
  {
    const english = election.getModel('en');
    assert.deepEqual(english.axes.map(axis => axis.id), model.axes.map(axis => axis.id));
    model.questions.forEach((original, index) =>
    {
      const translated = english.questions[index];
      assert.ok(translated.text.trim() && translated.text !== original.text);
      assert.deepEqual({ ...translated, text: '' }, { ...original, text: '' });
    });
    const portugueseResult = scoreAll('NEUTRAL', 'pt');
    const englishResult = scoreAll('NEUTRAL', 'en');
    assert.deepEqual(englishResult.candidates, portugueseResult.candidates);
    assert.deepEqual(englishResult.closestCandidateIds, portugueseResult.closestCandidateIds);
    assert.equal(english.axes[0].label, 'Economic coordination');
    assert.equal(english.candidates[0].evidence.coordenacao.summary,
      'Industrial policy with local content; simpler business rules; smooths fuel prices.');
  });

  test('o quiz traz as oito propostas dos planos no idioma pedido', () =>
  {
    for (const language of ['pt', 'en'])
    {
      const quiz = election.getQuiz('short', language);
      assert.deepEqual(quiz.proposals, election.getModel(language).proposals);
      assert.equal(quiz.proposals.length, 8);
    }
    const portuguese = election.getQuiz('short', 'pt').proposals;
    const english = election.getQuiz('short', 'en').proposals;
    portuguese.forEach((original, index) =>
    {
      assert.ok(english[index].text.trim() && english[index].text !== original.text);
      assert.deepEqual({ ...english[index], text: '' }, { ...original, text: '' });
    });
    for (const candidate of ['flavio-bolsonaro', 'lula-da-silva'])
    {
      assert.equal(portuguese.filter(proposal => proposal.proponentId === candidate).length, 4);
    }
  });

  test('respostas opostas levam cada eixo ao polo oposto', () =>
  {
    for (const pole of ['LEFT', 'RIGHT'])
    {
      const answers = model.questions.map(question => ({ questionId: question.id,
        answer: question.agreePole === pole ? 'STRONGLY_AGREE' : 'STRONGLY_DISAGREE' }));
      const result = election.score({ modelId: model.modelId, variant: 'extreme', answers }, 'pt');
      assert.ok(result.axes.every(axis => axis.userScore === (pole === 'LEFT' ? 100 : 0)));
    }
  });

  test('neutro e concordância uniforme centralizam os eixos', () =>
  {
    for (const answer of ['NEUTRAL', 'STRONGLY_AGREE', 'STRONGLY_DISAGREE'])
    {
      assert.ok(scoreAll(answer).axes.every(axis => axis.userScore === 50));
    }
  });

  test('as respostas dos candidatos reproduzem os perfis e casam 100% consigo mesmos', () =>
  {
    const expected = {
      'lula-da-silva': [75.0, 66.7, 79.2, 62.5, 79.2, 70.8, 58.3, 83.3, 75.0, 58.3, 87.5, 58.3],
      'flavio-bolsonaro': [29.2, 45.8, 29.2, 16.7, 20.8, 33.3, 50.0, 16.7, 12.5, 20.8, 50.0, 33.3]
    };
    for (const candidate of model.candidates)
    {
      const answers = Object.entries(candidate.answers).map(([questionId, answer]) => ({ questionId, answer }));
      const result = election.score({ modelId: model.modelId, variant: 'extreme', answers }, 'pt');
      assert.deepEqual(result.axes.map(axis => axis.userScore), expected[candidate.id]);
      assert.deepEqual(result.closestCandidateIds, [candidate.id]);
      assert.equal(result.candidates[0].compatibility, 100);
      assert.equal(result.candidates[0].distance, 0);
      assert.ok(result.axes.every(axis => axis.userScore === axis.candidateScores[candidate.id]));
    }
  });

  test('mudar um tema afeta só o seu eixo, com impacto limitado', () =>
  {
    const answers = neutralAnswers();
    answers[0] = { questionId: model.questions[0].id, answer: 'STRONGLY_AGREE' };
    const before = scoreAll('NEUTRAL');
    const after = election.score({ modelId: model.modelId, variant: 'extreme', answers }, 'pt');
    assert.equal(after.axes[0].userScore, 58.3);
    assert.ok(after.axes.slice(1).every(axis => axis.userScore === 50));
    const beforeDistances = Object.fromEntries(before.candidates.map(candidate => [candidate.id, candidate.distance]));
    assert.ok(after.candidates.every(candidate => Math.abs(candidate.distance - beforeDistances[candidate.id]) <= 0.8));
  });

  test('cada passo da escala move só o eixo certo, na direção certa', () =>
  {
    for (const question of model.questions)
    {
      let previous = question.agreePole === 'LEFT' ? 101 : -1;
      for (const answer of ANSWERS)
      {
        const vector = election.scoreVector([{ questionId: question.id, answer }]);
        const score = vector[question.axisId];
        if (question.agreePole === 'LEFT') assert.ok(score < previous);
        else assert.ok(score > previous);
        assert.ok(Object.entries(vector).every(([axisId, value]) => axisId === question.axisId || value === 50));
        previous = score;
      }
    }
  });

  test('usuário equidistante recebe os dois candidatos sem viés de ordem', () =>
  {
    const center = scoreAll('NEUTRAL');
    const midpoint = Object.fromEntries(center.axes.map(axis => [axis.axis.id,
      Object.values(axis.candidateScores).reduce((sum, value) => sum + value, 0) / 2]));
    const result = election.compare({ modelId: center.modelId, scores: midpoint }, 'pt');
    assert.deepEqual([...result.closestCandidateIds].sort(), ['flavio-bolsonaro', 'lula-da-silva']);
    assert.equal(result.candidates[0].distance, result.candidates[1].distance);
    assert.deepEqual(result.answeredQuestionCounts, {});
  });

  test('posições incertas são neutras e todo eixo tem evidência rastreável', () =>
  {
    const sources = new Set(model.sources.map(source => source.id));
    for (const candidate of model.candidates)
    {
      assert.equal(Object.keys(candidate.answers).length, 72);
      assert.equal(Object.keys(candidate.evidence).length, 12);
      candidate.uncertainQuestionIds.forEach(id => assert.equal(candidate.answers[id], 'NEUTRAL'));
      for (const evidence of Object.values(candidate.evidence))
      {
        assert.ok(evidence.sourceIds.length > 0 && evidence.sourceIds.every(id => sources.has(id)));
        assert.ok(evidence.locator.trim());
      }
    }
  });

  test('o resultado traz as três notas de cada eixo', () =>
  {
    const result = scoreAll('NEUTRAL');
    assert.equal(result.scoringMethod, 'mean-absolute-distance-v1');
    assert.equal(result.axes.length, 12);
    assert.equal(result.axes[0].userScore, 50);
    assert.equal(result.axes[0].candidateScores['lula-da-silva'], 75);
    assert.equal(result.axes[0].candidateScores['flavio-bolsonaro'], 29.2);
    assert.equal(result.answeredQuestionCounts.coordenacao, 6);
  });

  test('rejeita respostas repetidas, desconhecidas, faltando, desequilibradas ou de outro modelo', () =>
  {
    const duplicate = neutralAnswers();
    duplicate[1] = duplicate[0];
    const unknown = neutralAnswers();
    unknown[0] = { questionId: 'economia_01', answer: 'NEUTRAL' };
    const unbalanced = answersFor(model.questions.filter(question => question.agreePole === 'LEFT'), 'NEUTRAL');
    const requests = [
      { modelId: model.modelId, variant: 'extreme', answers: duplicate },
      { modelId: model.modelId, variant: 'extreme', answers: unknown },
      { modelId: model.modelId, variant: 'extreme', answers: neutralAnswers().slice(0, 71) },
      { modelId: model.modelId, variant: 'short', answers: unbalanced },
      { modelId: 'general-12axes', variant: 'extreme', answers: neutralAnswers() },
      { modelId: model.modelId, variant: 'unknown', answers: neutralAnswers() },
      { modelId: model.modelId, variant: 'short', answers: [null] },
      { modelId: model.modelId, variant: 'extreme', answers: [...neutralAnswers().slice(0, 71), { questionId: model.questions[71].id, answer: 'MAYBE' }] }
    ];
    requests.forEach(request => assertBadRequest(() => election.score(request, 'pt')));
  });

  test('rejeita vetores incompletos, fora da faixa, não finitos ou de outro modelo', () =>
  {
    const centered = Object.fromEntries(model.axes.map(axis => [axis.id, 50]));
    for (const invalid of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY, null, '50'])
    {
      assertBadRequest(() => election.compare({ modelId: model.modelId, scores: { ...centered, coordenacao: invalid } }, 'pt'));
    }
    assertBadRequest(() => election.compare({ modelId: model.modelId, scores: { economia: 50 } }, 'pt'));
    assertBadRequest(() => election.compare({ modelId: 'obsolete-model', scores: centered }, 'pt'));
  });
});
