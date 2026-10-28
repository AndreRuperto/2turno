import { useEffect, useId, useRef, useState } from 'react';
import { LANG } from '../../i18n';
import translations from '../../i18n/electionShare.json';
import type { ElectionComparison } from '../../types/election';
import shareCard from '../../utils/electionShareCard.cjs';
import { InfoSheet } from '../results/InfoSheet';
import site from '../../site.json';

const text = translations[LANG].interface;



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



function readProfileColors()
{
    const profile = document.querySelector('#seu-perfil');
    const header = profile?.querySelector('.ideology-header');
    const title = header?.querySelector('h2');
    if (!profile || !header || !title) return undefined;
    const profileStyle = getComputedStyle(profile);
    const headerStyle = getComputedStyle(header);
    const description = profile.querySelector('.profile-note');
    return {
        background: headerStyle.backgroundColor,
        border: profileStyle.borderTopColor,
        accent: headerStyle.getPropertyValue('--ideology-color').trim(),
        title: getComputedStyle(title).color,
        muted: description ? getComputedStyle(description).color : getComputedStyle(title).color
    };
}



async function createResultCard(result: ElectionComparison, theme: 'dark' | 'light')
{
    const profileColors = readProfileColors();
    await Promise.all([
        document.fonts.load('700 48px Sora'),
        document.fonts.load('800 48px Sora'),
        document.fonts.load('400 22px Poppins'),
        document.fonts.load('500 22px Poppins'),
        document.fonts.load('600 22px Poppins')
    ]);
    await document.fonts.ready;
    const portraits = await Promise.all(result.candidates.map(candidate => loadPortrait(candidate.id)));
    const canvas = document.createElement('canvas');
    canvas.width = shareCard.cardSize * shareCard.pixelRatio;
    canvas.height = shareCard.cardHeight * shareCard.pixelRatio;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.scale(shareCard.pixelRatio, shareCard.pixelRatio);
    shareCard.drawResultCard(context, result, portraits, LANG, theme, profileColors);
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG unavailable')), 'image/png'));
    return new File([blob], '2turno-result.png', { type: 'image/png' });
}



export function ShareResult({ result, theme }: { result: ElectionComparison; theme: 'dark' | 'light' })
{
    const [card, setCard] = useState<{ file: File; url: string; theme: 'dark' | 'light' } | null>(null);
    const [open, setOpen] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [error, setError] = useState('');
    const titleIdentifier = useId();
    const generating = useRef(false);
    const currentResult = useRef(result);
    const currentTheme = useRef(theme);
    currentTheme.current = theme;
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
    }, [result, theme]);

    async function prepareCard()
    {
        if (generating.current) return;
        setError('');
        if (card?.theme === theme) { setOpen(true); return; }
        generating.current = true;
        setPreparing(true);
        try
        {
            const file = await createResultCard(result, theme);
            if (!mounted.current || currentResult.current !== result || currentTheme.current !== theme) return;
            setCard({ file, url: URL.createObjectURL(file), theme });
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
        ...summary.candidates.map(candidate => candidate.name + ': ' + new Intl.NumberFormat(LANG, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(candidate.compatibility) + '%'),
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
