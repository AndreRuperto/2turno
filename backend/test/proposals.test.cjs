const assert = require('node:assert/strict');
const { test } = require('node:test');
const { selectQuizQuestions } = require('../../frontend/src/utils/electionProposals.cjs');



test('proposal slots preserve quiz totals and remain separate from compatibility', async () =>
{
    const { loadElection } = await import('../src/election.js');
    const election = loadElection();
    for (const language of ['pt', 'en'])
    {
        for (const [variant, total, quota] of [['short', 36, 2], ['extended', 60, 8], ['extreme', 72, 8]])
        {
            const response = election.getQuiz(variant, language);
            const positions = new Set();
            for (let attempt = 0; attempt < 30; attempt += 1)
            {
                const quiz = selectQuizQuestions(response.quiz, response.proposals);
                assert.equal(quiz.questions.length, total);
                assert.equal(quiz.questionCount, total);
                assert.equal(new Set(quiz.questions.map(question => question.id)).size, total);
                const proposals = quiz.questions.filter(question => question.proposalId);
                assert.equal(proposals.length, quota);
                for (const identifier of ['lula-da-silva', 'flavio-bolsonaro'])
                    assert.equal(proposals.filter(question => response.proposals.find(proposal => proposal.id === question.id).proponentId === identifier).length, quota / 2);
                positions.add(quiz.questions.map((question, index) => question.proposalId ? index : null).filter(index => index !== null).join(','));
                const answers = quiz.questions.map(question => ({ questionId: question.id, answer: question.proposalId ? 'AGREE' : 'NEUTRAL' }));
                const first = election.score({ modelId: response.modelId, variant, answers }, language);
                const second = election.score({
                    modelId: response.modelId, variant,
                    answers: answers.map(answer => ({ ...answer, answer: proposals.some(proposal => proposal.id === answer.questionId) ? 'STRONGLY_DISAGREE' : answer.answer }))
                }, language);
                assert.deepEqual(first.axes, second.axes);
                assert.deepEqual(first.candidates, second.candidates);
                assert.ok(first.axes.every(axis => axis.userScore === 50));
                assert.equal(first.proposalAnswers.length, quota);
                assert.ok(second.proposalAnswers.every(answer => answer.answer === 'STRONGLY_DISAGREE'));
            }
            assert.ok(positions.size > 1, 'Proposal positions must vary across attempts');
        }
    }
});

