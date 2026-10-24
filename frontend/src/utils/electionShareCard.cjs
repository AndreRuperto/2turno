const presentation = require('./electionPresentation.cjs');
const site = require('../site.json');
const alignment = require('./electionAlignment.cjs');
const translations = require('../i18n/electionShare.json');
const profiles = require('../data/electionProfiles.generated.json');

const cardSize = 1080;
const cardHeight = 1800;
const pixelRatio = 2;
const padding = 40;
const columnWidth = 488;
const themes =
{
    dark: { background: '#090D11', surface: '#14191F', border: '#303842', text: '#F5F6F8', muted: '#B5BECA', neutral: '#828E9F', red: '#FF6475', blue: '#53B4FF', redSurface: '#211419', blueSurface: '#101F2B', redBorder: '#733340', blueBorder: '#295470', track: '#313943' },
    light: { background: '#FAFAF8', surface: '#F0F1F0', border: '#D7DCDF', text: '#171D28', muted: '#505B6C', neutral: '#7B8490', red: '#B92235', blue: '#1264AA', redSurface: '#FCEEEF', blueSurface: '#EAF3FB', redBorder: '#EBC6CD', blueBorder: '#BDD5EB', track: '#D8DEE4' }
};



function wrappedLines(context, value, maximumWidth)
{
    const lines = [];
    let line = '';
    for (const word of value.split(/\s+/))
    {
        const next = line ? line + ' ' + word : word;
        if (line && context.measureText(next).width > maximumWidth)
        {
            lines.push(line);
            line = word;
        }
        else line = next;
    }
    if (line) lines.push(line);
    return lines;
}



function fittedLines(context, value, width, maximumLines, initialSize, weight = 500, family = 'Poppins')
{
    for (let size = initialSize; size >= 8; size -= 1)
    {
        context.font = weight + ' ' + size + 'px ' + family + ', sans-serif';
        const lines = wrappedLines(context, value, width);
        if (lines.length <= maximumLines && lines.every(line => context.measureText(line).width <= width)) return lines;
    }
    return wrappedLines(context, value, width);
}



function drawText(context, value, horizontal, vertical, size, color, weight = 500, family = 'Poppins')
{
    context.font = weight + ' ' + size + 'px ' + family + ', sans-serif';
    context.fillStyle = color;
    context.fillText(value, horizontal, vertical);
}



function drawFitted(context, value, horizontal, vertical, width, maximumLines, size, lineHeight, color, weight = 500, family = 'Poppins')
{
    const lines = fittedLines(context, value, width, maximumLines, size, weight, family);
    context.fillStyle = color;
    lines.forEach((line, index) => context.fillText(line, horizontal, vertical + index * lineHeight));
}



function drawPanel(context, horizontal, vertical, width, height, background, border, radius = 20)
{
    context.beginPath();
    context.roundRect(horizontal, vertical, width, height, radius);
    context.fillStyle = background;
    context.fill();
    if (border)
    {
        context.strokeStyle = border;
        context.lineWidth = 1;
        context.stroke();
    }
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
    const copy = translations[language];
    const axes = result.axes.map(entry => ({ ...entry, axis: profiles.axes[language].find(axis => axis.id === entry.axis.id) || entry.axis }));
    const scores = Object.fromEntries(axes.map(entry => [entry.axis.id, entry.userScore]));
    const classification = presentation.classificationLabels(scores, language);
    const candidates = site.candidates.map(profile => result.candidates.find(candidate => candidate.id === profile.id))
        .filter(Boolean).map(candidate => ({ ...candidate, name: site.candidates.find(profile => profile.id === candidate.id).name }));
    return {
        classification, candidates, axes,
        description: copy.descriptions[classification.subtype],
        tied: result.closestCandidateIds.length > 1,
        alignment: candidates.map(candidate =>
        {
            const areas = alignment.alignmentAreas(scores,
                Object.fromEntries(axes.map(entry => [entry.axis.id, entry.candidateScores[candidate.id]])), axes.map(entry => entry.axis));
            const list = new Intl.ListFormat(language, { style: 'long', type: 'conjunction' });
            const agreement = areas.aligned.length ? copy.closerSentence + list.format(areas.aligned) : copy.noClose;
            const difference = areas.different.length ? copy.differentSentence + list.format(areas.different) : copy.noDifference;
            return { id: candidate.id, name: candidate.name, ...areas, statement: candidate.name + ': ' + agreement + '; ' + difference };
        }),
        text: copy
    };
}



