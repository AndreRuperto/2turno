import type { ElectionComparison } from '../types/election';
import presentation from './electionPresentation.cjs';

declare const shareCard:
{
    cardSize: number;
    cardHeight: number;
    shareSummary(result: ElectionComparison, language?: string): {
        classification: ReturnType<typeof presentation.classificationLabels>;
        candidates: ElectionComparison['candidates'];
        tied: boolean;
        alignment: { name: string; aligned: string[]; different: string[]; statement: string }[];
        text: { result: string; compatibility: string; tie?: string; note?: string };
    };
    drawResultCard(context: CanvasRenderingContext2D, result: ElectionComparison, portraits?: (HTMLImageElement | null)[], language?: string): ReturnType<typeof shareCard.shareSummary>;
};

export default shareCard;
