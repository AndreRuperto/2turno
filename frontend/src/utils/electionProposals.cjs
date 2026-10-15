// Proposal questions share the quiz UI but never contribute to compatibility.
const verdicts = { STRONGLY_AGREE: 'agree', AGREE: 'agree', NEUTRAL: 'neutral', DISAGREE: 'disagree', STRONGLY_DISAGREE: 'disagree' };



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



function proposalVerdict(answer)
{
    const verdict = verdicts[answer];
    if (!verdict) throw new Error('Unknown answer: ' + answer);
    return verdict;
}



function firstPage(locator)
{
    const match = /\bpp?\.\s*(\d+)/.exec(locator ?? '');
    return match ? Number(match[1]) : null;
}



function proposalQuestions(proposals)
{
    return proposals.map(proposal => ({
        id: proposal.id, proposalId: proposal.id, axisId: proposal.axisId, agreePole: proposal.agreePole,
        text: proposal.text, topic: proposal.topic, weight: 0, core: true
    }));
}



function chooseProposals(proposals, count, random)
{
    if (count > proposals.length || count % 2) throw new Error('Invalid proposal quota.');
    const proponents = [...new Set(proposals.map(proposal => proposal.proponentId))];
    if (proponents.length !== 2) throw new Error('Two candidate proposal sets are required.');
    return proponents.flatMap(identifier =>
    {
        const selected = shuffleProposals(proposals.filter(proposal => proposal.proponentId === identifier), random).slice(0, count / 2);
        if (selected.length !== count / 2) throw new Error('Incomplete candidate proposal set.');
        return selected;
    });
}



function selectQuizQuestions(payload, proposals, random = Math.random)
{
    const count = payload.questionCount === 36 ? 2 : proposals.length;
    const selectedProposals = proposalQuestions(chooseProposals(proposals, count, random));
    const perAxis = payload.questionCount / payload.axes.length;
    const selected = [];
    let oddAxis = 0;
    for (const axis of payload.axes)
    {
        const reserved = selectedProposals.filter(question => question.axisId === axis.id);
        const scoredCount = perAxis - reserved.length;
        if (scoredCount < 1) throw new Error('Every axis requires a scored question.');
        const leftCount = Math.floor(scoredCount / 2) + (scoredCount % 2 && oddAxis % 2 === 0 ? 1 : 0);
        if (scoredCount % 2) oddAxis += 1;
        for (const [pole, required] of [['LEFT', leftCount], ['RIGHT', scoredCount - leftCount]])
        {
            const available = payload.questions.filter(question => question.axisId === axis.id && !question.proposalId && question.agreePole === pole);
            const chosen = shuffleProposals(available, random).slice(0, required);
            if (chosen.length !== required) throw new Error('Insufficient balanced questions.');
            selected.push(...chosen);
        }
        selected.push(...reserved);
    }
    return { ...payload, questions: shuffleProposals(selected, random) };
}



function mixRadicalProposals(questions, proposals, random = Math.random)
{
    const protectedIdentifiers = new Set(['radical_20', 'radical_34', 'radical_35', 'radical_36', 'radical_37', 'radical_38', 'radical_39', 'radical_40']);
    const selected = questions.slice();
    for (const proposal of proposalQuestions(chooseProposals(proposals, 4, random)))
    {
        const eligible = shuffleProposals(selected.filter(question =>
            question.axisId === proposal.axisId && !question.proposalId && !protectedIdentifiers.has(question.id)), random);
        const replaced = eligible.find(question => question.agreePole === proposal.agreePole) ?? eligible[0];
        if (!replaced) throw new Error('No safe proposal replacement slot.');
        selected[selected.findIndex(question => question.id === replaced.id)] = proposal;
    }
    return shuffleProposals(selected, random);
}



module.exports = { shuffleProposals, proposalVerdict, firstPage, proposalQuestions, selectQuizQuestions, mixRadicalProposals };
