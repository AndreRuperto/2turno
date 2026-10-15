const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const profiles = require('../src/data/electionProfiles.generated.json');
const alignment = require('../src/utils/electionAlignment.cjs');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:8085';
const screenshots = join(__dirname, '../node_modules/.cache/result-themes');



function comparisonFixture(language)
{
    const axes = profiles.axes[language];
    const scores = Object.fromEntries(axes.map((axis, index) => [axis.id, index % 2 ? 50 : 75]));
    const result = alignment.compareProfiles(scores, profiles.candidates, axes);
    return {
        modelId: 'brazil-presidential-2026-v2', asOf: '2026-10-05', scoringMethod: 'mean-absolute-distance-v1',
        axes: axes.map(axis => ({ axis, userScore: scores[axis.id], candidateScores: Object.fromEntries(profiles.candidates.map(candidate => [candidate.id, candidate.scores[axis.id]])) })),
        candidates: result.candidates, closestCandidateIds: result.closestCandidateIds, answeredQuestionCounts: {},
        proposalAnswers: profiles.proposals[language].slice(0, 2).map(proposal => ({ questionId: proposal.id, answer: 'AGREE' }))
    };
}



async function checkAccessibility(page, selector)
{
    const report = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(report.violations.map(violation => ({
        id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
    })), []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, 'Page must reflow');
}



async function checkResults(browser, language, width, theme)
{
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ comparison, selectedTheme }) =>
    {
        if (!localStorage.getItem('2turno-theme')) localStorage.setItem('2turno-theme', selectedTheme);
        sessionStorage.setItem('2turno-language-progress', JSON.stringify({
            variant: 'extended', choosingFormat: false, answers: {}, questionIndex: 0,
            questionIds: [], comparison, modeActive: false
        }));
    }, { comparison: comparisonFixture(language), selectedTheme: theme });
    const page = await context.newPage();
    try
    {
        await page.goto(website + (language === 'pt' ? '/' : '/en'));
        await page.locator('.election-results .candidate-card').first().waitFor();
        const themeButton = page.locator('.theme-toggle');
        const themeButtonStyle = await themeButton.evaluate(element =>
        {
            const style = window.getComputedStyle(element);
            const icon = window.getComputedStyle(element.querySelector('svg'));
            return { background: style.backgroundColor, foreground: style.color, stroke: icon.stroke, width: element.getBoundingClientRect().width };
        });
        assert.equal(themeButtonStyle.background, theme === 'light' ? 'rgb(248, 250, 252)' : 'rgb(13, 26, 46)', 'Theme button must use the current surface');
        assert.equal(themeButtonStyle.foreground, theme === 'light' ? 'rgb(23, 27, 38)' : 'rgb(203, 213, 232)');
        assert.equal(themeButtonStyle.stroke, themeButtonStyle.foreground);
        assert.ok(themeButtonStyle.width >= 44);
        await themeButton.screenshot({ path: join(screenshots, 'theme-button-' + language + '-' + width + '-' + theme + '.png') });

        assert.equal(await page.locator('.election-results .candidate-card').count(), 2);
        assert.equal(await page.evaluate(() =>
            Boolean(document.querySelector('.election-results > .election-grid').compareDocumentPosition(document.querySelector('#seu-perfil')) & window.Node.DOCUMENT_POSITION_FOLLOWING)), true, 'Candidate cards must precede the user profile');
        const compatibilities = await page.locator('.election-results .candidate-compatibility strong').allTextContents();
        await page.locator('.detailed-comparison > summary').click();
        await page.locator('#seu-perfil .profile-method-note > summary').click();
        await page.locator('#seu-perfil .axis-guidance > summary').first().click();
        await page.locator('.plan-proposal-help').first().click();
        assert.equal(await page.locator('.plan-proposal input').count(), 0, 'Results must reuse quiz answers, not ask again');
        await checkAccessibility(page, '.election-results');
        const name = language + '-' + width + '-' + theme;
        await page.locator('.election-results > .election-grid').screenshot({ path: join(screenshots, 'candidates-' + name + '.png') });
        await page.locator('.detailed-comparison').screenshot({ path: join(screenshots, 'comparisons-' + name + '.png') });
        await page.locator('.plan-proposal').first().screenshot({ path: join(screenshots, 'proposal-' + name + '.png') });
        await page.locator('.theme-toggle').click();
        await page.waitForFunction(expected => (document.documentElement.dataset.theme || 'dark') === expected, theme === 'dark' ? 'light' : 'dark');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.deepEqual(await page.locator('.election-results .candidate-compatibility strong').allTextContents(), compatibilities, 'Switching themes must preserve results');
        await checkAccessibility(page, '.election-results');
        const candidatePage = await context.newPage();
        await candidatePage.goto(website + (language === 'pt' ? '' : '/en') + '/candidatos/lula-da-silva');
        assert.equal(await candidatePage.locator('html').getAttribute('data-theme'), theme === 'dark' ? 'light' : null, 'Candidate pages must retain the chosen theme');
        await checkAccessibility(candidatePage, 'main');
        process.stdout.write(name + ': candidates first, comparisons, proposals, theme switching and candidate profile passed.\n');
    }
    finally
    {
        await context.close();
    }
}



async function checkQuestionnaire(browser, theme)
{
    const context = await browser.newContext({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(selectedTheme =>
    {
        localStorage.setItem('2turno-theme', selectedTheme);
        localStorage.setItem('2turno-auto-advance', 'false');
    }, theme);
    try
    {
        const page = await context.newPage();
        await page.goto(website + '/#teste');
        await page.locator('.format-card-start').first().click();
        await page.locator('.scale-question').waitFor();
        await checkAccessibility(page, '.scale-question');
        for (const answer of ['STRONGLY_DISAGREE', 'DISAGREE', 'NEUTRAL', 'AGREE', 'STRONGLY_AGREE'])
        {
            await page.locator('[data-answer="' + answer + '"]').click();
            await page.locator('[data-answer="' + answer + '"]').hover();
            await checkAccessibility(page, '.scale-question');
        }
        process.stdout.write(theme + ': all answer options and selected states passed.\n');
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
        for (const theme of ['dark', 'light']) await checkQuestionnaire(browser, theme);
        for (const language of ['pt', 'en'])
            for (const width of [320, 1280])
                for (const theme of ['dark', 'light'])
                    await checkResults(browser, language, width, theme);
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