function candidatePalette(candidate, colors)
{
    return candidate.id === 'lula-da-silva'
        ? { accent: colors.red, surface: colors.redSurface, border: colors.redBorder }
        : { accent: colors.blue, surface: colors.blueSurface, border: colors.blueBorder };
}



function drawPortrait(context, portrait, candidate, horizontal, vertical, colors)
{
    const diameter = 116;
    drawCircle(context, horizontal + diameter / 2, vertical + diameter / 2, diameter / 2, colors.border);
    if (!portrait)
    {
        const initials = candidate.name.split(' ').map(word => word[0]).slice(0, 2).join('');
        context.textAlign = 'center';
        drawText(context, initials, horizontal + diameter / 2, vertical + 71, 34, colors.text, 700, 'Sora');
        context.textAlign = 'left';
        return;
    }
    context.save();
    context.beginPath();
    context.arc(horizontal + diameter / 2, vertical + diameter / 2, diameter / 2, 0, Math.PI * 2);
    context.clip();
    const scale = Math.max(diameter / portrait.naturalWidth, diameter / portrait.naturalHeight);
    const width = portrait.naturalWidth * scale;
    const height = portrait.naturalHeight * scale;
    context.drawImage(portrait, horizontal + (diameter - width) / 2, vertical + (diameter - height) * .15, width, height);
    context.restore();
}



function drawProfile(context, summary, profileColors)
{
    const palette = profileColors || {
        background: summary.classification.background,
        border: summary.classification.color,
        accent: summary.classification.color,
        title: summary.classification.color,
        muted: summary.classification.color
    };
    drawPanel(context, padding, 132, 1000, 164, palette.background, palette.border);
    drawPanel(context, 60, 154, 5, 118, palette.accent, null, 2);
    drawText(context, summary.text.profile + ' · ' + summary.classification.familyLabel.toUpperCase(), 82, 174, 19, palette.title, 600);
    drawFitted(context, summary.classification.subtypeLabel, 82, 225, 916, 1, 42, 48, palette.title, 700, 'Sora');
    drawFitted(context, summary.description, 82, 260, 916, 1, 22, 28, palette.muted);
}



function drawCandidate(context, candidate, portrait, horizontal, closest, summary, colors, language)
{
    const palette = candidatePalette(candidate, colors);
    drawPanel(context, horizontal, 316, columnWidth, 260, palette.surface, closest ? palette.accent : palette.border);
    if (closest) drawText(context, summary.tied ? summary.text.tie : summary.text.closest, horizontal + 24, 345, 15, palette.accent, 600);
    drawPortrait(context, portrait, candidate, horizontal + 24, 364, colors);
    drawFitted(context, candidate.name, horizontal + 160, 389, 304, 2, 27, 30, colors.text, 700, 'Sora');
    drawText(context, candidate.party + ' · ' + candidate.number, horizontal + 160, 447, 20, colors.muted);
    const percentage = new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(candidate.compatibility) + '%';
    drawText(context, percentage, horizontal + 160, 504, 50, palette.accent, 700, 'Sora');
    drawText(context, summary.text.compatibility, horizontal + 24, 531, 16, colors.muted, 600);
    drawPanel(context, horizontal + 24, 546, 440, 12, colors.track, null, 6);
    if (candidate.compatibility > 0) drawPanel(context, horizontal + 24, 546, 440 * candidate.compatibility / 100, 12, palette.accent, null, 6);
}



function scorePosition(score, horizontal, width)
{
    return horizontal + presentation.percentagePair(score).position / 100 * width;
}



function drawAxis(context, entry, index, candidates, colors, language)
{
    const horizontal = padding + Math.floor(index / 6) * 512;
    const vertical = 696 + index % 6 * 98;
    drawPanel(context, horizontal, vertical, columnWidth, 90, colors.surface, colors.border, 14);
    drawText(context, String(index + 1).padStart(2, '0'), horizontal + 16, vertical + 31, 17, colors.muted, 500, 'Sora');
    drawFitted(context, entry.axis.label, horizontal + 55, vertical + 28, 338, 2, 21, 24, colors.text, 600);
    context.textAlign = 'right';
    const percentage = new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(entry.userScore) + '%';
    drawText(context, percentage, horizontal + 470, vertical + 28, 21, colors.text, 700, 'Sora');
    context.textAlign = 'left';
    const trackHorizontal = horizontal + 55;
    const trackWidth = 406;
    const trackVertical = vertical + 71;
    const gradient = context.createLinearGradient(trackHorizontal, 0, trackHorizontal + trackWidth, 0);
    gradient.addColorStop(0, colors.red);
    gradient.addColorStop(.5, colors.neutral);
    gradient.addColorStop(1, colors.blue);
    drawPanel(context, trackHorizontal, trackVertical, trackWidth, 7, gradient, null, 3);
    candidates.forEach(candidate =>
    {
        const score = entry.candidateScores[candidate.id];
        if (!Number.isFinite(score)) return;
        const position = scorePosition(score, trackHorizontal, trackWidth);
        drawPanel(context, position - 2, trackVertical - 5, 4, 17, candidatePalette(candidate, colors).accent, null, 2);
    });
    const position = scorePosition(entry.userScore, trackHorizontal, trackWidth);
    drawCircle(context, position, trackVertical + 3.5, 10, colors.border);
    drawCircle(context, position, trackVertical + 3.5, 7, colors.text);
}



