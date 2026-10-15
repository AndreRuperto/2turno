import { useEffect, useId, useRef, useState } from 'react';
import { LANG } from '../../i18n';
import type { ElectionComparison } from '../../types/election';
import shareCard from '../../utils/electionShareCard.cjs';
import { InfoSheet } from '../results/InfoSheet';
import site from '../../site.json';

const text = LANG === 'pt' ?
{
    share: 'Compartilhar resultado', download: 'Baixar cartão', title: 'Seu resultado no 2 Turno',
    error: 'Não foi possível gerar o cartão. Tente novamente.', preparing: 'Gerando cartão…',
    description: 'Seu perfil político e a compatibilidade com os dois candidatos.'
} :
{
    share: 'Share result', download: 'Download card', title: 'Your 2 Turno result',
    error: 'Could not generate the card. Please try again.', preparing: 'Generating card…',
    description: 'Your political profile and compatibility with both candidates.'
};



async function loadPortrait(identifier: string)
{
    const source = site.candidates.find(candidate => candidate.id === identifier)?.portrait;
    if (!source) return null;
    const portrait = new Image();
    portrait.src = source;
    try
    {
        await portrait.decode();
        return portrait;
    }
    catch
    {
        return null;
    }
}



async function createResultCard(result: ElectionComparison)
{
    await document.fonts.ready;
    const portraits = await Promise.all(result.candidates.map(candidate => loadPortrait(candidate.id)));
    const canvas = document.createElement('canvas');
    canvas.width = shareCard.cardSize;
    canvas.height = shareCard.cardHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    shareCard.drawResultCard(context, result, portraits, LANG);
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG unavailable')), 'image/png'));
    return new File([blob], '2turno-result.png', { type: 'image/png' });
}



export function ShareResult({ result }: { result: ElectionComparison })
{
    const [card, setCard] = useState<{ file: File; url: string } | null>(null);
    const [open, setOpen] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [error, setError] = useState('');
    const titleIdentifier = useId();
    const generating = useRef(false);
    const currentResult = useRef(result);
    const mounted = useRef(false);
    currentResult.current = result;
    useEffect(() =>
    {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    useEffect(() => () => { if (card) URL.revokeObjectURL(card.url); }, [card]);
    useEffect(() =>
    {
        setCard(null);
        setOpen(false);
        setError('');
    }, [result]);

    async function prepareCard()
    {
        if (generating.current) return;
        setError('');
        if (card) { setOpen(true); return; }
        generating.current = true;
        setPreparing(true);
        try
        {
            const file = await createResultCard(result);
            if (!mounted.current || currentResult.current !== result) return;
            setCard({ file, url: URL.createObjectURL(file) });
            setOpen(true);
        }
        catch
        {
            setError(text.error);
        }
        finally
        {
            generating.current = false;
            setPreparing(false);
        }
    }



    async function shareResult()
    {
        if (!card || !navigator.share) return;
        try
        {
            await navigator.share({ title: text.title, files: [card.file] });
        }
        catch (failure)
        {
            if (!(failure instanceof DOMException && failure.name === 'AbortError')) setError(text.error);
        }
    }

    const summary = shareCard.shareSummary(result, LANG);
    const alternative = [summary.classification.familyLabel, summary.classification.subtypeLabel,
        ...summary.candidates.map(candidate => candidate.name + ': ' + candidate.compatibility.toFixed(1) + '%'),
        ...summary.alignment.map(candidate => candidate.statement)].join('. ');

    return <>
        <button type="button" onClick={prepareCard} disabled={preparing} aria-busy={preparing}>{preparing ? text.preparing : text.share}</button>
        {error && !open && <p role="alert">{error}</p>}
        {open && card && <InfoSheet titleId={titleIdentifier} className="share-result-dialog" onClose={() => setOpen(false)}>
            <h3 id={titleIdentifier}>{text.title}</h3>
            <p className="profile-note" style={{ color: 'var(--text)' }}>{text.description}</p>
            <img className="share-result-preview" src={card.url} alt={alternative} width="1080" height="1800" />
            <div className="election-actions share-result-actions">
                <a className="profile-link" href={card.url} download={card.file.name}>{text.download}</a>
                {typeof navigator.share === 'function' && navigator.canShare?.({ files: [card.file] }) && <button type="button" onClick={shareResult}>{text.share}</button>}
            </div>
            {error && <p role="alert">{error}</p>}
        </InfoSheet>}
    </>;
}
