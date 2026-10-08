// Regras das propostas dos planos na página de resultado. Não participam da compatibilidade.

// Embaralha uma cópia (Fisher–Yates). `random` é injetável para os testes.
function shuffleProposals(proposals, random = Math.random)
{
    const shuffled = proposals.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1)
    {
        const other = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    return shuffled;
}



// A intensidade não muda o veredito: duas respostas favoráveis não divergem entre si.
const verdicts = { STRONGLY_AGREE: 'agree', AGREE: 'agree', NEUTRAL: 'neutral', DISAGREE: 'disagree', STRONGLY_DISAGREE: 'disagree' };

function proposalVerdict(answer)
{
    const verdict = verdicts[answer];
    if (!verdict) throw new Error('Unknown answer: ' + answer);
    return verdict;
}



// "p. 35" → 35; "pp. 49–50" → 49. Usada no link para a página do plano.
function firstPage(locator)
{
    const match = /\bpp?\.\s*(\d+)/.exec(locator ?? '');
    return match ? Number(match[1]) : null;
}

module.exports = { shuffleProposals, proposalVerdict, firstPage };
