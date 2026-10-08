import { useEffect, useRef, useState } from 'react';
import { HistoricalComparisons } from './components/election/HistoricalComparisons';
import { PlanProposals } from './components/election/PlanProposals';
import { ScaleQuestion } from './components/election/ScaleQuestion';
import { ShareResult } from './components/election/ShareResult';
import { LANG } from './i18n';
import { fetchElectionQuiz, submitElectionAnswers } from './services/electionApi';
import site from './site.json';
import profiles from './data/electionProfiles.generated.json';
import { CandidateCard, ComparisonAxis, ProfileCard, candidatePage, profileText } from './components/election/ProfileComponents';
import { HomeEducation } from './components/election/HomeEducation';
import educationTranslations from './i18n/electionEducation.json';
import questionExamples from './i18n/electionQuestionExamples.json';
import presentation from './utils/electionPresentation.cjs';
import alignment from './utils/electionAlignment.cjs';
import radicalMode from './utils/extremistMode.cjs';
import type { ElectionComparison, ElectionQuiz } from './types/election';
import type { AnswerValue, QuizPayload, QuizVariant } from './types/quiz';
import { selectAllQuestionsBalanced, selectAndBalanceQuestions } from './utils/quizSelection';
import { answeredElectionCount, clearElectionProgress, loadElectionProgress, restoreElectionQuiz, saveElectionProgress } from './utils/electionProgress';

const languagePrefix = LANG === 'en' ? '/en' : '';
const AUTO_ADVANCE_KEY = '2turno-auto-advance';
const LANGUAGE_PROGRESS_KEY = '2turno-language-progress';

interface LanguageProgress
{
  modelId?: string;
  variant: QuizVariant;
  choosingFormat: boolean;
  answers: Record<string, AnswerValue>;
  questionIndex: number;
  questionIds: string[];
  comparison: ElectionComparison | null;
  modeActive?: boolean;
  radicalScores?: Record<string, number> | null;
}



function readLanguageProgress(): LanguageProgress | null
{
  try { return JSON.parse(window.sessionStorage.getItem(LANGUAGE_PROGRESS_KEY) ?? 'null'); }
  catch { return null; }
}



function readExtremistPreference(): boolean
{
  try { return window.localStorage.getItem('2turno-extremist-mode') === 'true'; }
  catch { return false; }
}



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
  scale: { help: 'O que está em jogo', helpAria: 'O que está em jogo nesta pergunta: eixo e exemplo', scaleAria: 'Sua resposta', example: 'Na prática:', instruction: 'Quanto você concorda com esta frase?' },
  autoAdvance: 'Avançar ao responder',
  resume: {
    eyebrow: 'Quiz em andamento',
    extremistEyebrow: 'Modo extremista em andamento',
    title: 'Continue de onde parou',
    body: (answered: number, total: number) => `Você já respondeu ${answered} de ${total} perguntas. Suas respostas estão guardadas neste navegador.`,
    continue: 'Continuar',
    discard: 'Começar de novo',
    unavailable: 'As perguntas mudaram desde a sua última visita, então não dá para continuar. Comece um novo quiz.'
  },
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
  navigation: 'Navegação', skip: 'Pular para o conteúdo'
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
  scale: { help: 'What is at stake', helpAria: 'What is at stake in this question: axis and example', scaleAria: 'Your answer', example: 'In practice:', instruction: 'How much do you agree with this statement?' },
  autoAdvance: 'Advance on answer',
  resume: {
    eyebrow: 'Quiz in progress',
    extremistEyebrow: 'Extremist mode in progress',
    title: 'Pick up where you left off',
    body: (answered: number, total: number) => `You have answered ${answered} of ${total} questions. Your answers are saved in this browser.`,
    continue: 'Continue',
    discard: 'Start over',
    unavailable: 'The questions have changed since your last visit, so the quiz cannot be resumed. Please start a new one.'
  },
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
  navigation: 'Navigation', skip: 'Skip to content'
};

