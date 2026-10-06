import { useId, useState } from 'react';
import { LANG } from '../../i18n';
import radicalMode from '../../utils/extremistMode.cjs';
import { ProfilePortrait } from './ProfileComponents';
import type { AnswerValue } from '../../types/quiz';

const themeNames = LANG === 'pt' ? {
    authoritarianism: 'Autoritarismo', stateEconomy: 'Controle estatal da economia',
    nationalism: 'Nacionalismo e expansionismo', exclusion: 'Exclusão por origem',
    collectivism: 'Coletivização forçada'
} : {
    authoritarianism: 'Authoritarianism', stateEconomy: 'State economic control',
    nationalism: 'Nationalism and expansionism', exclusion: 'Ancestry-based exclusion',
    collectivism: 'Forced collectivization'
};
type HistoricalProfile = ReturnType<typeof radicalMode.historicalComparisons>[number];



function HistoricalIdentity({ profile, compact = false }: { profile: HistoricalProfile; compact?: boolean })
{
    const [biographyOpen, setBiographyOpen] = useState(false);
    const biographyIdentifier = useId();
    const biographyLabel = (LANG === 'pt' ? 'Sobre ' : 'About ') + profile.name;
    return <div className={compact ? 'historical-person historical-person-compact' : 'historical-person'}>
        <div className="historical-identity">
            {!compact && <ProfilePortrait name={profile.name} source={profile.portrait} />}
            {!compact && <div className="historical-person-heading"><h3>{profile.name}</h3><strong>{profile.similarity}%</strong></div>}
            <button type="button" className={'candidate-info-button historical-info-button' + (compact ? ' historical-portrait-button' : '')}
                aria-label={biographyLabel} aria-controls={biographyIdentifier} aria-expanded={biographyOpen}
                aria-describedby={biographyOpen ? biographyIdentifier : undefined}
                onClick={() => setBiographyOpen(previous => !previous)}
                onKeyDown={event => { if (event.key === 'Escape') setBiographyOpen(false); }}>
                {compact && <ProfilePortrait name={profile.name} source={profile.portrait} />}
                <span aria-hidden="true">?</span>
            </button>
        </div>
        {compact && <span className="historical-short-name">{profile.shortName}</span>}
        <p id={biographyIdentifier} className="historical-biography" hidden={!biographyOpen}>{profile.biography[LANG]}</p>
    </div>;
}



export function HistoricalComparisons({ scores, answers }: { scores: Record<string, number>; answers: Record<string, AnswerValue> })
{
    const comparisons = radicalMode.historicalComparisons(scores, answers);
    return <>
        <details className="historical-comparison">
            <summary>{LANG === 'pt' ? 'Comparação com figuras históricas extremistas' : 'Extremist historical figures comparison'}</summary>
            <p>{LANG === 'pt'
                ? 'Comparação ilustrativa de políticas de regimes históricos e atuais. As notas são interpretações editoriais de fontes, não respostas reais dessas pessoas. Proximidade em alguns temas não significa adesão à ideologia completa ou aos crimes do regime.'
                : 'Illustrative policy comparison with historical and contemporary regimes. Scores are editorial interpretations of sources, not these people’s actual answers. Similarity on selected themes does not mean agreement with an entire ideology or a regime’s crimes.'}</p>
            <details className="historical-method">
                <summary>{LANG === 'pt' ? 'Como a comparação funciona' : 'How this comparison works'}</summary>
                <p>{LANG === 'pt'
                    ? 'Baixo = 0, intermediário = 50 e alto = 100. O percentual usa a distância média apenas nos temas avaliados; temas sem avaliação ficam de fora. Figuras com coberturas diferentes não formam um ranking confiável. É uma simplificação, não uma classificação científica.'
                    : 'Low = 0, intermediate = 50 and high = 100. The percentage uses mean distance only on assessed themes; unassessed themes are excluded. Figures with different coverage do not form a reliable ranking. This is a simplification, not a scientific classification.'}</p>
            </details>
            <div className="historical-grid">{comparisons.map(profile => <article key={profile.id} className="historical-card">
                <HistoricalIdentity profile={profile} />
                <p className="profile-note">{profile.period} · {LANG === 'pt' ? 'Proximidade temática estimada' : 'Estimated thematic similarity'} · {profile.coverage}/5 {LANG === 'pt' ? 'temas' : 'themes'}</p>
                <p>{profile.description[LANG]}</p>
                <details><summary>{LANG === 'pt' ? 'Temas e fontes' : 'Themes and sources'}</summary>
                    <ul>{Object.entries(profile.scores).map(([identifier, score]) => <li key={identifier}>
                        {themeNames[identifier as keyof typeof themeNames]}: {score === null
                            ? (LANG === 'pt' ? 'não avaliado' : 'unassessed')
                            : (LANG === 'pt' ? 'você ' : 'you ') + Math.round(profile.user[identifier]) + ' / ' + (LANG === 'pt' ? 'referência ' : 'reference ') + score}
                    </li>)}</ul>
                    <ul>{profile.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
                </details>
            </article>)}</div>
        </details>
        <ul className="historical-preview" aria-label={LANG === 'pt' ? 'Figuras da comparação histórica' : 'Historical comparison figures'}>
            {comparisons.map(profile => <li key={profile.id}><HistoricalIdentity profile={profile} compact /></li>)}
        </ul>
    </>;
}
