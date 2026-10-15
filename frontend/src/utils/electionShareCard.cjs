const presentation = require('./electionPresentation.cjs');
const site = require('../site.json');
const alignment = require('./electionAlignment.cjs');

const cardSize = 1080;
const cardHeight = 1800;
const cardPadding = 56;
const colors =
{
    background: '#07101E',
    surface: '#0D1A2E',
    border: '#2A3D57',
    text: '#EEF4FF',
    muted: '#B6C5DD',
    brand: '#60A5FA',
    left: '#FDA4AF',
    right: '#93C5FD',
    centre: '#64748B'
};



function wrappedLines(context, value, maximumWidth)
{
    const lines = [];
    let line = '';
    for (const word of value.split(' '))
    {
        const nextLine = line ? line + ' ' + word : word;
        if (line && context.measureText(nextLine).width > maximumWidth)
        {
            lines.push(line);
            line = word;
        }
        else line = nextLine;
    }
    if (line) lines.push(line);
    return lines;
}



function fittedLines(context, value, maximumWidth, maximumLines, initialSize, minimumSize, weight = '500', family = 'Poppins')
{
    let lines = [];
    for (let fontSize = initialSize; fontSize >= minimumSize; fontSize -= 1)
    {
        context.font = weight + ' ' + fontSize + 'px ' + family + ', sans-serif';
        lines = wrappedLines(context, value, maximumWidth);
        if (lines.length <= maximumLines) return lines;
    }
    return lines;
}



function drawText(context, value, horizontal, vertical, font, color = colors.text)
{
    context.font = font;
    context.fillStyle = color;
    context.fillText(value, horizontal, vertical);
}



function drawPanel(context, horizontal, vertical, width, height, background = colors.surface, border = colors.border)
{
    context.beginPath();
    context.roundRect(horizontal, vertical, width, height, 24);
    context.fillStyle = background;
    context.fill();
    context.strokeStyle = border;
    context.lineWidth = 1;
    context.stroke();
}



