const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:8080';
const screenshots = join(__dirname, '../node_modules/.cache/election-browser');



async function checkAccess(page)
{
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(report.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
}



async function main()
{
    mkdirSync(screenshots, { recursive: true });
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try
    {
        for (const language of ['pt', 'en'])
        {
            for (const width of [320, 768, 1280])
            {
                const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
                await context.addInitScript(() => localStorage.setItem('2turno-auto-advance', 'false'));
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.goto(website + (language === 'en' ? '/en' : '/'));
                await page.waitForLoadState('networkidle');
                const toggle = page.locator('.extremist-mode-toggle');
                assert.equal(await page.locator('.election-header .extremist-mode-toggle').count(), 1, 'The toggle lives in the header');
                await toggle.click();
                assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
                assert.equal(await page.locator('html').getAttribute('data-extremist-mode'), 'true');
                await page.locator('.extremist-hero img').evaluate(image => image.decode());
                assert.equal(await page.locator('.home-hero-portraits').count(), 0);
                assert.equal(await page.locator('.home-education').count(), 0);
                await checkAccess(page);
                await page.screenshot({ path: join(screenshots, 'extremist-home-' + language + '-' + width + '.png'), fullPage: true });
                const candidatePage = await context.newPage();
                await candidatePage.goto(website + (language === 'en' ? '/en' : '') + '/candidatos/lula-da-silva');
                assert.equal(await candidatePage.locator('html').getAttribute('data-extremist-mode'), 'true');
                await checkAccess(candidatePage);
                await candidatePage.close();
                await page.getByRole('link', { name: language === 'pt' ? 'Fazer o teste' : 'Take the test', exact: true }).click();
                await page.locator('.extremist-hero').waitFor();
                assert.equal(await page.locator('.format-options').count(), 0);
                const calls = [];
                page.on('request', request => { if (request.url().includes('/api/')) calls.push(request.url()); });
                await page.locator('.extremist-start-button').click();
                await page.getByText('1 / 40', { exact: true }).waitFor();
                assert.equal(await page.locator('.extremist-mode-toggle').count(), 0, 'The toggle is only offered on the home page');
                await checkAccess(page);
                await page.locator('[data-answer="NEUTRAL"]').click();
                await page.getByRole('link', { name: language === 'pt' ? 'English' : 'Português', exact: true }).click();
                await page.getByText('1 / 40', { exact: true }).waitFor();
                assert.equal(await page.locator('[data-answer="NEUTRAL"]').getAttribute('aria-checked'), 'true');
                await page.getByRole('link', { name: language === 'pt' ? 'Português' : 'English', exact: true }).click();
                await page.getByText('1 / 40', { exact: true }).waitFor();
                for (let index = 0; index < 40; index += 1)
                {
                    await page.locator('[data-answer="NEUTRAL"]').click();
                    if (index < 39) await page.getByRole('button', { name: language === 'pt' ? 'Próxima' : 'Next', exact: true }).click();
                }
                await page.getByRole('button', { name: language === 'pt' ? 'Ver meu perfil' : 'See my profile', exact: true }).click();
                await page.locator('#radical-profile').waitFor();
                assert.equal(await page.locator('#radical-profile .profile-axis').count(), 12);
                assert.equal(await page.locator('.radical-alignment .candidate-compatibility').count(), 2);
                assert.ok((await page.locator('.radical-alignment > h2').innerText()).includes('Flávio Bolsonaro'));
                assert.ok(calls.every(address => !/\/quiz|\/results|\/compare/.test(address)), 'Radical mode must not reuse candidate comparison API');
                assert.equal(await page.locator('.historical-comparison').getAttribute('open'), null);
                assert.equal(await page.locator('.historical-preview img').count(), 7);
                await page.locator('.historical-preview img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
                const biography = page.locator('.historical-preview .historical-info-button').first();
                await biography.click();
                assert.equal(await biography.getAttribute('aria-expanded'), 'true');
                assert.equal(await page.locator('.historical-preview .historical-biography').first().isVisible(), true);
                await checkAccess(page);
                await biography.press('Escape');
                assert.equal(await biography.getAttribute('aria-expanded'), 'false');
                await page.locator('.historical-comparison > summary').click();
                assert.equal(await page.locator('.historical-card').count(), 7);
                assert.equal(await page.locator('.historical-preview').isVisible(), false);
                await page.locator('.historical-card img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
                await page.locator('.historical-card .historical-info-button').first().click();
                assert.equal(await page.locator('.historical-card .historical-biography').first().isVisible(), true);
                await checkAccess(page);
                await page.locator('.historical-comparison > summary').click();
                await checkAccess(page);
                await page.screenshot({ path: join(screenshots, 'extremist-results-' + language + '-' + width + '.png'), fullPage: true });
                await page.getByRole('button', { name: language === 'pt' ? 'Sair do modo extremista' : 'Exit extremist mode', exact: true }).click();
                await page.locator('.home-hero-portraits').waitFor();
                assert.equal(await page.locator('html').getAttribute('data-extremist-mode'), null);
                assert.equal(await page.locator('.extremist-mode-toggle').getAttribute('aria-pressed'), 'false');
                assert.deepEqual(errors, []);
                await context.close();
                process.stdout.write(language + ' ' + width + ': dark mode, poster, 40 questions, languages, separate profile and exit passed.\n');
            }
        }
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
