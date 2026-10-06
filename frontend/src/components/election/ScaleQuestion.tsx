import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { AnswerOption, AnswerValue, Axis, Question } from '../../types/quiz';
import { InfoSheet } from '../results/InfoSheet';

// As opções começam com concordância total e seguem até discordância total.
const SCALE: AnswerValue[] = ['STRONGLY_AGREE', 'AGREE', 'NEUTRAL', 'DISAGREE', 'STRONGLY_DISAGREE'];

export interface ScaleQuestionText
{
  help: string;
  helpAria: string;
  scaleAria: string;
  example: string;
  instruction: string;
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

// Cada cartão representa um nível de concordância, com rótulo sempre visível e navegação por setas.
export function ScaleQuestion({ question, axis, index, total, answered, options, selected, disabled = false,
  axisDescription, agreeHint, example, text, onSelect }: ScaleQuestionProps)
{
  const [helpOpen, setHelpOpen] = useState(false);
  const labels = Object.fromEntries(options.map(option => [option.id, option.label])) as Record<AnswerValue, string>;
  const selectedIndex = selected ? SCALE.indexOf(selected) : -1;
  const poleColor = axis && (question.agreePole === 'LEFT' ? axis.leftColor : axis.rightColor);

  function move(event: KeyboardEvent<HTMLButtonElement>, current: number)
  {
    const step = { ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1 }[event.key];
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
      <p className="answer-instruction">{text.instruction}</p>
        <div className="scale-points">
          {SCALE.map((answer, pointIndex) =>
          {
            const isSelected = answer === selected;
            return <button key={answer} type="button" role="radio" data-answer={answer} aria-checked={isSelected}
              aria-label={labels[answer]} disabled={disabled}
              tabIndex={isSelected || (selectedIndex < 0 && answer === 'NEUTRAL') ? 0 : -1}
              className={isSelected ? 'scale-point selected' : 'scale-point'}
              onClick={() => onSelect(answer)} onKeyDown={event => move(event, pointIndex)}>
              <span className="answer-strength" aria-hidden="true">
                {pointIndex === 2 ? <span className="answer-balanced" /> : [0, 1].map(strength =>
                  <span key={strength} className={strength < Math.abs(pointIndex - 2) ? 'strength-filled' : ''} />)}
              </span>
              <span className="scale-label" aria-hidden="true">{labels[answer]}</span>
              <span className="answer-selection" aria-hidden="true">{isSelected ? '✓' : ''}</span>
            </button>;
          })}
        </div>
      <p className="scale-current" aria-live="polite">{selected ? labels[selected] : ''}</p>
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
