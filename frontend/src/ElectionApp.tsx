import { useEffect, useRef, useState } from 'react';
import { ScaleQuestion } from './components/election/ScaleQuestion';
import { LANG } from './i18n';
import { fetchElectionQuiz, submitElectionAnswers } from './services/electionApi';
import site from './site.json';
import profiles from './data/electionProfiles.generated.json';
import { CandidateCard, ComparisonAxis, ProfileCard, candidatePage, profileText } from './components/election/ProfileComponents';
import { HomeEducation } from './components/election/HomeEducation';
import educationTranslations from './i18n/electionEducation.json';
import questionExamples from './i18n/electionQuestionExamples.json';
import presentation from './utils/electionPresentation.cjs';
import type { ElectionComparison, ElectionQuiz } from './types/election';
import type { AnswerValue, QuizPayload, QuizVariant } from './types/quiz';
import { selectAllQuestionsBalanced, selectAndBalanceQuestions } from './utils/quizSelection';

const languagePrefix = LANG === 'en' ? '/en' : '';
const AUTO_ADVANCE_KEY = '2turno-auto-advance';

function readAutoAdvance(): boolean
{
  try
  {
    return window.localStorage.getItem(AUTO_ADVANCE_KEY) !== 'false';
  }
  catch
  {
    return true;
  }
}
const text = LANG === 'pt' ? {
  title: '2 Turno — Lula x Flávio Bolsonaro',
  heading: 'Lula ou Flávio? Veja de quem você está mais perto.',
  introduction: 'Responda a perguntas sobre 12 temas, de impostos a armas, e compare suas respostas com as posições de Lula e Flávio Bolsonaro tiradas dos planos de governo e de atos públicos.',
  runoff: 'Segundo turno · 25 de outubro de 2026',
  candidates: 'Candidatos do segundo turno',
  proposals: 'Ver posições por eixo',
  start: 'Fazer o quiz',
  formats: [
    { name: 'Curto', count: '36 perguntas', time: '~5 min', description: 'Uma visão rápida dos 12 temas.' },
    { name: 'Completo', count: '60 perguntas', time: '~8 min', description: 'Equilíbrio entre tempo e precisão.' },
    { name: 'Todos os temas', count: '72 perguntas', time: '~10 min', description: 'Todas as perguntas, para o resultado mais preciso.' }
  ],
  recommended: 'Recomendado',
  previous: 'Anterior',
  next: 'Próxima',
  finish: 'Comparar respostas',
  restart: 'Começar novamente',
  scale: { help: 'O que está em jogo', helpAria: 'O que está em jogo nesta pergunta: eixo e exemplo', scaleAria: 'Sua resposta', example: 'Na prática:' },
  autoAdvance: 'Avançar ao responder',
  agreeHint: (pole: string) => `Concordar com esta frase aproxima você de “${pole}”; discordar, do polo oposto.`,
  loading: 'Carregando o quiz…',
  results: 'Suas respostas, Lula e Flávio Bolsonaro',
  closest: 'Mais próximo das suas respostas:',
  tie: 'Os dois candidatos estão igualmente próximos das suas respostas.',
  compatibility: 'Compatibilidade',
  axis: 'Eixo',
  user: 'Você',
  disclaimer: 'Proximidade neste questionário não é recomendação de voto. Posições sem evidência específica foram centradas; consulte as fontes e incertezas.',
  methodology: 'Metodologia e fontes',
  unavailable: 'Esta página não existe no 2 Turno.',
  leave: 'Voltar ao início',
  navigation: 'Navegação'
} : {
  title: '2 Turno — Lula vs. Flávio Bolsonaro',
  heading: 'Lula or Flávio? See who you are closer to.',
  introduction: 'Answer questions on 12 topics, from taxes to guns, and compare your answers with Lula’s and Flávio Bolsonaro’s positions, drawn from their government programmes and public record.',
  runoff: 'Runoff · 25 October 2026',
  candidates: 'Runoff candidates',
  proposals: 'See positions by axis',
  start: 'Take the quiz',
  formats: [
    { name: 'Short', count: '36 questions', time: '~5 min', description: 'A quick look at all 12 topics.' },
    { name: 'Extended', count: '60 questions', time: '~8 min', description: 'A balance between time and precision.' },
    { name: 'All topics', count: '72 questions', time: '~10 min', description: 'Every question, for the most precise result.' }
  ],
  recommended: 'Recommended',
  previous: 'Previous',
  next: 'Next',
  finish: 'Compare answers',
  restart: 'Start again',
  scale: { help: 'What is at stake', helpAria: 'What is at stake in this question: axis and example', scaleAria: 'Your answer', example: 'In practice:' },
  autoAdvance: 'Advance on answer',
  agreeHint: (pole: string) => `Agreeing with this statement moves you toward “${pole}”; disagreeing, toward the opposite pole.`,
  loading: 'Loading the quiz…',
  results: 'Your answers, Lula and Flávio Bolsonaro',
  closest: 'Closest to your answers:',
  tie: 'Both candidates are equally close to your answers.',
  compatibility: 'Compatibility',
  axis: 'Axis',
  user: 'You',
  disclaimer: 'Closeness on this questionnaire is not a voting recommendation. Positions without specific evidence were centered; consult the sources and uncertainty.',
  methodology: 'Methodology and sources',
  unavailable: 'This page does not exist on 2 Turno.',
  leave: 'Return home',
  navigation: 'Navigation'
};

