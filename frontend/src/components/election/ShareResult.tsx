import { useEffect, useState } from 'react';
import { LANG } from '../../i18n';
import type { ElectionComparison } from '../../types/election';
import presentation from '../../utils/electionPresentation.cjs';
import { InfoSheet } from '../results/InfoSheet';
import site from '../../site.json';

const text = LANG === 'pt' ?
{
    share: 'Compartilhar resultado', download: 'Baixar cartão', title: 'Seu resultado no 2 Turno',
    you: 'Você', compatibility: 'Compatibilidade', note: 'Estimativa descritiva. Não representa intenção de voto.',
    axes: 'SEUS 12 EIXOS', closest: 'MAIS PRÓXIMO', tied: 'EMPATE ENTRE OS CANDIDATOS', comparison: 'CANDIDATOS NOS 12 EIXOS',
    error: 'Não foi possível gerar o cartão. Tente novamente.', preparing: 'Gerando cartão…'
} :
{
    share: 'Share result', download: 'Download card', title: 'Your 2 Turno result',
    you: 'You', compatibility: 'Compatibility', note: 'Descriptive estimate. Does not represent voting intention.',
    axes: 'YOUR 12 AXES', closest: 'CLOSEST MATCH', tied: 'TIE BETWEEN THE CANDIDATES', comparison: 'CANDIDATES ON THE 12 AXES',
    error: 'Could not generate the card. Please try again.', preparing: 'Generating card…'
};



function drawWrappedText(context: CanvasRenderingContext2D, value: string, horizontal: number, vertical: number, width: number, lineHeight: number)
{
    let line = '';
    for (const word of value.split(' '))
    {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > width)
        {
            context.fillText(line, horizontal, vertical);
            vertical += lineHeight;
            line = word;
        }
        else line = next;
    }
    context.fillText(line, horizontal, vertical);
    return vertical + lineHeight;
}



function drawPanel(context: CanvasRenderingContext2D, horizontal: number, vertical: number, width: number, height: number)
{
    context.beginPath();
    context.roundRect(horizontal, vertical, width, height, 30);
    context.fillStyle = '#00000030';
    context.fill();
    context.strokeStyle = '#ffffff24';
    context.lineWidth = 1;
    context.stroke();
}



async function loadPortrait(identifier: string)
{
    const source = site.candidates.find(candidate => candidate.id === identifier)?.portrait;
    if (!source) return null;
    const portrait = new Image();
    portrait.src = source;
    try { await portrait.decode(); return portrait; }
    catch { return null; }
}



function drawCardHeader(context: CanvasRenderingContext2D, classification: ReturnType<typeof presentation.classificationLabels>)
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



