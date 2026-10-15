import { useId, useState } from 'react';
import { ArrowUpRight, Check, Minus, X } from 'lucide-react';
import { LANG } from '../../i18n';
import site from '../../site.json';
import help from '../../i18n/electionProposalHelp.json';
import proposalRules from '../../utils/electionProposals.cjs';
import type { ElectionProposal } from '../../types/election';
import type { AnswerValue } from '../../types/quiz';

const copy = LANG === 'pt' ?
{
    title: 'Propostas dos planos',
    introduction: 'Suas respostas às propostas de cada candidato. Não entram no cálculo de compatibilidade.',
    help: 'O que significa esta proposta?',
    answer: 'Sua resposta no questionário: ',
    source: 'Consultar o plano',
    author: 'Proposta de',
    verdict: { agree: 'Você concorda com esta proposta de ', disagree: 'Você discorda desta proposta de ', neutral: 'Você respondeu de forma neutra ou condicional à proposta de ' },
    labels: { STRONGLY_AGREE: 'Concordo totalmente', AGREE: 'Concordo', NEUTRAL: 'Neutro ou Depende', DISAGREE: 'Discordo', STRONGLY_DISAGREE: 'Discordo totalmente' }
} :
{
    title: 'Proposals from the plans',
    introduction: 'Your answers to each candidate’s proposals. Excluded from compatibility scores.',
    help: 'What does this proposal mean?',
    answer: 'Your questionnaire answer: ',
    source: 'Read the plan',
    author: 'Proposal by',
    verdict: { agree: 'You agree with this proposal by ', disagree: 'You disagree with this proposal by ', neutral: 'Your answer was neutral or conditional on this proposal by ' },
    labels: { STRONGLY_AGREE: 'Strongly agree', AGREE: 'Agree', NEUTRAL: 'Neutral or It depends', DISAGREE: 'Disagree', STRONGLY_DISAGREE: 'Strongly disagree' }
};
const helpTexts = help[LANG] as Record<string, string>;



function PlanProposal({ proposal, answer }: { proposal: ElectionProposal; answer: AnswerValue })
{
    const [helpOpen, setHelpOpen] = useState(false);
    const identifier = useId();
    const proponent = site.candidates.find(candidate => candidate.id === proposal.proponentId);
    if (!proponent) return null;
    const page = proposalRules.firstPage(proposal.sourceLocator);
    const helpText = helpTexts[proposal.id];
    const verdict = proposalRules.proposalVerdict(answer);
    const VerdictIcon = verdict === 'agree' ? Check : verdict === 'disagree' ? X : Minus;
    return <article className="plan-proposal" data-proposal={proposal.id} data-proponent={proposal.proponentId} data-verdict={verdict}>
        <div className="plan-proposal-head">
            <div className="plan-proposal-candidate">
                <img src={proponent.portrait} alt="" width="40" height="40" loading="lazy" />
                <div><span>{copy.author}</span><strong>{proponent.name}</strong></div>
            </div>
            {helpText && <button type="button" className="candidate-info-button plan-proposal-help" aria-label={copy.help}
                aria-expanded={helpOpen} aria-controls={identifier + '-help'} onClick={() => setHelpOpen(open => !open)}>
                <span aria-hidden="true">?</span>
            </button>}
        </div>
        <h3>{proposal.text}</h3>
        {helpText && <p id={identifier + '-help'} className="plan-proposal-help-text" hidden={!helpOpen}>{helpText}</p>}
        <div className="plan-proposal-reveal" data-verdict={verdict}>
            <div className="plan-proposal-response">
                <span className="plan-proposal-accessible">{copy.answer}</span>
                <strong><VerdictIcon size={16} aria-hidden="true" />{copy.labels[answer]}</strong>
            </div>
            <p className="plan-proposal-accessible">{copy.verdict[verdict]}{proponent.name}.</p>
            <a href={page ? proposal.sourceUrl + '#page=' + page : proposal.sourceUrl} target="_blank" rel="noopener noreferrer">
                {copy.source} · {proposal.sourceLocator}<ArrowUpRight size={15} aria-hidden="true" />
            </a>
        </div>
    </article>;
}



export function PlanProposals({ proposals, answers }: { proposals: ElectionProposal[]; answers: Record<string, AnswerValue> })
{
    const answered = Object.keys(answers).flatMap(identifier =>
    {
        const proposal = proposals.find(entry => entry.id === identifier);
        return proposal ? [proposal] : [];
    });
    if (!answered.length) return null;
    const bolsonaroProposals = answered.filter(proposal => proposal.proponentId === 'flavio-bolsonaro');
    const lulaProposals = answered.filter(proposal => proposal.proponentId === 'lula-da-silva');
    const orderedProposals = Array.from({ length: Math.max(bolsonaroProposals.length, lulaProposals.length) })
        .flatMap((_, index) => [bolsonaroProposals[index], lulaProposals[index]].filter(Boolean));
    return <section className="plan-proposals" aria-labelledby="plan-proposals-title">
        <h2 id="plan-proposals-title">{copy.title}</h2>
        <p className="plan-proposals-intro">{copy.introduction}</p>
        <div className="plan-proposals-list">
            {orderedProposals.map(proposal => <PlanProposal key={proposal.id} proposal={proposal} answer={answers[proposal.id]} />)}
        </div>
    </section>;
}
