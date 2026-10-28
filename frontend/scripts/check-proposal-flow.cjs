const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const profiles = require('../src/data/electionProfiles.generated.json');
const rules = require('../src/utils/electionProposals.cjs');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:8086';
const screenshots = join(__dirname, '../node_modules/.cache/proposal-flow');



async function checkFlow(browser, language, total, width, theme)
{
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(selectedTheme =>
    {
        localStorage.setItem('2turno-auto-advance', 'false');
        localStorage.setItem('2turno-theme', selectedTheme);
    }, theme);
    const page = await context.newPage();
    const recorded = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try
    {
        await page.goto(website + (language === 'pt' ? '/#teste' : '/en#teste'));
        if (total === 40)
        {
            await page.locator('.extremist-mode-toggle').click();
            await page.locator('.extremist-start-button').click();
        }
        else await page.locator('.format-card-start').nth(total === 36 ? 0 : total === 60 ? 1 : 2).click();
        const proposals = profiles.proposals[language];
        let testedPersistence = false;
        for (let index = 0; index < total; index += 1)
        {
            await page.waitForFunction(expected => document.querySelector('.scale-question-count')?.textContent === expected, (index + 1) + ' / ' + total);
            const question = page.locator('.scale-question');
            const questionText = await question.locator('h2').innerText();
            const proposal = proposals.find(entry => entry.text === questionText);
            assert.equal(await question.locator('[data-proposal], a').count(), 0, 'Quiz must not reveal plan attribution');
            assert.ok(!/Lula|Bolsonaro|proponente/i.test(questionText));
            const answer = proposal ? ['DISAGREE', 'AGREE', 'NEUTRAL', 'STRONGLY_DISAGREE'][recorded.length % 4] : 'NEUTRAL';
            await page.locator('[data-answer="' + answer + '"]').click();
            if (proposal)
            {
                recorded.push({ proposal, answer, index });
                if (!testedPersistence)
                {
                    await page.reload();
                    await page.locator('.resume-continue').click();
                    await page.waitForFunction(expected => document.querySelector('.scale-question-title, #scale-question-title')?.textContent === expected, questionText);
                    assert.equal(await page.locator('[data-answer="' + answer + '"]').getAttribute('aria-checked'), 'true');
                    await page.locator('.language-switch').click();
                    await page.waitForFunction(expected => document.querySelector('.scale-question-count')?.textContent === expected, (index + 1) + ' / ' + total);
                    assert.equal(await page.locator('[data-answer="' + answer + '"]').getAttribute('aria-checked'), 'true');
                    await page.locator('.language-switch').click();
                    await page.waitForFunction(expected => document.querySelector('.scale-question-count')?.textContent === expected, (index + 1) + ' / ' + total);
                    assert.equal(await question.locator('h2').innerText(), questionText);
                    testedPersistence = true;
                }
            }
            const next = index < total - 1 ? (language === 'pt' ? 'Próxima' : 'Next')
                : total === 40 ? (language === 'pt' ? 'Ver meu perfil' : 'See my profile')
                : (language === 'pt' ? 'Comparar respostas' : 'Compare answers');
            await page.getByRole('button', { name: next, exact: true }).click();
        }
        await page.locator('.plan-proposals').waitFor();
        const quota = total === 36 ? 2 : total === 40 ? 4 : 8;
        assert.equal(recorded.length, quota);
        assert.equal(await page.locator('.plan-proposal').count(), quota);
        assert.equal(await page.locator('.plan-proposal input, .plan-proposal [role="radiogroup"]').count(), 0, 'Results cannot ask again');
        for (const { proposal, answer } of recorded)
        {
            const card = page.locator('[data-proposal="' + proposal.id + '"]');
            const candidate = profiles.candidates.find(entry => entry.id === proposal.proponentId);
            assert.ok((await card.innerText()).includes(candidate.name));
            assert.equal(await card.locator('.plan-proposal-reveal').getAttribute('data-verdict'), rules.proposalVerdict(answer));
            assert.equal(await card.locator('a').getAttribute('href'), proposal.sourceUrl + '#page=' + rules.firstPage(proposal.sourceLocator));
        }
        const axes = page.locator(total === 40 ? '#radical-profile .axis-pole-labels' : '#seu-perfil .axis-pole-labels');
        assert.ok((await axes.allInnerTexts()).every(value => value.includes('50%')), 'Proposal responses cannot change neutral compatibility axes');
        const report = await new AxeBuilder({ page }).include('.plan-proposals').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        assert.deepEqual(report.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) })), []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false);
        await page.locator('.plan-proposals').screenshot({ path: join(screenshots, language + '-' + total + '-' + theme + '.png') });
        assert.deepEqual(errors, []);
        process.stdout.write(language + ' ' + total + ': fixed total, proposal quota, hidden attribution, resume, translation and cited results passed.\n');
    }
    finally
    {
        await context.close();
    }
}



async function main()
{
    mkdirSync(screenshots, { recursive: true });
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try
    {
        for (const language of ['pt', 'en'])
            for (const total of [36, 40, 60, 72])
                await checkFlow(browser, language, total, language === 'pt' ? 320 : 1280, language === 'pt' ? 'dark' : 'light');
    }
    finally
    {
        await browser.close();
    }
}



main().catch(error =>
{
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
});