function drawAlignment(context, candidate, horizontal, summary, colors)
{
    const palette = candidatePalette(candidate, colors);
    drawPanel(context, horizontal, 1344, columnWidth, 316, palette.surface, palette.border);
    drawText(context, candidate.name, horizontal + 24, 1387, 27, colors.text, 700, 'Sora');
    const groups = [
        { title: summary.text.closer, areas: candidate.aligned, empty: summary.text.noClose },
        { title: summary.text.different, areas: candidate.different, empty: summary.text.noDifference }
    ];
    groups.forEach((group, index) =>
    {
        const vertical = 1425 + index * 113;
        drawText(context, group.title, horizontal + 24, vertical, 16, colors.muted, 600);
        const values = group.areas.length ? group.areas : [group.empty];
        values.forEach((value, valueIndex) =>
        {
            drawText(context, index ? '−' : '+', horizontal + 24, vertical + 30 + valueIndex * 36, 25, palette.accent, 600);
            drawFitted(context, value, horizontal + 51, vertical + 30 + valueIndex * 36, 409, 1, 22, 26, colors.text);
        });
    });
}



function drawResultCard(context, result, portraits = [], language = 'pt', theme = 'dark', profileColors)
{
    const summary = shareSummary(result, language);
    const copy = summary.text;
    const colors = themes[theme];
    context.save();
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillStyle = colors.background;
    context.fillRect(0, 0, cardSize, cardHeight);
    drawText(context, copy.brand, padding, 75, 48, colors.text, 800, 'Sora');
    drawText(context, copy.election.replace('{year}', site.runoffDate.slice(0, 4)), padding + 2, 106, 18, colors.muted);
    context.textAlign = 'right';
    drawText(context, copy.result, 1040, 71, 17, colors.muted, 500);
    context.textAlign = 'left';
    drawProfile(context, summary, profileColors);
    summary.candidates.forEach((candidate, index) =>
    {
        const portraitIndex = result.candidates.findIndex(entry => entry.id === candidate.id);
        drawCandidate(context, candidate, portraits[portraitIndex], padding + index * 512,
            result.closestCandidateIds.includes(candidate.id), summary, colors, language);
    });
    drawText(context, copy.axes, padding, 624, 27, colors.text, 700, 'Sora');
    const legend = [{ name: copy.you, color: colors.text }, ...summary.candidates.map(candidate => ({ name: candidate.name, color: candidatePalette(candidate, colors).accent }))];
    let legendHorizontal = padding;
    legend.forEach(item =>
    {
        drawCircle(context, legendHorizontal + 6, 652, 5, item.color);
        drawText(context, item.name, legendHorizontal + 20, 658, 17, colors.muted);
        legendHorizontal += context.measureText(item.name).width + 58;
    });
    drawText(context, copy.axisNote, padding, 683, 16, colors.muted);
    summary.axes.forEach((entry, index) => drawAxis(context, entry, index, summary.candidates, colors, language));
    drawText(context, copy.alignment, padding, 1321, 25, colors.text, 700, 'Sora');
    summary.alignment.forEach((candidate, index) => drawAlignment(context, candidate, padding + index * 512, summary, colors));
    context.fillStyle = colors.border;
    context.fillRect(padding, 1695, 1000, 1);
    drawText(context, copy.disclaimer, padding, 1733, 18, colors.muted, 400);
    drawText(context, new URL(site.website).host.toUpperCase(), padding, 1770, 19, colors.text, 600);
    context.restore();
    return summary;
}



module.exports = { cardSize, cardHeight, pixelRatio, themes, shareSummary, drawResultCard };
