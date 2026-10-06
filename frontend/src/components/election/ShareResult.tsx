import { useEffect, useState } from 'react';
import { LANG } from '../../i18n';
import type { ElectionComparison } from '../../types/election';
import presentation from '../../utils/electionPresentation.cjs';
import { InfoSheet } from '../results/InfoSheet';

const text = LANG === 'pt' ?
{
    share: 'Compartilhar resultado', download: 'Baixar cartão', title: 'Seu resultado no 2 Turno',
    you: 'Você', compatibility: 'Compatibilidade', note: 'Estimativa descritiva. Não representa intenção de voto.',
    error: 'Não foi possível gerar o cartão. Tente novamente.', preparing: 'Gerando cartão…'
} :
{
    share: 'Share result', download: 'Download card', title: 'Your 2 Turno result',
    you: 'You', compatibility: 'Compatibility', note: 'Descriptive estimate. Does not represent voting intention.',
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



async function createResultCard(result: ElectionComparison)
{
    await document.fonts.ready;
    const scores = Object.fromEntries(result.axes.map(entry => [entry.axis.id, entry.userScore]));
    const classification = presentation.classificationLabels(scores, LANG);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 280 + result.axes.length * 200 + 120;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = classification.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = classification.color;
    context.fillRect(0, 0, 1080, 12);
    context.font = 'bold 38px Sora, sans-serif';
    context.fillText('2 TURNO', 48, 72);
    context.font = 'bold 30px Sora, sans-serif';
    context.fillText(`${classification.familyLabel} · ${classification.subtypeLabel}`, 48, 126);
    context.fillStyle = '#20252a';
    context.font = '22px Poppins, sans-serif';
    result.candidates.forEach((candidate, index) =>
    {
        context.fillText(`${candidate.name} · ${text.compatibility}: ${candidate.compatibility.toFixed(1)}%`, 48, 178 + index * 36);
    });
    result.axes.forEach((entry, index) =>
    {
        const top = 270 + index * 200;
        context.fillStyle = '#ffffff';
        context.fillRect(32, top, 1016, 184);
        context.fillStyle = '#20252a';
        context.font = 'bold 24px Sora, sans-serif';
        context.fillText(entry.axis.label, 48, top + 34);
        context.font = '17px Poppins, sans-serif';
        drawWrappedText(context, `${entry.axis.leftPole} / ${entry.axis.rightPole}`, 48, top + 63, 976, 22);
        const participants = [{ name: text.you, score: entry.userScore }, ...result.candidates.map(candidate =>
            ({ name: candidate.name, score: entry.candidateScores[candidate.id] }))];
        participants.forEach((participant, participantIndex) =>
        {
            const percentages = presentation.percentagePair(participant.score);
            context.fillText(`${participant.name}: ${percentages?.left.toFixed(1)}% / ${percentages?.right.toFixed(1)}%`, 48, top + 111 + participantIndex * 26);
        });
    });
    context.font = '17px Poppins, sans-serif';
    context.fillText(text.note, 48, canvas.height - 80);
    context.fillText(`${result.modelId} · ${result.asOf}`, 48, canvas.height - 50);
    context.fillText(window.location.origin, 48, canvas.height - 24);
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
