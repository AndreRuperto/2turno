import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import profiles from '../data/electionProfiles.generated.json';
import type { ElectionComparison } from '../types/election';

const require = createRequire(import.meta.url);
const shareCard = require('./electionShareCard.cjs');



function resultFixture(): ElectionComparison
{
    return {
        modelId: 'brazil-presidential-2026-v2',
        asOf: '2026-10-05',
        scoringMethod: 'mean-absolute-distance-v1',
        axes: profiles.axes.pt.map(axis => ({ axis, userScore: 50, candidateScores: Object.fromEntries(profiles.candidates.map(candidate => [candidate.id, candidate.scores[axis.id as keyof typeof candidate.scores]])) })),
        candidates: profiles.candidates.map(candidate => ({ id: candidate.id, name: candidate.id === 'lula-da-silva' ? 'Luiz Inácio Lula da Silva (Lula)' : candidate.name, party: candidate.party, number: candidate.number, distance: 25, compatibility: 75 })),
        closestCandidateIds: profiles.candidates.map(candidate => candidate.id),
        answeredQuestionCounts: {}
    };
}



describe('Detailed 2 Turno share card', () =>
{
    it('keeps Portuguese accents and separators valid UTF-8', () =>
    {
        const source = readFileSync(new URL('./electionShareCard.cjs', import.meta.url), 'utf8');
        expect(source).toContain('Não representa intenção de voto.');
        expect(source).toContain('VOCÊ');
        expect(source).toContain(' · ');
        expect(source).not.toMatch(/Ã[\u0080-\u00BFŠš]|Â·|â€/);
    });

    it('preserves both candidates and exact compatibility in a tie', () =>
    {
        const result = resultFixture();
        const summary = shareCard.shareSummary(result);
        expect(summary.tied).toBe(true);
        expect(summary.candidates.map((candidate: { compatibility: number }) => candidate.compatibility)).toEqual([75, 75]);
        expect(summary.candidates.map((candidate: { name: string }) => candidate.name)).toEqual(['Lula', 'Flávio Bolsonaro']);
        expect(result.candidates[0].name).toBe('Luiz Inácio Lula da Silva (Lula)');
    });

    it('translates the summary without changing its classification or scores', () =>
    {
        const portuguese = shareCard.shareSummary(resultFixture(), 'pt');
        const english = shareCard.shareSummary(resultFixture(), 'en');
        expect(portuguese.classification.family).toBe(english.classification.family);
        expect(portuguese.classification.subtype).toBe(english.classification.subtype);
        expect(portuguese.text.compatibility).toBe('COMPATIBILIDADE');
        expect(english.text.compatibility).toBe('COMPATIBILITY');
        expect(english.candidates).toEqual(portuguese.candidates);
    });

    it.each(['pt', 'en'])('renders the restored axes and comparisons in %s', language =>
    {
        const drawn: { value: string; font: string }[] = [];
        const markers: { horizontal: number; radius: number }[] = [];
        const context = {
            font: '',
            fillStyle: '',
            textAlign: 'left',
            fillText(value: string) { drawn.push({ value, font: this.font }); },
            measureText(value: string) { return { width: value.length * Number(this.font.match(/(\d+)px/)?.[1] || 32) * .5 }; },
            createLinearGradient() { return { addColorStop() {} }; },
            createRadialGradient() { return { addColorStop() {} }; },
            beginPath() {},
            roundRect() {},
            rect() {},
            fill() {},
            fillRect() {},
            save() {},
            restore() {},
            arc(horizontal: number, _vertical: number, radius: number) { markers.push({ horizontal, radius }); },
            clip() {},
            moveTo() {},
            lineTo() {},
            stroke() {}
        };
        const result = resultFixture();
        result.axes[0].userScore = language === 'pt' ? 100 : 0;
        shareCard.drawResultCard(context, result, [], language);
        const userMarkers = markers.filter(marker => marker.radius === 7);
        expect(userMarkers).toHaveLength(12);
        if (language === 'pt') expect(userMarkers[0].horizontal).toBeLessThan(userMarkers[2].horizontal);
        else expect(userMarkers[0].horizontal).toBeGreaterThan(userMarkers[2].horizontal);
        expect(shareCard.cardSize).toBe(1080);
        expect(drawn.some(entry => entry.value === '2 TURNO')).toBe(true);
        expect(drawn.some(entry => entry.value === '75.0%')).toBe(true);
        expect(shareCard.cardHeight).toBe(1800);
        expect(drawn.some(entry => /CANDIDATOS NOS 12 EIXOS|CANDIDATES ON THE 12 AXES/.test(entry.value))).toBe(false);
        expect(drawn.some(entry => /COMPATIBILIDADE|COMPATIBILITY/.test(entry.value))).toBe(true);
        expect(drawn.some(entry => entry.value === 'Lula')).toBe(true);
        expect(drawn.some(entry => /12axes/i.test(entry.value))).toBe(false);
        expect(drawn.some(entry => entry.value === (language === 'pt' ? 'SEUS 12 EIXOS' : 'YOUR 12 AXES'))).toBe(true);
        expect(drawn.some(entry => entry.value === (language === 'pt' ? 'ONDE VOCÊ SE APROXIMA E SE DISTANCIA' : 'WHERE YOUR VIEWS ALIGN AND DIFFER'))).toBe(true);
        expect(drawn.filter(entry => entry.value === (language === 'pt' ? 'MAIS ALINHADO' : 'CLOSER ALIGNMENT'))).toHaveLength(2);
        expect(drawn.filter(entry => entry.value === (language === 'pt' ? 'MENOS ALINHADO' : 'LESS ALIGNED'))).toHaveLength(2);
        expect(drawn.filter(entry => entry.value === (language === 'pt' ? 'EMPATE' : 'TIE'))).toHaveLength(2);
        expect(drawn.some(entry => entry.value === 'FB')).toBe(true);

    });
});
