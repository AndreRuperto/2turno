import { describe, expect, it } from 'vitest';
import electionModel from '../../../backend/data/elections/brazil-2026.json';
import help from '../i18n/electionProposalHelp.json';

describe('ajudas das propostas dos planos', () =>
{
  it('cobrem exatamente as propostas do modelo, em português e inglês', () =>
  {
    const proposalIds = electionModel.proposals.map(proposal => proposal.id).sort();
    for (const language of ['pt', 'en'] as const)
    {
      expect(Object.keys(help[language]).sort()).toEqual(proposalIds);
      expect(Object.values(help[language]).every(text => text.trim().length > 20)).toBe(true);
    }
  });
});
