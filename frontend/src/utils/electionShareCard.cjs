const presentation = require('./electionPresentation.cjs');
const site = require('../site.json');
const alignment = require('./electionAlignment.cjs');

const cardSize = 1080;
const cardHeight = 1800;

const LULA_ID = 'lula-da-silva';
const FLAVIO_ID = 'flavio-bolsonaro';
const PT_RED = '#c0392b';
const PL_BLUE = '#2b5fa8';
const BG = '#0d0f14';
const INK = '#fffaf2';
const INK_DIM = 'rgba(255,255,242,0.58)';
const INK_FAINT = 'rgba(255,255,242,0.14)';
const PAD = 64;



function wrappedLines(context, value, maxWidth)
{
    const lines = [];
    let line = '';
    for (const word of value.split(' '))
    {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > maxWidth) { lines.push(line); line = word; }
        else line = next;
    }
    if (line) lines.push(line);
    return lines;
}



function truncate(context, text, maxWidth)
{
    if (context.measureText(text).width <= maxWidth) return text;
    let s = text;
    while (s.length > 0 && context.measureText(s + '\u2026').width > maxWidth) s = s.slice(0, -1);
    return s + '\u2026';
}



function fillCircle(context, x, y, radius)
{
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
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



function drawResultCard(context, result, portraits = [], language = 'pt')
{
    const isPt = language !== 'en';
    const uiText =
    {
        brand: '2 TURNO',
        myResult: isPt ? 'MEU RESULTADO' : 'MY RESULT',
        axes: isPt ? 'SEUS 12 EIXOS' : 'YOUR 12 AXES',
        you: isPt ? 'VOCÊ' : 'YOU',
        compat: isPt ? 'COMPATIBILIDADE' : 'COMPATIBILITY',
        balance: isPt ? 'Equilíbrio' : 'Balance',
        note: isPt ? 'Estimativa descritiva. Não representa intenção de voto.' : 'Descriptive estimate. Does not represent voting intention.',
        siteUrl: '2TURNO.UP.RAILWAY.APP'
    };

    const summary = shareSummary(result, language);
    const { classification } = summary;
    const accentColor = classification.color;

    // Resolve candidates in fixed positions: Lula left, Flávio right
    const lulaIdx = result.candidates.findIndex(c => c.id === LULA_ID);
    const flavioIdx = result.candidates.findIndex(c => c.id === FLAVIO_ID);
    const lulaCand = result.candidates[lulaIdx] ?? result.candidates[0];
    const flavioCand = result.candidates[flavioIdx] ?? result.candidates[1];
    const lulaPortrait = portraits[lulaIdx] ?? null;
    const flavioPortrait = portraits[flavioIdx] ?? null;
    const lulaName = site.candidates.find(p => p.id === LULA_ID)?.name ?? lulaCand.name;
    const flavioName = site.candidates.find(p => p.id === FLAVIO_ID)?.name ?? flavioCand.name;

    // ── BACKGROUND ──────────────────────────────────────────────────────────────
    context.fillStyle = BG;
    context.fillRect(0, 0, cardSize, cardHeight);

    // Soft radial glow at top-right
    const glow = context.createRadialGradient(cardSize, 0, 0, cardSize, 0, 520);
    glow.addColorStop(0, accentColor + '28');
    glow.addColorStop(1, 'transparent');
    context.fillStyle = glow;
    context.fillRect(0, 0, cardSize, 520);

    // ── HEADER (y 44–88) ─────────────────────────────────────────────────────────
    context.fillStyle = INK;
    context.font = 'bold 40px Sora, sans-serif';
    context.textAlign = 'left';
    context.fillText(uiText.brand, PAD, 80);

    context.fillStyle = INK_FAINT;
    context.fillRect(268, 67, 588, 1);

    context.fillStyle = INK_DIM;
    context.font = '600 17px Poppins, sans-serif';
    context.textAlign = 'right';
    context.fillText(uiText.myResult, cardSize - PAD, 80);
    context.textAlign = 'left';

    // ── CLASSIFICATION (y 110–270) ───────────────────────────────────────────────
    context.fillStyle = accentColor;
    context.font = '600 21px Poppins, sans-serif';
    context.fillText(classification.familyLabel.toUpperCase(), PAD, 132);

    context.fillStyle = INK;
    context.font = 'bold 54px Sora, sans-serif';
    const subtypeLines = wrappedLines(context, classification.subtypeLabel, cardSize - 2 * PAD);
    subtypeLines.forEach((line, i) => context.fillText(line, PAD, 198 + i * 60));

    // ── PORTRAIT DIVIDE (y 270–690) ──────────────────────────────────────────────
    const divTop = 270;
    const divH = 420;
    const divBottom = divTop + divH; // 690
    const halfW = cardSize / 2;

    function drawPortraitHalf(portrait, x, w, side)
    {
        context.save();
        context.beginPath();
        context.rect(x, divTop, w, divH);
        context.clip();

        if (portrait)
        {
            const scale = Math.max(w / portrait.naturalWidth, divH / portrait.naturalHeight);
            const pw = portrait.naturalWidth * scale;
            const ph = portrait.naturalHeight * scale;
            context.drawImage(portrait, x + (w - pw) / 2, divTop + (divH - ph) * 0.06, pw, ph);
        }

        // Multi-stop gradient: top 40% fully visible, darkens in lower 35% where text lives
        const bottomFade = context.createLinearGradient(0, divTop, 0, divBottom);
        bottomFade.addColorStop(0,    BG + '00'); // top: transparent
        bottomFade.addColorStop(0.40, BG + '00'); // 40%: still clear
        bottomFade.addColorStop(0.65, BG + '96'); // 65%: ~59% dark
        bottomFade.addColorStop(0.82, BG + 'e4'); // 82%: ~89% dark
        bottomFade.addColorStop(1,    BG);         // bottom: fully opaque
        context.fillStyle = bottomFade;
        context.fillRect(x, divTop, w, divH);

        // Inner-edge vignette toward the divide line
        const edgeX0 = side === 'left' ? halfW : x + w;
        const edgeX1 = side === 'left' ? halfW - 64 : x + w - 64;
        const edgeVign = context.createLinearGradient(edgeX0, 0, edgeX1, 0);
        edgeVign.addColorStop(0, BG + '70');
        edgeVign.addColorStop(1, 'transparent');
        context.fillStyle = edgeVign;
        context.fillRect(x, divTop, w, divH);

        context.restore();
    }

    drawPortraitHalf(lulaPortrait, 0, halfW, 'left');
    drawPortraitHalf(flavioPortrait, halfW, halfW, 'right');

    // The Divide — glowing vertical line
    context.save();
    context.shadowBlur = 32;
    context.shadowColor = accentColor;
    context.strokeStyle = accentColor;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(halfW, divTop);
    context.lineTo(halfW, divBottom);
    context.stroke();
    context.shadowBlur = 10;
    context.stroke();
    context.restore();

    // ── CANDIDATE INFO (overlaid at portrait bottom) ──────────────────────────────
    const partyY = divBottom - 16;

    function drawCandidateInfo(cand, name, align)
    {
        const isLeft = align === 'left';
        const textX = isLeft ? PAD : cardSize - PAD;
        context.textAlign = align;

        // Party · number
        context.font = '500 18px Poppins, sans-serif';
        context.fillStyle = INK_DIM;
        context.fillText(`${cand.party}\u00a0\u00b7\u00a0${cand.number}`, textX, partyY);

        // Candidate name (may wrap; drawn bottom-up from partyY)
        context.font = 'bold 26px Sora, sans-serif';
        context.fillStyle = INK;
        const nameLines = wrappedLines(context, name, halfW - PAD - 24);
        const nameBottomY = partyY - 28;
        [...nameLines].reverse().forEach((line, i) =>
            context.fillText(line, textX, nameBottomY - i * 32));

        // "COMPATIBILIDADE" label above name
        const nameBlockH = nameLines.length * 32;
        const compatLabelY = nameBottomY - nameBlockH - 14;
        context.font = '600 13px Poppins, sans-serif';
        context.fillStyle = INK_DIM;
        context.fillText(uiText.compat, textX, compatLabelY);

        // Large compatibility %
        context.font = 'bold 58px Sora, sans-serif';
        context.fillStyle = INK;
        context.fillText(`${cand.compatibility.toFixed(1)}%`, textX, compatLabelY - 22);
    }

    drawCandidateInfo(lulaCand, lulaName, 'left');
    drawCandidateInfo(flavioCand, flavioName, 'right');
    context.textAlign = 'left';

    // ── AXES SECTION (y 710–1726) ────────────────────────────────────────────────
    // 2 axes per row → 6 rows of ~155 px → labels at 26 px, very readable
    const axesTop = 710;
    const fullBarLeft = PAD;
    const fullBarWidth = cardSize - 2 * PAD;   // 952
    const colGap = 40;
    const colWidth = (fullBarWidth - colGap) / 2;  // 456
    const rowH = 155;
    const rowsTop = axesTop + 76;

    // Section header
    context.fillStyle = INK_DIM;
    context.font = '600 20px Poppins, sans-serif';
    context.fillText(uiText.axes, PAD, axesTop + 40);

    // Legend: ● VOCÊ  ● Lula  ● Flávio  (right-aligned, laid out right→left)
    const legendItems = [
        { label: uiText.you, color: INK, r: 7 },
        { label: lulaName.split(' ')[0], color: PT_RED, r: 6 },
        { label: flavioName.split(' ')[0], color: PL_BLUE, r: 6 }
    ];
    context.font = '500 15px Poppins, sans-serif';
    let lx = cardSize - PAD;
    const legendY = axesTop + 40;
    const legendDotY = legendY - 7;
    for (let i = legendItems.length - 1; i >= 0; i--)
    {
        const item = legendItems[i];
        const tw = context.measureText(item.label).width;
        context.textAlign = 'right';
        context.fillStyle = INK_DIM;
        context.fillText(item.label, lx, legendY);
        lx -= tw + 10;
        context.fillStyle = item.color;
        fillCircle(context, lx, legendDotY, item.r);
        lx -= item.r + 22;
    }
    context.textAlign = 'left';

    // Twelve axis rows, 2 per line
    result.axes.forEach((entry, index) =>
    {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const colX = fullBarLeft + col * (colWidth + colGap);
        const rowY = rowsTop + row * rowH;
        const trackY = rowY + 72;
        const dotY = trackY + 4;   // center of 8px track

        const userScore = entry.userScore;
        const leanLeft = userScore > 50;
        const isBalanced = userScore === 50;
        const leanColor = isBalanced ? INK_DIM
            : leanLeft ? (entry.axis.leftColor || PT_RED)
            : (entry.axis.rightColor || PL_BLUE);
        const dominantPct = Math.max(userScore, 100 - userScore).toFixed(0) + '%';
        const scoreToX = score => colX + colWidth * score / 100;

        // Axis label — truncated to leave room for % badge
        context.font = '600 24px Poppins, sans-serif';
        const maxLabelW = colWidth - context.measureText(dominantPct).width - 28;
        context.fillStyle = INK;
        context.fillText(truncate(context, entry.axis.label, maxLabelW), colX, rowY + 28);

        // Dominant % — right-aligned, colored by direction
        context.textAlign = 'right';
        context.fillStyle = leanColor;
        context.font = '600 18px Poppins, sans-serif';
        context.fillText(dominantPct, colX + colWidth, rowY + 28);
        context.textAlign = 'left';

        // Dominant pole name
        const dominantPole = isBalanced ? uiText.balance
            : leanLeft ? entry.axis.leftPole : entry.axis.rightPole;
        context.font = '400 14px Poppins, sans-serif';
        context.fillStyle = INK_DIM;
        context.fillText(truncate(context, dominantPole, colWidth * 0.88), colX, rowY + 50);

        // Track
        context.fillStyle = INK_FAINT;
        context.fillRect(colX, trackY, colWidth, 8);

        // Colored fill segment: center → user position (shows lean direction)
        if (!isBalanced)
        {
            const fillX = scoreToX(Math.min(userScore, 50));
            const fillW = scoreToX(Math.max(userScore, 50)) - fillX;
            context.fillStyle = leanColor + 'a0';
            context.fillRect(fillX, trackY, fillW, 8);
        }

        const lulaScore = entry.candidateScores[LULA_ID] ?? 50;
        const flavioScore = entry.candidateScores[FLAVIO_ID] ?? 50;

        // Candidate dots (drawn below user dot)
        context.fillStyle = PT_RED;
        fillCircle(context, scoreToX(lulaScore), dotY, 6);
        context.fillStyle = PL_BLUE;
        fillCircle(context, scoreToX(flavioScore), dotY, 6);

        // User dot — white, larger, soft glow
        context.save();
        context.shadowBlur = 14;
        context.shadowColor = 'rgba(255,250,242,0.55)';
        context.fillStyle = INK;
        fillCircle(context, scoreToX(userScore), dotY, 10);
        context.restore();
    });

    // ── FOOTER (y 1726–1786) ─────────────────────────────────────────────────────
    context.fillStyle = INK_FAINT;
    context.fillRect(PAD, 1726, fullBarWidth, 1);
    context.fillStyle = INK_DIM;
    context.font = '14px Poppins, sans-serif';
    context.fillText(uiText.note, PAD, 1758);
    context.fillStyle = INK;
    context.font = '600 20px Poppins, sans-serif';
    context.fillText(uiText.siteUrl, PAD, 1786);

    return summary;
}



module.exports = { cardSize, cardHeight, shareSummary, drawResultCard };
