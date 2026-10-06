const questions = require('../data/extremistQuestions.json');
const presentation = require('./electionPresentation.cjs');
const historicalProfiles = require('../data/historicalExtremists.json');

const options =
{
    pt: ['Concordo totalmente', 'Concordo', 'Neutro', 'Discordo', 'Discordo totalmente'],
    en: ['Strongly agree', 'Agree', 'Neutral', 'Disagree', 'Strongly disagree']
};
const values = { STRONGLY_AGREE: 100, AGREE: 75, NEUTRAL: 50, DISAGREE: 25, STRONGLY_DISAGREE: 0 };



function createRadicalQuiz(axes, language = 'pt')
{
    const locale = language === 'en' ? 'en' : 'pt';
    return {
        title: locale === 'pt' ? 'Modo extremista' : 'Extremist mode',
        description: locale === 'pt' ? '40 afirmações sobre políticas radicais.' : '40 statements about radical policies.',
        variant: 'short',
        questionCount: questions.length,
        questionsPerAxis: null,
        axes,
        questions: questions.map(question => ({ id: question.id, axisId: question.axisId, agreePole: question.agreePole, weight: 1, text: question.text[locale] })),
        answerOptions: Object.entries(values).map(([identifier, score], index) => ({ id: identifier, label: options[locale][index], scoreTowardAgreement: score }))
    };
}



function scoreRadicalAnswers(answers)
{
    if (Object.keys(answers).length !== questions.length || questions.some(question => !Object.hasOwn(values, answers[question.id])))
        throw new Error('Complete all radical questions with valid answers.');
    const totals = {};
    for (const question of questions)
    {
        const score = values[answers[question.id]];
        const total = totals[question.axisId] || { sum: 0, count: 0 };
        total.sum += question.agreePole === 'LEFT' ? score : 100 - score;
        total.count += 1;
        totals[question.axisId] = total;
    }
    return Object.fromEntries(Object.entries(totals).map(([identifier, total]) => [identifier, Math.round(total.sum / total.count * 10) / 10]));
}



function policySignals(scores, answers = {})
{
    const answer = identifier => Object.hasOwn(values, answers[identifier]) ? values[answers[identifier]] : 50;
    return {
        authoritarianism: (answer('radical_34') + answer('radical_36') + 100 - answer('radical_35') + answer('radical_39')) / 4,
        stateEconomy: (scores.coordenacao + scores.provisao_publica) / 2,
        nationalism: (answer('radical_38') + 100 - scores.diplomacia_eleitoral) / 2,
        exclusion: answer('radical_37'),
        collectivism: answer('radical_40')
    };
}



function classifyRadicalProfile(scores, answers = {}, language = 'pt')
{
    const base = presentation.classificationLabels(scores, language);
    if (base.index === null) return base;
    const signals = policySignals(scores, answers);
    const economy = presentation.axisIdentifiers.slice(0, 5).reduce((total, identifier) => total + scores[identifier], 0) / 5;
    const authoritarian = signals.authoritarianism >= 65;
    const nationalSocialism = authoritarian && signals.nationalism >= 65 &&
        signals.exclusion >= 75 && values[answers.radical_20] <= 25;
    let family = economy >= 65 ? 'far-left' : economy <= 35 ? 'far-right' : base.family;
    let subtype = family === 'far-left' ? (authoritarian ? 'authoritarian-left' : 'radical-left')
        : family === 'far-right' ? (authoritarian ? 'authoritarian-right' : 'radical-right') : base.subtype;
    if (nationalSocialism)
    {
        family = 'far-right';
        subtype = 'national-socialism';
    }
    else if (authoritarian && signals.nationalism >= 65 && scores.direitos_sociais <= 35)
    {
        family = 'far-right';
        subtype = 'fascist-traits';
    }
    const familyNames = { 'far-left': ['Extrema esquerda', 'Far left'], 'far-right': ['Extrema direita', 'Far right'] };
    const subtypeNames = {
        'radical-left': ['Esquerda radical', 'Radical left'],
        'authoritarian-left': ['Esquerda autoritária', 'Authoritarian left'],
        'radical-right': ['Direita radical', 'Radical right'],
        'authoritarian-right': ['Direita autoritária', 'Authoritarian right'],
        'fascist-traits': ['Traços de fascismo', 'Fascist traits'],
        'national-socialism': ['Traços de nacional-socialismo (nazismo)', 'National-socialism (Nazism) traits']
    };
    const column = language === 'en' ? 1 : 0;
    return {
        ...base, family, subtype,
        familyLabel: familyNames[family]?.[column] || base.familyLabel,
        subtypeLabel: subtypeNames[subtype]?.[column] || base.subtypeLabel,
        color: family === 'far-left' ? '#a51d2d' : family === 'far-right' ? '#304e91' : base.color,
        background: family === 'far-left' ? '#fbeaec' : family === 'far-right' ? '#eaf0fc' : base.background
    };
}



function historicalComparisons(scores, answers)
{
    const user = policySignals(scores, answers);
    return historicalProfiles.map(profile =>
    {
        const dimensions = Object.entries(profile.scores).filter(([, score]) => score !== null);
        const distance = dimensions.reduce((total, [identifier, score]) => total + Math.abs(user[identifier] - score), 0) / dimensions.length;
        return { ...profile, similarity: Math.round(100 - distance), coverage: dimensions.length, user };
    });
}

module.exports = { createRadicalQuiz, scoreRadicalAnswers, policySignals, classifyRadicalProfile, historicalComparisons };
