import type { ElectionComparison } from '../types/election';
import presentation from './electionPresentation.cjs';
import translations from '../i18n/electionShare.json';

declare const shareCard:
{
    cardSize: number;
    cardHeight: number;
    pixelRatio: number;
    themes: Record<'dark' | 'light', Record<string, string>>;
    shareSummary(result: ElectionComparison, language?: 'pt' | 'en'): {
        classification: ReturnType<typeof presentation.classificationLabels>;
        candidates: ElectionComparison['candidates'];
        axes: ElectionComparison['axes'];
        description: string;
        tied: boolean;
        alignment: { id: string; name: string; aligned: string[]; different: string[]; statement: string }[];
        text: typeof translations.pt;
    };
    drawResultCard(context: CanvasRenderingContext2D, result: ElectionComparison, portraits?: (HTMLImageElement | null)[], language?: 'pt' | 'en', theme?: 'dark' | 'light', profileColors?: Record<'background' | 'border' | 'accent' | 'title' | 'muted', string>): ReturnType<typeof shareCard.shareSummary>;
};

export default shareCard;
