import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import electionModel from '../../../backend/data/elections/brazil-2026.json';

const require = createRequire(import.meta.url);
const { shuffleProposals, proposalVerdict, firstPage } = require('./electionProposals.cjs');

describe('propostas dos planos', () =>
{
  it('embaralha uma cópia com os mesmos oito itens, sem alterar a lista original', () =>
  {
    const original = electionModel.proposals;
    const before = original.map(proposal => proposal.id);
    const shuffled = shuffleProposals(original);
    expect(shuffled).toHaveLength(8);
    expect(shuffled).not.toBe(original);
    expect(shuffled.map((proposal: { id: string }) => proposal.id).sort()).toEqual([...before].sort());
    expect(original.map(proposal => proposal.id)).toEqual(before);
  });

  it('é determinístico com um random fixo (Fisher–Yates)', () =>
  {
    expect(shuffleProposals(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a']);
    expect(shuffleProposals(['a', 'b', 'c', 'd'], () => 0.999)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('dá o veredito pela direção da resposta, sem distinguir intensidade', () =>
  {
    expect(proposalVerdict('STRONGLY_AGREE')).toBe('agree');
    expect(proposalVerdict('AGREE')).toBe('agree');
    expect(proposalVerdict('NEUTRAL')).toBe('neutral');
    expect(proposalVerdict('DISAGREE')).toBe('disagree');
    expect(proposalVerdict('STRONGLY_DISAGREE')).toBe('disagree');
    expect(() => proposalVerdict('MAYBE')).toThrow();
  });

  it('lê a primeira página do locator da fonte', () =>
  {
    expect(firstPage('p. 35')).toBe(35);
    expect(firstPage('pp. 49–50')).toBe(49);
    expect(firstPage('seção 3')).toBeNull();
    expect(firstPage('')).toBeNull();
  });
});
