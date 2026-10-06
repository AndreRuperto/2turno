import { describe, expect, it } from 'vitest';
import electionModel from '../../../backend/data/elections/brazil-2026.json';
import examples from '../i18n/electionQuestionExamples.json';

describe('exemplos das perguntas eleitorais', () =>
{
  it('cobrem exatamente as 72 perguntas, em português e inglês', () =>
  {
    const questionIds = electionModel.questions.map(question => question.id).sort();
    for (const language of ['pt', 'en'] as const)
    {
      expect(Object.keys(examples[language]).sort()).toEqual(questionIds);
      expect(Object.values(examples[language]).every(text => text.trim().length > 20)).toBe(true);
    }
  });
});
