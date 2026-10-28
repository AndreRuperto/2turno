import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import profiles from '../data/electionProfiles.generated.json';
import translations from '../i18n/electionShare.json';
import type { ElectionComparison } from '../types/election';

const require = createRequire(import.meta.url);
const shareCard = require('./electionShareCard.cjs');



function resultFixture(): ElectionComparison
{
    return {
        modelId: 'brazil-presidential-2026-v2', asOf: '2026-10-05', scoringMethod: 'mean-absolute-distance-v1',
        axes: profiles.axes.pt.map(axis => ({ axis, userScore: 50, candidateScores: Object.fromEntries(profiles.candidates.map(candidate => [candidate.id, candidate.scores[axis.id as keyof typeof candidate.scores]])) })),
        candidates: profiles.candidates.map(candidate => ({ id: candidate.id, name: candidate.name, party: candidate.party, number: candidate.number, distance: 25, compatibility: 75 })),
        closestCandidateIds: profiles.candidates.map(candidate => candidate.id), answeredQuestionCounts: {}
    };
}



function recordingContext()
{
    const text: { value: string; horizontal: number; vertical: number; width: number; color: string }[] = [];
    const markers: { horizontal: number; vertical: number; radius: number }[] = [];
    const panels: { horizontal: number; vertical: number; width: number; height: number }[] = [];
    const backgrounds: string[] = [];
    const context = {
        font: '', fillStyle: '', textAlign: 'left',
        fillText(value: string, horizontal: number, vertical: number)
        {
            text.push({ value, horizontal, vertical, width: this.measureText(value).width, color: this.fillStyle });
        },
        measureText(value: string) { return { width: value.length * Number(this.font.match(/(\d+)px/)?.[1] || 32) * .55 }; },
        createLinearGradient() { return { addColorStop() {} }; },
        beginPath() {},
        roundRect(horizontal: number, vertical: number, width: number, height: number) { panels.push({ horizontal, vertical, width, height }); },
        fill() {},
        fillRect() { backgrounds.push(this.fillStyle); },
        save() {}, restore() {},
        arc(horizontal: number, vertical: number, radius: number) { markers.push({ horizontal, vertical, radius }); },
        clip() {}, stroke() {}
    };
    return { context, text, markers, panels, backgrounds };
}