async function drawCandidateHighlights(context: CanvasRenderingContext2D, result: ElectionComparison)
{
    const candidate = result.candidates[0];
    const portrait = await loadPortrait(candidate.id);
    drawPanel(context, 64, 330, 412, 710);
    if (portrait)
    {
        context.save();
        context.beginPath();
        context.roundRect(64, 330, 412, 710, 30);
        context.clip();
        const scale = Math.max(412 / portrait.naturalWidth, 710 / portrait.naturalHeight);
        const width = portrait.naturalWidth * scale;
        const height = portrait.naturalHeight * scale;
        context.drawImage(portrait, 64 + (412 - width) / 2, 330 + (710 - height) / 2, width, height);
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
    const nameBottom = drawWrappedText(context, candidate.name, 92, 918, 350, 40);
    context.font = '22px Poppins, sans-serif';
    context.fillText(`${candidate.party} · ${candidate.number}`, 92, nameBottom + 18);
    const other = result.candidates[1];
    drawPanel(context, 64, 1060, 412, 194);
    context.fillStyle = '#fffaf2';
    context.font = 'bold 26px Sora, sans-serif';
    drawWrappedText(context, other.name, 92, 1105, 350, 32);
    context.font = '24px Poppins, sans-serif';
    context.fillText(`${other.compatibility.toFixed(1)}% · ${text.compatibility}`, 92, 1206);
}



function drawUserAxes(context: CanvasRenderingContext2D, result: ElectionComparison)
{
    drawPanel(context, 500, 330, 516, 924);
    context.fillStyle = '#fffaf2';
    context.font = '600 24px Poppins, sans-serif';
    context.fillText(text.axes, 530, 384);
    const colors = ['#ffb25f', '#eb8d9f', '#f3cb6d', '#8ab8df', '#bd9aed', '#ef92a9', '#c3bf82', '#79cbc0', '#8ab1ec', '#a5cb74', '#daac76', '#8dd0cf'];
    result.axes.forEach((entry, index) =>
    {
        const top = 416 + index * 68;
        const percentages = presentation.percentagePair(entry.userScore)!;
        context.fillStyle = '#fffaf2';
        context.font = '600 18px Poppins, sans-serif';
        context.fillText(entry.axis.label, 530, top);
        context.font = '14px Poppins, sans-serif';
        context.fillStyle = '#ffffffb8';
        const dominantPole = percentages.left === percentages.right
            ? (LANG === 'pt' ? 'Equilíbrio entre os dois polos' : 'Balance between both poles')
            : percentages.left > percentages.right ? entry.axis.leftPole : entry.axis.rightPole;
        drawWrappedText(context, dominantPole, 530, top + 24, 305, 17);
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



function drawCandidateComparison(context: CanvasRenderingContext2D, result: ElectionComparison)
{
    const candidate = result.candidates[0];
    const other = result.candidates[1];
    drawPanel(context, 64, 1280, 952, 458);
    context.fillStyle = '#fffaf2';
    context.font = '600 22px Poppins, sans-serif';
    context.fillText(text.comparison, 92, 1326);
    context.font = '16px Poppins, sans-serif';
    context.fillText(`${candidate.number} · ${candidate.name}     |     ${other.number} · ${other.name}`, 92, 1360);
    result.axes.forEach((entry, index) =>
    {
        const horizontal = 92 + (index % 2) * 466;
        const vertical = 1398 + Math.floor(index / 2) * 54;
        const first = presentation.percentagePair(entry.candidateScores[candidate.id])!;
        const second = presentation.percentagePair(entry.candidateScores[other.id])!;
        context.fillStyle = '#fffaf2';
        context.font = '600 16px Poppins, sans-serif';
        context.fillText(entry.axis.label, horizontal, vertical);
        context.fillStyle = '#ffffffb8';
        context.font = '15px Poppins, sans-serif';
        context.fillText(`${candidate.number}: ${first.left.toFixed(1)} / ${first.right.toFixed(1)}%    ${other.number}: ${second.left.toFixed(1)} / ${second.right.toFixed(1)}%`, horizontal, vertical + 22);
    });
    context.fillStyle = '#ffffffb8';
    context.font = '16px Poppins, sans-serif';
    context.fillText(LANG === 'pt' ? 'Comparação: percentuais do primeiro / segundo polo de cada eixo.' : 'Comparison: first / second pole percentages on each axis.', 92, 1720);
}



function drawCardFooter(context: CanvasRenderingContext2D, result: ElectionComparison)
{
    context.fillStyle = '#ffffffb8';
    context.fillRect(64, 1780, 952, 1);
    context.font = '16px Poppins, sans-serif';
    context.fillText(text.note, 64, 1818);
    context.fillText(`${result.modelId} · ${result.asOf}`, 64, 1850);
    context.fillStyle = '#fffaf2';
    context.font = '600 22px Poppins, sans-serif';
    context.fillText(new URL(site.website).hostname.toUpperCase(), 64, 1896);
}



async function createResultCard(result: ElectionComparison)
{
    await document.fonts.ready;
    const scores = Object.fromEntries(result.axes.map(entry => [entry.axis.id, entry.userScore]));
    const classification = presentation.classificationLabels(scores, LANG);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    const background = context.createLinearGradient(0, 0, 1080, 1920);
    background.addColorStop(0, classification.color);
    background.addColorStop(1, '#101622');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawCardHeader(context, classification);
    await drawCandidateHighlights(context, result);
    drawUserAxes(context, result);
    drawCandidateComparison(context, result);
    drawCardFooter(context, result);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG unavailable')), 'image/png'));
    return new File([blob], '2turno-result.png', { type: 'image/png' });
}



export function ShareResult({ result }: { result: ElectionComparison })
{
    const [card, setCard] = useState<{ file: File; url: string } | null>(null);
    const [open, setOpen] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => () => { if (card) URL.revokeObjectURL(card.url); }, [card]);

    async function prepareCard()
    {
        setError('');
        if (card) { setOpen(true); return; }
        setPreparing(true);
        try
        {
            const file = await createResultCard(result);
            setCard({ file, url: URL.createObjectURL(file) });
            setOpen(true);
        }
        catch { setError(text.error); }
        finally { setPreparing(false); }
    }



    async function shareCard()
    {
        if (!card) return;
        try { await navigator.share({ title: text.title, files: [card.file] }); }
        catch (failure)
        {
            if (!(failure instanceof DOMException && failure.name === 'AbortError')) setError(text.error);
        }
    }

    return <>
        <button type="button" onClick={prepareCard} disabled={preparing}>{preparing ? text.preparing : text.share}</button>
        {error && <p role="alert">{error}</p>}
        {open && card && <InfoSheet titleId="share-result-title" className="share-result-dialog" onClose={() => setOpen(false)}>
            <h3 id="share-result-title">{text.title}</h3>
            <img className="share-result-preview" src={card.url} alt={text.title} />
            <div className="election-actions">
                <a href={card.url} download={card.file.name}>{text.download}</a>
                {navigator.canShare?.({ files: [card.file] }) && <button type="button" onClick={shareCard}>{text.share}</button>}
            </div>
        </InfoSheet>}
    </>;
}