export default function ElectionApp()
{
  const [choosingFormat, setChoosingFormat] = useState(false);
  const [variant, setVariant] = useState<QuizVariant>('extended');
  const [model, setModel] = useState<ElectionQuiz | null>(null);
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(readAutoAdvance);
  const advanceTimer = useRef<number | null>(null);
  const [comparison, setComparison] = useState<ElectionComparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userScores = comparison ? Object.fromEntries(comparison.axes.map(entry => [entry.axis.id, entry.userScore])) : undefined;
  const userClassification = userScores ? presentation.classificationLabels(userScores, LANG) : null;
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  const available = ['/', '/br', '/en', '/results', '/en/results', '/240questions'].includes(path);

  useEffect(() =>
  {
    document.title = text.title;
    document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en';
  }, []);

  useEffect(() =>
  {
    if (window.location.hash === '#teste') setChoosingFormat(true);
  }, []);

  useEffect(() =>
  {
    if (userClassification)
    {
      document.body.dataset.politicalFamily = userClassification.family;
      document.body.style.setProperty('--result-background', userClassification.background);
      document.body.style.setProperty('--result-color', userClassification.color);
    }
    return () =>
    {
      delete document.body.dataset.politicalFamily;
      document.body.style.removeProperty('--result-background');
      document.body.style.removeProperty('--result-color');
    };
  }, [userClassification?.family, userClassification?.background, userClassification?.color]);

  async function startQuiz()
  {
    setBusy(true);
    setError(null);
    try
    {
      const response = await fetchElectionQuiz(variant);
      setModel(response);
      setQuiz(variant === 'extreme' ? selectAllQuestionsBalanced(response.quiz) : selectAndBalanceQuestions(response.quiz));
      setAnswers({});
      setQuestionIndex(0);
      setComparison(null);
    }
    catch (failure)
    {
      setError((failure as Error).message);
    }
    finally
    {
      setBusy(false);
    }
  }



  async function finishQuiz()
  {
    if (!quiz || !model) return;
    setBusy(true);
    setError(null);
    try
    {
      const result = await submitElectionAnswers({
        modelId: model.modelId,
        variant: quiz.variant,
        answers: quiz.questions.map(question => ({ questionId: question.id, answer: answers[question.id] }))
      });
      setComparison(result);
      setQuiz(null);
    }
    catch (failure)
    {
      setError((failure as Error).message);
    }
    finally
    {
      setBusy(false);
    }
  }

  // Troca de pergunta (botões, novo quiz ou saída) cancela um avanço automático pendente.
  useEffect(() => () =>
  {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  }, [questionIndex, quiz]);

  function toggleAutoAdvance()
  {
    const next = !autoAdvance;
    setAutoAdvance(next);
    try
    {
      window.localStorage.setItem(AUTO_ADVANCE_KEY, String(next));
    }
    catch
    {
      // Sem armazenamento (aba privada, bloqueio): a escolha vale só nesta visita.
    }
  }

  // Com o avanço automático, responder leva à próxima pergunta; a última espera o botão de comparar.
  function selectAnswer(questionId: string, answer: AnswerValue)
  {
    setAnswers(previous => ({ ...previous, [questionId]: answer }));
    if (!autoAdvance || !quiz || questionIndex >= quiz.questions.length - 1) return;
    const answeredIndex = questionIndex;
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() =>
    {
      advanceTimer.current = null;
      setQuestionIndex(index => (index === answeredIndex ? answeredIndex + 1 : index));
    }, 250);
  }

  const question = quiz?.questions[questionIndex];
  const questionAxis = question && quiz?.axes.find(axis => axis.id === question.axisId);
  const questionExample = question && (questionExamples[LANG] as Record<string, string>)[question.id];

  return <div className="election-app">
    <header className="election-header">
      <a className="election-brand" href={languagePrefix || '/'}>
        <img src="/logo-2turno.png" alt={site.name} width={166} height={38} />
      </a>
      <nav aria-label={text.navigation}>
        <a href={`${languagePrefix || '/'}#teste`} onClick={() => { setQuiz(null); setComparison(null); setChoosingFormat(true); }}>{educationTranslations[LANG].quizLink}</a>
        {site.candidates.map(candidate => <a key={candidate.id} href={candidatePage(candidate.id)}>{candidate.name}</a>)}
        <a href={`${languagePrefix}/election-methodology`}>{text.methodology}</a>
        <a href={LANG === 'pt' ? '/en' : '/'} lang={LANG === 'pt' ? 'en' : 'pt-BR'}>{LANG === 'pt' ? 'English' : 'Português'}</a>
      </nav>
    </header>
    <main>
      {!available ? <section><h1>{text.unavailable}</h1><a href={languagePrefix || '/'}>{text.leave}</a></section> : <>
        {error && <p role="alert">{error}</p>}
        {busy && <p role="status">{text.loading}</p>}
        {!quiz && !comparison && <>
          <section className="home-hero">
            <div className="home-hero-portraits" aria-hidden="true">
              {site.candidates.map(candidate => <div className="hero-candidate" key={candidate.id}>
                <img src={candidate.portrait} alt="" width="480" height="640" fetchPriority="high" />
                <span>{candidate.name}</span>
              </div>)}
              <span className="hero-versus">×</span>
            </div>
            <div className="home-hero-text">
              <p className="election-kicker">{text.runoff}</p>
              <h1>{text.heading}</h1>
              <p>{text.introduction}</p>
            </div>
          </section>
          <div className="home-options" id="teste">
            <article className="questionnaire-card">
              <span className="questionnaire-symbol" aria-hidden="true">12</span>
              <h2>{profileText.questionnaire}</h2>
              <p>{profileText.questionnaireDescription}</p>
              <button className="profile-link" type="button" disabled={busy} onClick={() => setChoosingFormat(true)}>{profileText.start}</button>
            </article>
            {profiles.candidates.map(candidate => <CandidateCard key={candidate.id} candidate={candidate} />)}
          </div>
          {choosingFormat && <section className="election-start" aria-label={profileText.formats}>
            <fieldset className="format-options">
              <legend>{profileText.formats}</legend>
              {(['short', 'extended', 'extreme'] as const).map((format, index) =>
              {
                const option = text.formats[index];
                return <label key={format} className={variant === format ? 'format-option selected' : 'format-option'}>
                  <input type="radio" name="questionnaire-format" value={format} checked={variant === format}
                    onChange={() => setVariant(format)} disabled={busy} />
                  <span className="format-option-head">
                    <span className="format-option-radio" aria-hidden="true" />
                    <strong>{option.name}</strong>
                    {format === 'extended' && <span className="format-option-badge">{text.recommended}</span>}
                  </span>
                  <span className="format-option-meta">{option.count} · {option.time}</span>
                  <span className="format-option-description">{option.description}</span>
                </label>;
              })}
            </fieldset>
            <button className="format-start" type="button" onClick={startQuiz} disabled={busy}>
              {profileText.begin}<span aria-hidden="true"> →</span>
            </button>
          </section>}
          <HomeEducation />
        </>}
        {quiz && question && <section>
          <ScaleQuestion key={question.id} question={question} axis={questionAxis}
            index={questionIndex} total={quiz.questions.length} answered={Object.keys(answers).length}
            axisDescription={educationTranslations[LANG].axisDescriptions[question.axisId as keyof typeof educationTranslations.pt.axisDescriptions]}
            example={questionExample}
            agreeHint={questionAxis && text.agreeHint(question.agreePole === 'LEFT' ? questionAxis.leftPole : questionAxis.rightPole)}
            options={quiz.answerOptions} selected={answers[question.id]} disabled={busy} text={text.scale}
            onSelect={answer => selectAnswer(question.id, answer)} />
          <div className="election-actions quiz-navigation">
            <button type="button" disabled={busy || questionIndex === 0} onClick={() => setQuestionIndex(questionIndex - 1)}>{text.previous}</button>
            <button className="auto-advance-toggle" type="button" role="switch" aria-checked={autoAdvance} onClick={toggleAutoAdvance}>
              <span className="auto-advance-switch" aria-hidden="true" />
              {text.autoAdvance}
            </button>
            {questionIndex < quiz.questions.length - 1
              ? <button type="button" disabled={busy || !answers[question.id]} onClick={() => setQuestionIndex(questionIndex + 1)}>{text.next}</button>
              : <button type="button" disabled={busy || Object.keys(answers).length !== quiz.questions.length} onClick={finishQuiz}>{text.finish}</button>}
          </div>
        </section>}
        {comparison && <section className="election-results">
          <h1>{text.results}</h1>
          <p>{comparison.closestCandidateIds.length === 2 ? text.tie : `${text.closest} ${comparison.candidates[0].name}`}</p>
          <ProfileCard axes={comparison.axes.map(entry => entry.axis)}
            scores={Object.fromEntries(comparison.axes.map(entry => [entry.axis.id, entry.userScore]))} />
          <h2>{text.candidates}</h2>
          <div className="election-grid">{comparison.candidates.map(match =>
          {
            const candidate = profiles.candidates.find(profile => profile.id === match.id);
            if (!candidate) return null;
            const scores = Object.fromEntries(comparison.axes.map(entry => [entry.axis.id, entry.candidateScores[match.id]]));
            return <CandidateCard key={match.id} candidate={{ ...candidate, scores }} compatibility={match.compatibility} />;
          })}</div>
          <details className="comparison-section detailed-comparison">
            <summary>{profileText.detailedComparison}</summary>
            <h2>{profileText.compare}</h2>
            <p>{profileText.exact}</p>
            <div className="comparison-profile">{comparison.axes.map(entry => <ComparisonAxis key={entry.axis.id} axis={entry.axis} markers={[
              { name: profileText.you, symbol: '★', score: entry.userScore, color: userClassification?.color },
              ...profiles.candidates.map(candidate => ({ name: candidate.name, symbol: String(candidate.number), score: entry.candidateScores[candidate.id], color: presentation.classificationLabels(candidate.scores, LANG).color }))
            ]} />)}</div>
          </details>
          <p>{text.disclaimer}</p>
          <a href={`${languagePrefix}/election-methodology`}>{text.methodology}</a>
          <div className="election-actions"><button type="button" onClick={() => setComparison(null)}>{text.restart}</button></div>
        </section>}
      </>}
    </main>
    <footer>{site.name} · {text.runoff}</footer>
  </div>;
}