describe('Theme-aware result export', () =>
{
    it('preserves classification, exact compatibility and candidate identity when rankings reverse', () =>
    {
        const result = resultFixture();
        result.candidates.reverse();
        result.candidates[0].compatibility = 62.5;
        const snapshot = JSON.stringify(result);
        const summary = shareCard.shareSummary(result, 'en');
        expect(summary.candidates.map((candidate: { name: string }) => candidate.name)).toEqual(['Lula', 'Flávio Bolsonaro']);
        expect(summary.candidates.map((candidate: { compatibility: number }) => candidate.compatibility)).toEqual([75, 62.5]);
        expect(summary.classification.subtype).toBe('balanced-centrism');
        expect(JSON.stringify(result)).toBe(snapshot);
    });

    it.each(['pt', 'en'] as const)('localizes every axis and alignment label in %s from the selected app language', language =>
    {
        const summary = shareCard.shareSummary(resultFixture(), language);
        expect(summary.axes.map((entry: ElectionComparison['axes'][number]) => entry.axis.label)).toEqual(profiles.axes[language].map(axis => axis.label));
        expect(summary.text).toEqual(translations[language]);
        expect(summary.description).toBe(translations[language].descriptions['balanced-centrism']);
        expect(summary.alignment.flatMap((candidate: { aligned: string[]; different: string[] }) => [...candidate.aligned, ...candidate.different])
            .every((label: string) => profiles.axes[language].some(axis => axis.label === label))).toBe(true);
    });

    it.each(['dark', 'light'])('renders both languages with identical data and exact marker positions in %s mode', theme =>
    {
        for (const language of ['pt', 'en'] as const)
        {
            const result = resultFixture();
            result.axes[0].userScore = 100;
            result.axes[1].userScore = 0;
            result.axes[2].userScore = 25;
            const recording = recordingContext();
            shareCard.drawResultCard(recording.context, result, [], language, theme);
            expect(recording.backgrounds[0]).toBe(shareCard.themes[theme].background);
            const markers = recording.markers.filter(marker => marker.radius === 7);
            expect(markers).toHaveLength(12);
            expect(markers[0].horizontal).toBe(95);
            expect(markers[1].horizontal).toBe(501);
            expect(markers[2].horizontal).toBe(95 + .75 * 406);
            expect(recording.text.some(entry => entry.value === '25%')).toBe(true);
            expect(recording.text.filter(entry => entry.value === translations[language].tie)).toHaveLength(2);
            expect(recording.text.some(entry => entry.value === (language === 'pt' ? '75,0%' : '75.0%'))).toBe(true);
            expect(recording.text.some(entry => entry.value === 'FB')).toBe(true);
            expect(recording.text.some(entry => entry.value === translations[language].disclaimer)).toBe(true);
            expect(recording.text.every(entry => entry.vertical > 0 && entry.vertical < 1800)).toBe(true);
            const firstCandidate = recording.panels.find(panel => panel.vertical === 316);
            expect(firstCandidate?.width).toBe(488);
            expect(shareCard.cardSize * shareCard.pixelRatio).toBe(2160);
            expect(shareCard.cardHeight * shareCard.pixelRatio).toBe(3600);
        }
    });

    it('uses candidate IDs for red and blue accents regardless of score order', () =>
    {
        const result = resultFixture();
        result.candidates.reverse();
        result.closestCandidateIds = ['flavio-bolsonaro'];
        const recording = recordingContext();
        shareCard.drawResultCard(recording.context, result, [], 'en', 'light');
        const percentages = recording.text.filter(entry => entry.value === '75.0%');
        expect(percentages.map(entry => entry.color)).toEqual([shareCard.themes.light.red, shareCard.themes.light.blue]);
        expect(recording.text.filter(entry => entry.value === translations.en.closest)).toHaveLength(1);
    });

    it('provides a description for every calculated political subtype', () =>
    {
        for (const language of ['pt', 'en'] as const)
            for (const score of [0, 25, 50, 75, 100])
            {
                const result = resultFixture();
                result.axes.forEach(entry => { entry.userScore = score; });
                const summary = shareCard.shareSummary(result, language);
                expect(summary.description.length).toBeGreaterThan(10);
            }
    });

    it('fits long translated labels without crossing into percentages or tracks', () =>
    {
        const result = resultFixture();
        result.axes[0].axis = { ...result.axes[0].axis, id: 'long-label', label: 'Public services, state-owned enterprises and provision of essential infrastructure' };
        const recording = recordingContext();
        shareCard.drawResultCard(recording.context, result, [], 'en', 'light');
        const title = recording.text.filter(entry => entry.horizontal === 95 && entry.vertical >= 724 && entry.vertical <= 748);
        expect(title).toHaveLength(2);
        expect(title.every(entry => entry.width <= 338)).toBe(true);
        expect(title.map(entry => entry.value).join(' ')).toBe(result.axes[0].axis.label);
    });

    it('keeps all text palette combinations above WCAG AA contrast', () =>
    {
        const luminance = (color: string) =>
        {
            const channels = color.match(/[0-9a-f]{2}/gi)!.map(channel => parseInt(channel, 16) / 255)
                .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
            return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
        };
        for (const theme of Object.values(shareCard.themes) as Record<string, string>[])
            for (const [foreground, background] of [['text', 'background'], ['muted', 'background'], ['text', 'surface'], ['muted', 'surface'], ['red', 'redSurface'], ['blue', 'blueSurface'], ['muted', 'redSurface'], ['muted', 'blueSurface']])
            {
                const values = [luminance(theme[foreground]), luminance(theme[background])];
                expect((Math.max(...values) + .05) / (Math.min(...values) + .05)).toBeGreaterThanOrEqual(4.5);
            }
    });

    it.each([0, 40, 50, 60, 100])('reuses classification colors for the profile title at score %s in both themes', score =>
    {
        const result = resultFixture();
        result.axes.forEach(entry => { entry.userScore = score; });
        const expected = shareCard.shareSummary(result, 'pt').classification.color;
        for (const theme of ['dark', 'light'])
        {
            const recording = recordingContext();
            shareCard.drawResultCard(recording.context, result, [], 'pt', theme);
            expect(recording.text.find(entry => entry.vertical === 225)?.color).toBe(expected);
        }
    });
});
