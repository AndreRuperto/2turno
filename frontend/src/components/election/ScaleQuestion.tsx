import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { AnswerOption, AnswerValue, Axis, Question } from '../../types/quiz';
import { InfoSheet } from '../results/InfoSheet';

// Da esquerda para a direita, como as réguas do hero: discordância total → concordância total.
const SCALE: AnswerValue[] = ['STRONGLY_DISAGREE', 'DISAGREE', 'NEUTRAL', 'AGREE', 'STRONGLY_AGREE'];

export interface ScaleQuestionText
{
  help: string;
  helpAria: string;
  scaleAria: string;
  example: string;
}

interface ScaleQuestionProps
{
  question: Question;
  axis?: Axis;
  index: number;
  total: number;
  answered: number;
  options: AnswerOption[];
  selected?: AnswerValue;
  disabled?: boolean;
  axisDescription?: string;
  agreeHint?: string;
  example?: string;
  text: ScaleQuestionText;
  onSelect: (answer: AnswerValue) => void;
}

// Pergunta do 2 Turno: a resposta é um ponto numa régua de cinco posições, a mesma linguagem visual
// da logo e do hero. Cada posição é um rádio de verdade (clique, Tab, setas e leitor de tela).
export function ScaleQuestion({ question, axis, index, total, answered, options, selected, disabled = false,
  axisDescription, agreeHint, example, text, onSelect }: ScaleQuestionProps)
{
  const [helpOpen, setHelpOpen] = useState(false);
  const labels = Object.fromEntries(options.map(option => [option.id, option.label])) as Record<AnswerValue, string>;
  const selectedIndex = selected ? SCALE.indexOf(selected) : -1;
  const poleColor = axis && (question.agreePole === 'LEFT' ? axis.leftColor : axis.rightColor);
  // Posição de 0 a 100 na escala; na tela, os pontos ficam entre 10% e 90% da largura.
  const position = selectedIndex < 0 ? 50 : selectedIndex * 25;

  function move(event: KeyboardEvent<HTMLButtonElement>, current: number)
  {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (step === undefined || disabled) return;
    event.preventDefault();
    const next = Math.min(SCALE.length - 1, Math.max(0, current + step));
    onSelect(SCALE[next]);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button');
    buttons?.[next]?.focus();
  }

  return <article className="scale-question" aria-labelledby="scale-question-title"
    style={{ '--pole': poleColor ?? 'var(--green-500)' } as CSSProperties}>
    <header className="scale-question-head">
      <span className="scale-question-topic">{axis?.label ?? question.axisId}</span>
      <span className="scale-question-count">{index + 1} / {total}</span>
    </header>
    <div className="scale-question-progress" aria-hidden="true">
      <span style={{ width: `${(answered / total) * 100}%` }} />
    </div>

    <h2 id="scale-question-title">{question.text}</h2>
    {axis && <button className="scale-question-help" type="button" aria-label={text.helpAria} onClick={() => setHelpOpen(true)}>
      <span aria-hidden="true">?</span>{text.help}
    </button>}

    <div className="scale" role="radiogroup" aria-label={text.scaleAria}>
      <div className="scale-ends" aria-hidden="true">
        <span>{labels.STRONGLY_DISAGREE}</span>
        <span>{labels.STRONGLY_AGREE}</span>
      </div>
      <div className="scale-track">
        <span className="scale-line" aria-hidden="true" />
        <span className="scale-center" aria-hidden="true" />
        {selectedIndex >= 0 && <span className="scale-fill" aria-hidden="true"
          style={{ left: `${10 + Math.min(position, 50) * 0.8}%`, width: `${Math.abs(position - 50) * 0.8}%` }} />}
        <div className="scale-points">
          {SCALE.map((answer, pointIndex) =>
          {
            const isSelected = answer === selected;
            return <button key={answer} type="button" role="radio" data-answer={answer} aria-checked={isSelected}
              aria-label={labels[answer]} disabled={disabled}
              tabIndex={isSelected || (selectedIndex < 0 && answer === 'NEUTRAL') ? 0 : -1}
              className={isSelected ? 'scale-point selected' : 'scale-point'}
              onClick={() => onSelect(answer)} onKeyDown={event => move(event, pointIndex)}>
              <span className="scale-dot" aria-hidden="true" />
              <span className="scale-label" aria-hidden="true">{labels[answer]}</span>
            </button>;
          })}
        </div>
      </div>
      <p className="scale-current" aria-live="polite">{selected ? labels[selected] : ' '}</p>
    </div>

    {axis && helpOpen && <InfoSheet titleId="scale-help-title" style={{ '--ac': poleColor } as CSSProperties}
      onClose={() => setHelpOpen(false)}>
      <p className="e-axis-sheet-label">{axis.label}</p>
      <h3 id="scale-help-title">
        {question.agreePole === 'LEFT'
          ? <><span>{axis.leftPole}</span> × {axis.rightPole}</>
          : <>{axis.leftPole} × <span>{axis.rightPole}</span></>}
      </h3>
      {axisDescription && <p className="e-axis-sheet-text">{axisDescription}</p>}
      {agreeHint && <p className="e-axis-sheet-text">{agreeHint}</p>}
      {example && <p className="question-example"><strong>{text.example}</strong> {example}</p>}
    </InfoSheet>}
  </article>;
}