function drawCircle(context, horizontal, vertical, radius, color)
{
    context.beginPath();
    context.arc(horizontal, vertical, radius, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
}



function shareSummary(result, language = 'pt')
{
    return {
        classification: presentation.classificationLabels(Object.fromEntries(result.axes.map(entry => [entry.axis.id, entry.userScore])), language),
        candidates: result.candidates.map(candidate => ({ ...candidate, name: site.candidates.find(profile => profile.id === candidate.id)?.name || candidate.name })),
        tied: result.closestCandidateIds.length > 1,
        alignment: result.candidates.map(candidate =>
        {
            const areas = alignment.alignmentAreas(
                Object.fromEntries(result.axes.map(entry => [entry.axis.id, entry.userScore])),
                Object.fromEntries(result.axes.map(entry => [entry.axis.id, entry.candidateScores[candidate.id]])),
                result.axes.map(entry => entry.axis));
            const name = site.candidates.find(profile => profile.id === candidate.id)?.name || candidate.name;
            const list = new Intl.ListFormat(language === 'pt' ? 'pt-BR' : 'en', { style: 'long', type: 'conjunction' });
            const agreement = areas.aligned.length
                ? (language === 'pt' ? 'mais alinhado em ' : 'closer alignment in ') + list.format(areas.aligned)
                : (language === 'pt' ? 'sem áreas de forte proximidade' : 'no areas of strong similarity');
            const difference = areas.different.length
                ? (language === 'pt' ? 'menos alinhado em ' : 'less aligned in ') + list.format(areas.different)
                : (language === 'pt' ? 'sem divergências marcantes' : 'no marked differences');
            return { name, ...areas, statement: name + ': ' + agreement + '; ' + difference + '.' };
        }),
        text: { result: language === 'pt' ? 'Meu resultado' : 'My result', compatibility: language === 'pt' ? 'COMPATIBILIDADE' : 'COMPATIBILITY' }
    };
}



function drawClassification(context, classification)
{
    drawPanel(context, cardPadding, 118, cardSize - cardPadding * 2, 180, classification.background, classification.color);
    drawText(context, classification.familyLabel.toUpperCase(), 80, 162, '600 23px Poppins, sans-serif', classification.color);
    const lines = fittedLines(context, classification.subtypeLabel, 916, 2, 43, 30, '700', 'Sora');
    context.fillStyle = classification.color;
    lines.forEach((line, index) => context.fillText(line, 80, 218 + index * 49));
}



function drawPortrait(context, portrait, candidate, horizontal, vertical)
{
    drawCircle(context, horizontal + 44, vertical + 44, 44, colors.border);
    if (!portrait)
    {
        const initials = candidate.name.split(' ').map(word => word[0]).slice(0, 2).join('');
        context.textAlign = 'center';
        drawText(context, initials, horizontal + 44, vertical + 55, '700 28px Sora, sans-serif');
        context.textAlign = 'left';
        return;
    }
    context.save();
    context.beginPath();
    context.arc(horizontal + 44, vertical + 44, 44, 0, Math.PI * 2);
    context.clip();
    const scale = Math.max(88 / portrait.naturalWidth, 88 / portrait.naturalHeight);
    const width = portrait.naturalWidth * scale;
    const height = portrait.naturalHeight * scale;
    context.drawImage(portrait, horizontal + (88 - width) / 2, vertical + (88 - height) * .15, width, height);
    context.restore();
}



function drawCandidate(context, candidate, portrait, horizontal, closest, tied, language)
{
    const width = 472;
    drawPanel(context, horizontal, 326, width, 250, colors.surface, closest ? colors.brand : colors.border);
    drawPortrait(context, portrait, candidate, horizontal + 24, 350);
    const nameLines = fittedLines(context, candidate.name, 306, 2, 26, 22, '700', 'Sora');
    context.fillStyle = colors.text;
    nameLines.forEach((line, index) => context.fillText(line, horizontal + 132, 381 + index * 32));
    drawText(context, candidate.party + ' · ' + candidate.number, horizontal + 132, 438, '500 20px Poppins, sans-serif', colors.muted);
    drawText(context, candidate.compatibility.toFixed(1) + '%', horizontal + 24, 511, '700 59px Sora, sans-serif');
    drawText(context, language === 'pt' ? 'COMPATIBILIDADE' : 'COMPATIBILITY', horizontal + 24, 550, '600 18px Poppins, sans-serif', colors.muted);
    if (closest)
    {
        context.textAlign = 'right';
        drawText(context, tied ? (language === 'pt' ? 'EMPATE' : 'TIE') : (language === 'pt' ? 'MAIS PRÓXIMO' : 'CLOSEST MATCH'),
            horizontal + width - 24, 550, '600 18px Poppins, sans-serif', colors.brand);
        context.textAlign = 'left';
    }
}



function scorePosition(score, horizontal, width)
{
    return horizontal + (100 - score) / 100 * width;
}



function drawAxis(context, entry, index, candidates, language)
{
    const horizontal = cardPadding + index % 2 * 496;
    const vertical = 678 + Math.floor(index / 2) * 110;
    const width = 472;
    const score = entry.userScore;
    const percentage = Math.max(score, 100 - score).toFixed(0) + '%';
    const titleLines = fittedLines(context, entry.axis.label, width - 86, 2, 24, 20, '600');
    context.fillStyle = colors.text;
    titleLines.forEach((line, lineIndex) => context.fillText(line, horizontal, vertical + lineIndex * 27));
    context.textAlign = 'right';
    drawText(context, percentage, horizontal + width, vertical, '600 24px Poppins, sans-serif');
    context.textAlign = 'left';
    const pole = score === 50 ? (language === 'pt' ? 'Equilíbrio' : 'Balance') : score > 50 ? entry.axis.leftPole : entry.axis.rightPole;
    const poleLines = fittedLines(context, pole, width, 1, 19, 14);
    context.fillStyle = colors.muted;
    poleLines.forEach(line => context.fillText(line, horizontal, vertical + 50));
    const trackVertical = vertical + 71;
    const gradient = context.createLinearGradient(horizontal, 0, horizontal + width, 0);
    gradient.addColorStop(0, colors.left);
    gradient.addColorStop(.5, colors.centre);
    gradient.addColorStop(1, colors.right);
    context.fillStyle = gradient;
    context.fillRect(horizontal, trackVertical, width, 6);
    context.fillStyle = colors.muted;
    context.fillRect(horizontal + width / 2 - 1, trackVertical - 4, 2, 14);
    candidates.forEach((candidate, candidateIndex) =>
    {
        const candidateScore = entry.candidateScores[candidate.id];
        if (!Number.isFinite(candidateScore)) return;
        drawCircle(context, scorePosition(candidateScore, horizontal, width), trackVertical + 3, 5,
            candidateIndex === 0 ? colors.left : colors.right);
    });
    const markerHorizontal = scorePosition(score, horizontal, width);
    drawCircle(context, markerHorizontal, trackVertical + 3, 11, colors.background);
    drawCircle(context, markerHorizontal, trackVertical + 3, 7, colors.text);
}



function drawAlignment(context, candidate, horizontal, language)
{
    drawPanel(context, horizontal, 1414, 472, 288);
    drawText(context, candidate.name, horizontal + 24, 1454, '700 24px Sora, sans-serif');
    const groups =
    [
        { title: language === 'pt' ? 'MAIS ALINHADO' : 'CLOSER ALIGNMENT', areas: candidate.aligned, empty: language === 'pt' ? 'Sem forte proximidade.' : 'No strong similarity.' },
        { title: language === 'pt' ? 'MENOS ALINHADO' : 'LESS ALIGNED', areas: candidate.different, empty: language === 'pt' ? 'Sem divergências marcantes.' : 'No marked differences.' }
    ];
    groups.forEach((group, index) =>
    {
        const vertical = 1492 + index * 99;
        drawText(context, group.title, horizontal + 24, vertical, '600 17px Poppins, sans-serif', colors.muted);
        const value = group.areas.length ? group.areas.join(' · ') : group.empty;
        const lines = fittedLines(context, value, 424, 3, 24, 20);
        context.fillStyle = colors.text;
        lines.forEach((line, lineIndex) => context.fillText(line, horizontal + 24, vertical + 30 + lineIndex * 25));
    });
}



function drawResultCard(context, result, portraits = [], language = 'pt')
{
    const summary = shareSummary(result, language);
    const portuguese = language === 'pt';
    context.save();
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = colors.background;
    context.fillRect(0, 0, cardSize, cardHeight);
    drawText(context, '2 TURNO', cardPadding, 77, '700 36px Sora, sans-serif');
    context.textAlign = 'right';
    drawText(context, portuguese ? 'MEU RESULTADO' : 'MY RESULT', cardSize - cardPadding, 77, '600 22px Poppins, sans-serif', colors.muted);
    context.textAlign = 'left';
    drawClassification(context, summary.classification);
    const candidates = site.candidates.map(profile => summary.candidates.find(candidate => candidate.id === profile.id)).filter(Boolean);
    candidates.forEach((candidate, index) =>
    {
        const portraitIndex = result.candidates.findIndex(profile => profile.id === candidate.id);
        drawCandidate(context, candidate, portraits[portraitIndex], cardPadding + index * 496,
            result.closestCandidateIds.includes(candidate.id), summary.tied, language);
    });
    drawText(context, portuguese ? 'SEUS 12 EIXOS' : 'YOUR 12 AXES', cardPadding, 626, '600 25px Poppins, sans-serif');
    const legend =
    [
        { name: portuguese ? 'VOCÊ' : 'YOU', color: colors.text, horizontal: 574 },
        { name: 'Lula', color: colors.left, horizontal: 714 },
        { name: 'Flávio', color: colors.right, horizontal: 844 }
    ];
    legend.forEach(item =>
    {
        drawCircle(context, item.horizontal, 619, 6, item.color);
        drawText(context, item.name, item.horizontal + 14, 626, '500 20px Poppins, sans-serif', colors.muted);
    });
    result.axes.forEach((entry, index) => drawAxis(context, entry, index, candidates, language));
    drawText(context, portuguese ? 'ONDE VOCÊ SE APROXIMA E SE DISTANCIA' : 'WHERE YOUR VIEWS ALIGN AND DIFFER',
        cardPadding, 1384, '600 25px Poppins, sans-serif');
    candidates.forEach((candidate, index) =>
    {
        const areas = summary.alignment.find(profile => profile.name === candidate.name);
        if (areas) drawAlignment(context, areas, cardPadding + index * 496, language);
    });
    drawText(context, portuguese ? 'Estimativa descritiva. Não representa intenção de voto.' : 'Descriptive estimate. Does not represent voting intention.',
        cardPadding, 1740, '400 18px Poppins, sans-serif', colors.muted);
    drawText(context, new URL(site.website).host.toUpperCase(), cardPadding, 1775, '600 21px Poppins, sans-serif');
    context.restore();
    return summary;
}



module.exports = { cardSize, cardHeight, shareSummary, drawResultCard };