export default function ElectionApp()
{
  const [savedProgress] = useState(readLanguageProgress);
  const [modeActive, setModeActive] = useState(savedProgress?.modeActive ?? readExtremistPreference());
  const [radicalScores, setRadicalScores] = useState<Record<string, number> | null>(savedProgress?.radicalScores ?? null);
  const [choosingFormat, setChoosingFormat] = useState(false);
  const [variant, setVariant] = useState<QuizVariant>('extended');
  const [model, setModel] = useState<ElectionQuiz | null>(null);
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(savedProgress?.answers ?? {});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(readAutoAdvance);
  const advanceTimer = useRef<number | null>(null);
  const [comparison, setComparison] = useState<ElectionComparison | null>(null);
  const [busy, setBusy] = useState(Boolean(savedProgress));
  const [error, setError] = useState<string | null>(null);
  // Quiz deixado pela metade em outra visita (ou antes de voltar ao início).
  const [pendingProgress, setPendingProgress] = useState(loadElectionProgress);
  const onHome = !quiz && !comparison && !radicalScores;
  const radicalAlignment = radicalScores ? alignment.compareProfiles(radicalScores, profiles.candidates, profiles.axes[LANG]) : null;
  const userScores = radicalScores ?? (comparison ? Object.fromEntries(comparison.axes.map(entry => [entry.axis.id, entry.userScore])) : undefined);
  const radicalClassification = radicalScores ? radicalMode.classifyRadicalProfile(radicalScores, answers, LANG) : undefined;
  const userClassification = radicalClassification ?? (userScores ? presentation.classificationLabels(userScores, LANG) : null);
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
    let cancelled = false;
    async function restoreProgress()
    {
      const saved = savedProgress;
      if (!saved) return;
      setBusy(true);
      try
      {
        if (saved.modeActive)
        {
          const restored = radicalMode.createRadicalQuiz(profiles.axes[LANG], LANG);
          if (cancelled) return;
          setChoosingFormat(saved.choosingFormat);
          setAnswers(saved.answers);
          setQuestionIndex(saved.questionIndex);
          if (!saved.radicalScores && saved.questionIds.length) setQuiz(restored);
          window.sessionStorage.removeItem(LANGUAGE_PROGRESS_KEY);
          return;
        }
        const response = await fetchElectionQuiz(saved.variant);
        if (saved.modelId && saved.modelId !== response.modelId) throw new Error(text.unavailable);
        const translatedQuestions = saved.questionIds.flatMap(identifier =>
          response.quiz.questions.filter(question => question.id === identifier));
        if (translatedQuestions.length !== saved.questionIds.length) throw new Error(text.unavailable);
        if (cancelled) return;
        setModel(response);
        setVariant(saved.variant);
        setChoosingFormat(saved.choosingFormat);
        setAnswers(saved.answers);
        setQuestionIndex(saved.questionIndex);
        if (saved.comparison)
        {
          setComparison({ ...saved.comparison, axes: saved.comparison.axes.map((entry: ElectionComparison['axes'][number]) =>
            ({ ...entry, axis: response.quiz.axes.find(axis => axis.id === entry.axis.id) ?? entry.axis })) });
        }
        else if (translatedQuestions.length) setQuiz({ ...response.quiz, questions: translatedQuestions });
        window.sessionStorage.removeItem(LANGUAGE_PROGRESS_KEY);
      }
      catch (failure) { if (!cancelled) setError((failure as Error).message); }
      finally { if (!cancelled) setBusy(false); }
    }
    void restoreProgress();
    return () => { cancelled = true; };
  }, [savedProgress]);



  // Guarda o andamento a cada resposta: em outra visita, o início oferece continuar de onde parou.
  useEffect(() =>
  {
    if (!quiz || !Object.keys(answers).length) return;
    saveElectionProgress({
      mode: modeActive ? 'extremist' : 'election', variant: quiz.variant,
      questionIds: quiz.questions.map(entry => entry.id), answers, questionIndex
    });
  }, [quiz, answers, questionIndex, modeActive]);

  // Ao voltar ao início no meio do quiz (pelo menu, por exemplo), o aviso reaparece.
  useEffect(() =>
  {
    if (onHome) setPendingProgress(loadElectionProgress());
  }, [onHome]);



  function preserveLanguageProgress()
  {
    try
    {
      window.sessionStorage.setItem(LANGUAGE_PROGRESS_KEY, JSON.stringify({
        modelId: model?.modelId, variant, choosingFormat, answers, questionIndex,
        questionIds: quiz?.questions.map(question => question.id) ?? [], comparison, modeActive, radicalScores
      }));
    }
    catch
    {
      // Language navigation remains available when browser storage is disabled.
    }
  }

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

  useEffect(() =>
  {
    if (modeActive) document.documentElement.dataset.extremistMode = 'true';
    try { window.localStorage.setItem('2turno-extremist-mode', String(modeActive)); }
    catch { /* The mode remains usable without browser storage. */ }
    return () => { delete document.documentElement.dataset.extremistMode; };
  }, [modeActive]);



  function toggleExtremistMode()
  {
    setModeActive(previous => !previous);
    setRadicalScores(null);
    setQuiz(null);
    setComparison(null);
    setChoosingFormat(false);
    setQuestionIndex(0);
    setModel(null);
    setAnswers({});
    setError(null);
  }



  async function startQuiz()
  {
    clearElectionProgress();
    setPendingProgress(null);
    setBusy(true);
    setError(null);
    try
    {
      if (modeActive)
      {
        setModel(null);
        setQuiz(radicalMode.createRadicalQuiz(profiles.axes[LANG], LANG));
        setAnswers({});
        setQuestionIndex(0);
        setRadicalScores(null);
        return;
      }
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
    if (!quiz) return;
    if (modeActive)
    {
      setRadicalScores(radicalMode.scoreRadicalAnswers(answers));
      clearElectionProgress();
      setQuiz(null);
      return;
    }
    if (!model) return;
    setBusy(true);
    setError(null);
    try
    {
      const result = await submitElectionAnswers({
        modelId: model.modelId,
        variant: quiz.variant,
        answers: quiz.questions.map(question => ({ questionId: question.id, answer: answers[question.id] }))
      });
      clearElectionProgress();
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

  // Põe na tela o quiz guardado: mesmo modo, mesmas perguntas na mesma ordem, respostas e posição.
  async function resumeProgress()
  {
    const saved = pendingProgress;
    if (!saved) return;
    setBusy(true);
    setError(null);
    try
    {
      const extremist = saved.mode === 'extremist';
      const response = extremist ? null : await fetchElectionQuiz(saved.variant);
      const restored = restoreElectionQuiz(response?.quiz ?? radicalMode.createRadicalQuiz(profiles.axes[LANG], LANG), saved);
      if (!restored)
      {
        clearElectionProgress();
        setPendingProgress(null);
        setError(text.resume.unavailable);
        return;
      }
      setModeActive(extremist);
      setModel(response);
      setVariant(saved.variant);
      setRadicalScores(null);
      setComparison(null);
      setChoosingFormat(false);
      setAnswers(saved.answers);
      setQuestionIndex(Math.min(saved.questionIndex, restored.questions.length - 1));
      setQuiz(restored);
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



  function discardProgress()
  {
    clearElectionProgress();
    setPendingProgress(null);
    setError(null);
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
    <a className="skip-link" href="#main-content">{text.skip}</a>
    <header className="election-header">
      <a className="election-brand" href={languagePrefix || '/'}>
        <img src="/logo-2turno.png" alt={site.name} width={166} height={38} />
      </a>
      <nav aria-label={text.navigation}>
        <a href={`${languagePrefix || '/'}#teste`} onClick={() => { setQuiz(null); setComparison(null); setRadicalScores(null); setChoosingFormat(true); }}>{educationTranslations[LANG].quizLink}</a>
        {site.candidates.map(candidate => <a key={candidate.id} href={candidatePage(candidate.id)}>{candidate.name}</a>)}
        <a href={`${languagePrefix}/election-methodology`}>{text.methodology}</a>
        <a href={LANG === 'pt' ? '/en' : '/'} onClick={preserveLanguageProgress} lang={LANG === 'pt' ? 'en' : 'pt-BR'}>{LANG === 'pt' ? 'English' : 'Português'}</a>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      {!available ? <section><h1>{text.unavailable}</h1><a href={languagePrefix || '/'}>{text.leave}</a></section> : <>
        {error && <p role="alert">{error}</p>}
        {busy && <p role="status">{text.loading}</p>}
        {onHome && !busy && <>
          {pendingProgress && <section className="resume-card" aria-labelledby="resume-title">
            <div className="resume-body">
              <p className="resume-eyebrow">{pendingProgress.mode === 'extremist' ? text.resume.extremistEyebrow : text.resume.eyebrow}</p>
              <h2 id="resume-title">{text.resume.title}</h2>
              <p className="resume-text">{text.resume.body(answeredElectionCount(pendingProgress), pendingProgress.questionIds.length)}</p>
              <div className="resume-bar" aria-hidden="true">
                <span style={{ width: `${Math.max(2, Math.round(answeredElectionCount(pendingProgress) / pendingProgress.questionIds.length * 100))}%` }} />
              </div>
            </div>
            <div className="resume-actions">
              <button className="resume-continue" type="button" onClick={() => void resumeProgress()}>{text.resume.continue}<span aria-hidden="true">→</span></button>
              <button className="resume-discard" type="button" onClick={discardProgress}>{text.resume.discard}</button>
            </div>
          </section>}
          <div className="extremist-mode-control">
            <button type="button" className="extremist-mode-toggle" aria-pressed={modeActive} onClick={toggleExtremistMode}>
              {LANG === 'pt' ? 'Modo extremista' : 'Extremist mode'} · {modeActive ? 'ON' : 'OFF'}
            </button>
            {modeActive && <p>{LANG === 'pt' ? '40 perguntas radicais. Perfil separado do quiz eleitoral.' : '40 radical questions. A profile separate from the election quiz.'}</p>}
          </div>
          {modeActive ? <section className="extremist-hero">
            <img src="/extremist-fight-poster.webp" alt={LANG === 'pt' ? 'Pôster fictício de MMA: Flávio Bolsonaro contra Lula' : 'Fictional MMA fight poster: Flávio Bolsonaro versus Lula'} width="1862" height="845" />
            <div><p className="election-kicker">2TURNO · {LANG === 'pt' ? 'MODO EXTREMISTA' : 'EXTREMIST MODE'}</p>
              <h1>{LANG === 'pt' ? 'Ideias no limite. Onde você fica?' : 'Ideas at the limit. Where do you stand?'}</h1>
              <p>{LANG === 'pt' ? 'Uma experiência opcional com afirmações políticas radicais. A luta é ficção e sátira.' : 'An optional experience with radical political statements. The fight is fiction and satire.'}</p></div>
          </section> : <section className="home-hero">
            <div className="home-hero-portraits" aria-hidden="true">
              {site.candidates.map(candidate => <div className="hero-candidate" key={candidate.id}>
                <img src={candidate.portrait} alt="" width="480" height="640" fetchPriority="high" />
                <span>{candidate.name}</span>
              </div>)}
              <span className="hero-versus">VS</span>
            </div>
            <div className="home-hero-text">
              <p className="election-kicker">{text.runoff}</p>
              <h1>{text.heading}</h1>
              <p>{text.introduction}</p>
            </div>
          </section>}
          <div className="home-options" id="teste">
            <article className="questionnaire-card">
              <span className="questionnaire-symbol" aria-hidden="true">12</span>
              <h2>{profileText.questionnaire}</h2>
              <p>{profileText.questionnaireDescription}</p>
              <button className="profile-link" type="button" disabled={busy} onClick={() => modeActive ? void startQuiz() : setChoosingFormat(true)}>{profileText.start}</button>
            </article>
            {profiles.candidates.map(candidate => <CandidateCard key={candidate.id} candidate={candidate} />)}
          </div>
          {!modeActive && choosingFormat && <section className="election-start" aria-label={profileText.formats}>
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
          {!modeActive && <HomeEducation />}
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
              : <button type="button" disabled={busy || Object.keys(answers).length !== quiz.questions.length} onClick={finishQuiz}>{modeActive ? (LANG === 'pt' ? 'Ver meu perfil' : 'See my profile') : text.finish}</button>}
          </div>
        </section>}
        {radicalScores && <section className="radical-results">
          <h1>{LANG === 'pt' ? 'Seu perfil no modo extremista' : 'Your extremist-mode profile'}</h1>
          <p>{LANG === 'pt' ? 'Estas 40 perguntas descrevem preferências sobre políticas radicais. A afinidade com políticos compara seu perfil nos doze eixos com os perfis eleitorais existentes; não representa respostas deles às perguntas radicais.' : 'These 40 questions describe preferences about radical policies. Politician alignment compares your twelve-axis profile with the existing election profiles; it does not represent their answers to these radical questions.'}</p>
          {radicalAlignment && <section className="radical-alignment" aria-label={LANG === 'pt' ? 'Afinidade com políticos' : 'Politician alignment'}>
            <h2>{radicalAlignment.closestCandidateIds.length > 1
              ? (LANG === 'pt' ? 'Empate de afinidade entre os políticos' : 'Equal alignment with both politicians')
              : (LANG === 'pt' ? 'Você está mais alinhado com ' : 'You are more aligned with ') + radicalAlignment.candidates[0].name}</h2>
            <p>{LANG === 'pt' ? 'Estimativa de proximidade entre perfis, com o mesmo peso para cada eixo.' : 'Estimated profile similarity, with equal weight for every axis.'}</p>
            <div className="election-grid">{radicalAlignment.candidates.map(match =>
            {
              const candidate = profiles.candidates.find(profile => profile.id === match.id);
              return candidate ? <CandidateCard key={match.id} candidate={candidate} compatibility={match.compatibility} /> : null;
            })}</div>
          </section>}
          <ProfileCard axes={profiles.axes[LANG]} scores={radicalScores} identifier="radical-profile" classificationOverride={radicalClassification} />
          <HistoricalComparisons scores={radicalScores} answers={answers} />
          <div className="election-actions">
            <button type="button" onClick={() => setRadicalScores(null)}>{text.restart}</button>
            <button type="button" onClick={toggleExtremistMode}>{LANG === 'pt' ? 'Sair do modo extremista' : 'Exit extremist mode'}</button>
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
          <PlanProposals proposals={model?.proposals ?? []} options={model?.quiz.answerOptions ?? []} />
          <p>{text.disclaimer}</p>
          <a href={`${languagePrefix}/election-methodology`}>{text.methodology}</a>
          <div className="election-actions"><ShareResult result={comparison} /><button type="button" onClick={() => setComparison(null)}>{text.restart}</button></div>
        </section>}
      </>}
    </main>
    <footer>{site.name} · {text.runoff}</footer>
  </div>;
}
