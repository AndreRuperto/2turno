import { useId, useMemo, useState } from 'react';
import { LANG } from '../../i18n';
import site from '../../site.json';
import help from '../../i18n/electionProposalHelp.json';
import proposalRules from '../../utils/electionProposals.cjs';
import type { ElectionProposal } from '../../types/election';
import type { AnswerOption, AnswerValue } from '../../types/quiz';

const copy = LANG === 'pt' ? {
  title: 'Propostas dos planos',
  introduction: 'Oito propostas tiradas dos planos de governo, quatro de cada candidato. Responda sem saber de quem é cada uma. Suas respostas aqui não mudam a compatibilidade acima.',
  helpLabel: 'O que significa esta proposta?',
  verdict: { agree: 'Você concorda.', disagree: 'Você discorda.', neutral: 'Você não concorda nem discorda.' },
  proposedBy: (name: string) => `Proposta do plano de ${name}`,
  otherPlan: (name: string) => `O plano de ${name} não se posiciona sobre esta proposta.`
} : {
  title: 'Proposals from the plans',
  introduction: 'Eight proposals taken from the government plans, four from each candidate. Answer without knowing whose each one is. Your answers here do not change the compatibility above.',
  helpLabel: 'What does this proposal mean?',
  verdict: { agree: 'You agree.', disagree: 'You disagree.', neutral: 'You neither agree nor disagree.' },
  proposedBy: (name: string) => `Proposed in ${name}'s plan`,
  otherPlan: (name: string) => `${name}'s plan does not take a position on this proposal.`
};
const helpTexts = help[LANG] as Record<string, string>;



// Um cartão: a pessoa responde primeiro; o autor só aparece depois, numa região anunciada ao leitor de tela.
function PlanProposal({ proposal, options }: { proposal: ElectionProposal; options: AnswerOption[] })
{
  const [answer, setAnswer] = useState<AnswerValue | undefined>();
  const [helpOpen, setHelpOpen] = useState(false);
  const identifier = useId();
  const proponent = site.candidates.find(candidate => candidate.id === proposal.proponentId);
  const otherCandidate = site.candidates.find(candidate => candidate.id !== proposal.proponentId);
  const page = proposalRules.firstPage(proposal.sourceLocator);
  const helpText = helpTexts[proposal.id];

  return <article className="plan-proposal" data-proposal={proposal.id}>
    <div className="plan-proposal-head">
      <h3 id={`${identifier}-text`}>{proposal.text}</h3>
      {helpText && <button type="button" className="candidate-info-button plan-proposal-help" aria-label={copy.helpLabel}
        aria-expanded={helpOpen} aria-controls={`${identifier}-help`} onClick={() => setHelpOpen(open => !open)}>
        <span aria-hidden="true">?</span>
      </button>}
    </div>
    {helpText && <p id={`${identifier}-help`} className="plan-proposal-help-text" hidden={!helpOpen}>{helpText}</p>}
    <div className="plan-proposal-scale" role="radiogroup" aria-labelledby={`${identifier}-text`}>
      {options.map(option => <label key={option.id} className={answer === option.id ? 'plan-proposal-option selected' : 'plan-proposal-option'}>
        <input type="radio" name={`${identifier}-answer`} value={option.id} checked={answer === option.id}
          onChange={() => setAnswer(option.id)} />
        {option.label}
      </label>)}
    </div>
    <div className="plan-proposal-reveal" aria-live="polite">
      {answer && proponent && otherCandidate && <>
        <p><strong>{copy.verdict[proposalRules.proposalVerdict(answer)]}</strong></p>
        <p>{copy.proposedBy(proponent.name)} (<a href={page ? `${proponent.planUrl}#page=${page}` : proponent.planUrl}>{proposal.sourceLocator}</a>).</p>
        <p>{copy.otherPlan(otherCandidate.name)}</p>
      </>}
    </div>
  </article>;
}



// Seção do resultado. A ordem é sorteada uma vez para que nem ela nem a alternância revelem o autor.
export function PlanProposals({ proposals, options }: { proposals: ElectionProposal[]; options: AnswerOption[] })
{
  const ordered = useMemo(() => proposalRules.shuffleProposals(proposals), [proposals]);
  // Mesma ordem da régua do quiz: "Discordo totalmente" primeiro.
  const scale = useMemo(() => [...options].sort((first, second) => first.scoreTowardAgreement - second.scoreTowardAgreement), [options]);
  if (!ordered.length || !scale.length) return null;

  return <section className="plan-proposals" aria-labelledby="plan-proposals-title">
    <h2 id="plan-proposals-title">{copy.title}</h2>
    <p className="plan-proposals-intro">{copy.introduction}</p>
    <div className="plan-proposals-list">
      {ordered.map(proposal => <PlanProposal key={proposal.id} proposal={proposal} options={scale} />)}
    </div>
  </section>;
}
