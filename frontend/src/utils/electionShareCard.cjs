const presentation = require('./electionPresentation.cjs');
const site = require('../site.json');
const alignment = require('./electionAlignment.cjs');

const cardSize = 1080;
const cardHeight = 1800;



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



function drawResultCard(context, result, portraits = [], language = 'pt')
{
    const text = language === 'pt' ?
    {
        share: 'Compartilhar resultado', download: 'Baixar cartão', title: 'Seu resultado no 2 Turno',
        you: 'Você', compatibility: 'Compatibilidade', note: 'Estimativa descritiva. Não representa intenção de voto.',
        axes: 'SEUS 12 EIXOS', closest: 'MAIS PRÓXIMO', tied: 'EMPATE ENTRE OS CANDIDATOS',
        error: 'Não foi possível gerar o cartão. Tente novamente.', preparing: 'Gerando cartão…'
    } :
    {
        share: 'Share result', download: 'Download card', title: 'Your 2 Turno result',
        you: 'You', compatibility: 'Compatibility', note: 'Descriptive estimate. Does not represent voting intention.',
        axes: 'YOUR 12 AXES', closest: 'CLOSEST MATCH', tied: 'TIE BETWEEN THE CANDIDATES',
        error: 'Could not generate the card. Please try again.', preparing: 'Generating card…'
    };



    function wrappedLines(context, value, width)
    {
        const lines = [];
        let line = '';
        for (const word of value.split(' '))
        {
            const next = line ? `${line} ${word}` : word;
            if (line && context.measureText(next).width > width)
            {
                lines.push(line);
                line = word;
            }
            else line = next;
        }
        lines.push(line);
        return lines;
    }



    function drawWrappedText(context, value, horizontal, vertical, width, lineHeight)
    {
        const lines = wrappedLines(context, value, width);
        lines.forEach((line, index) => context.fillText(line, horizontal, vertical + index * lineHeight));
        return vertical + lines.length * lineHeight;
    }



    function drawPanel(context, horizontal, vertical, width, height)
    {
        context.beginPath();
        context.roundRect(horizontal, vertical, width, height, 30);
        context.fillStyle = '#00000030';
        context.fill();
        context.strokeStyle = '#ffffff24';
        context.lineWidth = 1;
        context.stroke();
    }



    function drawCardHeader(context, classification)
    {
        context.fillStyle = '#ffffff0c';
        context.beginPath();
        context.arc(1080, 0, 380, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#fffaf2';
        context.font = 'bold 44px Sora, sans-serif';
        context.fillText('2 TURNO', 64, 100);
        context.font = '600 22px Poppins, sans-serif';
        context.textAlign = 'right';
        context.fillText(text.title.toUpperCase(), 1016, 100);
        context.textAlign = 'left';
        context.font = '600 26px Poppins, sans-serif';
        context.fillText(classification.familyLabel.toUpperCase(), 64, 198);
        context.font = 'bold 54px Sora, sans-serif';
        drawWrappedText(context, classification.subtypeLabel, 64, 263, 952, 60);
    }



    function drawCandidateHighlights(context, result)
    {
        const candidate = result.candidates[0];
        const portrait = portraits[0];
        drawPanel(context, 64, 330, 412, 710);
        if (portrait)
        {
            context.save();
            context.beginPath();
            context.roundRect(142, 378, 256, 360, 24);
            context.clip();
            const scale = Math.max(256 / portrait.naturalWidth, 360 / portrait.naturalHeight);
            const width = portrait.naturalWidth * scale;
            const height = portrait.naturalHeight * scale;
            context.drawImage(portrait, 142 + (256 - width) / 2, 378 + (360 - height) / 2, width, height);
            const shade = context.createLinearGradient(0, 560, 0, 1040);
            shade.addColorStop(0, '#10162200');
            shade.addColorStop(1, '#101622');
            context.fillStyle = shade;
            context.fillRect(64, 330, 412, 710);
            context.restore();
        }
        context.fillStyle = '#fffaf2';
        context.font = 'bold 72px Sora, sans-serif';
        context.fillText(`${candidate.compatibility.toFixed(1)}%`, 92, 815);
        context.font = '600 18px Poppins, sans-serif';
        drawWrappedText(context, result.closestCandidateIds.length > 1 ? text.tied : text.closest, 92, 858, 350, 24);
        context.font = 'bold 32px Sora, sans-serif';
        const nameBottom = drawWrappedText(context, (site.candidates.find(profile => profile.id === candidate.id)?.name || candidate.name), 92, 918, 350, 40);
        context.font = '22px Poppins, sans-serif';
        context.fillText(`${candidate.party} · ${candidate.number}`, 92, nameBottom + 18);
        const other = result.candidates[1];
        drawPanel(context, 64, 1060, 412, 194);
        context.fillStyle = '#fffaf2';
        context.font = 'bold 26px Sora, sans-serif';
        drawWrappedText(context, (site.candidates.find(profile => profile.id === other.id)?.name || other.name), 92, 1105, 350, 32);
        context.font = '24px Poppins, sans-serif';
        context.fillText(`${other.compatibility.toFixed(1)}% · ${text.compatibility}`, 92, 1206);
    }



    function drawUserAxes(context, result)
    {
        drawPanel(context, 500, 330, 516, 924);
        context.fillStyle = '#fffaf2';
        context.font = '600 24px Poppins, sans-serif';
        context.fillText(text.axes, 530, 384);
        const colors = ['#ffb25f', '#eb8d9f', '#f3cb6d', '#8ab8df', '#bd9aed', '#ef92a9', '#c3bf82', '#79cbc0', '#8ab1ec', '#a5cb74', '#daac76', '#8dd0cf'];
        result.axes.forEach((entry, index) =>
        {
            const top = 416 + index * 68;
            const percentages = presentation.percentagePair(entry.userScore);
            context.fillStyle = '#fffaf2';
            context.font = '600 22px Poppins, sans-serif';
            context.fillText(entry.axis.label, 530, top);
            context.font = '18px Poppins, sans-serif';
            context.fillStyle = '#ffffffb8';
            const dominantPole = percentages.left === percentages.right
                ? (language === 'pt' ? 'Equilíbrio entre os dois polos' : 'Balance between both poles')
                : percentages.left > percentages.right ? entry.axis.leftPole : entry.axis.rightPole;
            let descriptionSize = 18;
            while (context.measureText(dominantPole).width > 456 && descriptionSize > 14)
            {
                descriptionSize -= 1;
                context.font = `${descriptionSize}px Poppins, sans-serif`;
            }
            context.fillText(dominantPole, 530, top + 42);
            context.fillStyle = '#ffffff20';
            context.fillRect(850, top + 15, 68, 7);
            context.fillStyle = colors[index];
            context.fillRect(850, top + 15, 68 * Math.max(percentages.left, percentages.right) / 100, 7);
            context.font = 'bold 20px Sora, sans-serif';
            context.textAlign = 'right';
            context.fillText(`${Math.max(percentages.left, percentages.right).toFixed(1)}%`, 988, top + 24);
            context.textAlign = 'left';
        });
    }



    function drawAlignmentSummary(context, summary)
    {
        drawPanel(context, 64, 1280, 952, 400);
        context.fillStyle = '#fffaf2';
        context.font = 'bold 30px Sora, sans-serif';
        context.fillText(language === 'pt' ? 'ONDE VOCÊ SE APROXIMA E SE DISTANCIA' : 'WHERE YOU ALIGN AND DIFFER', 92, 1334);
        let fontSize = 28;
        let lineCount;
        do
        {
            context.font = `${fontSize}px Poppins, sans-serif`;
            lineCount = summary.alignment.reduce((total, candidate) => total + wrappedLines(context, candidate.statement, 896).length, 0);
            if (lineCount * 34 + 24 <= 296 || fontSize === 22) break;
            fontSize -= 2;
        } while (fontSize >= 22);
        let vertical = 1382;
        for (const candidate of summary.alignment)
        {
            context.font = `${fontSize}px Poppins, sans-serif`;
            context.fillStyle = '#fffaf2';
            vertical = drawWrappedText(context, candidate.statement, 92, vertical, 896, 34) + 24;
        }
    }



    function drawCardFooter(context)
    {
        context.fillStyle = '#ffffffb8';
        context.fillRect(64, 1700, 952, 1);
        context.font = '16px Poppins, sans-serif';
        context.fillText(text.note, 64, 1738);

        context.fillStyle = '#fffaf2';
        context.font = '600 22px Poppins, sans-serif';
        context.fillText('2TURNO', 64, 1774);
    }
    const summary = shareSummary(result, language);
    const background = context.createLinearGradient(0, 0, cardSize, cardHeight);
    background.addColorStop(0, summary.classification.color);
    background.addColorStop(1, '#101622');
    context.fillStyle = background;
    context.fillRect(0, 0, cardSize, cardHeight);
    drawCardHeader(context, summary.classification);
    drawCandidateHighlights(context, result);
    drawUserAxes(context, result);
    drawAlignmentSummary(context, summary);
    drawCardFooter(context);
    return summary;
}

module.exports = { cardSize, cardHeight, shareSummary, drawResultCard };

