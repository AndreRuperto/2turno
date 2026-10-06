const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const profiles = require('../src/data/electionProfiles.generated.json');
const presentation = require('../src/utils/electionPresentation.cjs');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:5173';
const screenshotDirectory = join(__dirname, '../node_modules/.cache/election-browser');



async function checkLayout(page)
{
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, 'Page must fit the viewport');
}



async function checkHome(page, language, width)
{
    await page.setViewportSize({ width, height: 900 });
    const exampleResponse = page.waitForResponse(response => response.url().includes('/brazil-2026/compare?') && response.status() === 200);
    await page.goto(website + (language === 'en' ? '/en' : '/'));
    await page.locator('.home-options').waitFor();
    assert.equal(await page.locator('.home-hero-portraits img').count(), 2);
    assert.equal(await page.locator('.hero-versus').innerText(), 'VS');
    assert.equal(await page.locator('.hero-versus').evaluate(label => window.getComputedStyle(label).pointerEvents), 'none');
    for (const image of await page.locator('.home-hero-portraits img').all())
    {
        assert.ok(await image.evaluate(portrait => portrait.complete && portrait.naturalWidth > 0));
    }
    assert.equal(await page.locator('.home-options > article').count(), 3);
    assert.equal(await page.locator('select').count(), 0);
    const boxes = await page.locator('.home-options > article').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    if (width > 880) assert.ok(boxes.every(box => Math.abs(box.y - boxes[0].y) < 1));
    else assert.ok(boxes[0].y < boxes[1].y && boxes[1].y < boxes[2].y);
    for (const candidate of profiles.candidates)
    {
        const card = page.locator('.home-options [data-candidate="' + candidate.id + '"]');
        const expected = presentation.classificationLabels(candidate.scores, language);
        assert.equal(await card.locator('.ideology-header').getAttribute('data-family'), expected.family);
        assert.equal(await card.locator('.ideology-header h2').innerText(), expected.subtypeLabel);
        assert.ok(await card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0));
    }
    assert.equal(await page.locator('.political-family-card').count(), 5);
    assert.equal(await page.locator('.axis-explanation-card').count(), 12);
    for (const axis of profiles.axes[language])
    {
        const card = page.locator('.axis-explanation-card[data-axis="' + axis.id + '"]');
        assert.ok((await card.innerText()).includes(axis.label));
        assert.ok((await card.innerText()).includes(axis.leftPole));
        assert.ok((await card.innerText()).includes(axis.rightPole));
    }
    await page.locator('#exemplo .candidate-compatibility').first().waitFor();
    const example = await (await exampleResponse).json();
    assert.equal(example.scoringMethod, 'mean-absolute-distance-v1');
    assert.equal(example.axes.length, 12);
    for (const match of example.candidates)
    {
        const card = page.locator('#exemplo [data-candidate="' + match.id + '"]');
        assert.equal(await card.locator('.candidate-compatibility strong').innerText(), match.compatibility.toFixed(1) + '%');
        const family = await card.getAttribute('data-family');
        const indicatorColor = await page.locator('.political-family-card[data-family="' + family + '"] .family-indicator').evaluate(indicator => window.getComputedStyle(indicator).backgroundColor);
        const headerColor = await card.locator('.ideology-family').evaluate(label => window.getComputedStyle(label).color);
        assert.equal(headerColor, indicatorColor);
    }
    assert.equal(await page.locator('#example-profile .profile-axis').count(), 4);
    const spectrumBoxes = await page.locator('.political-family-card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    if (width < 650) assert.ok(spectrumBoxes[1].y > spectrumBoxes[0].y);
    else assert.ok(Math.abs(spectrumBoxes[1].y - spectrumBoxes[0].y) < 1);
    const information = page.locator('.home-options .candidate-info-button').first();
    await information.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.ok(await dialog.locator('h3').innerText());
    const close = dialog.locator('button').first();
    await close.focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'A');
    await page.keyboard.press('Tab');
    assert.ok(await close.evaluate(button => button === document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.ok(await information.evaluate(button => button === document.activeElement));
    await checkLayout(page);
    await page.screenshot({ path: join(screenshotDirectory, 'home-' + language + '-' + width + '.png'), fullPage: true });
    await page.locator('.home-hero').screenshot({ path: join(screenshotDirectory, 'hero-' + language + '-' + width + '.png') });
}



async function checkResults(page, language, answer, themeScore)
{
    await page.locator('.questionnaire-card button').click();
    await page.locator('input[value="short"]').check();
    await page.getByRole('button', { name: language === 'pt' ? 'Começar questionário' : 'Start questionnaire', exact: true }).click();
    // Avanço automático (ligado por padrão): a primeira resposta leva sozinha à pergunta 2.
    const toggle = page.locator('.auto-advance-toggle');
    assert.equal(await toggle.getAttribute('aria-checked'), 'true');
    await page.locator('[data-answer="' + answer + '"]').click();
    await page.getByText('2 / 36', { exact: true }).waitFor();
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-checked'), 'false');
    const questionBeforeSwitch = await page.locator('#scale-question-title').innerText();
    await page.locator('[data-answer="AGREE"]').click();
    await page.getByRole('link', { name: language === 'pt' ? 'English' : 'Português', exact: true }).click();
    await page.getByText('2 / 36', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-answer="AGREE"]').getAttribute('aria-checked'), 'true');
    assert.notEqual(await page.locator('#scale-question-title').innerText(), questionBeforeSwitch);
    await page.getByRole('link', { name: language === 'pt' ? 'Português' : 'English', exact: true }).click();
    await page.getByText('2 / 36', { exact: true }).waitFor();
    assert.equal(await page.locator('#scale-question-title').innerText(), questionBeforeSwitch);
    assert.equal(await page.locator('[data-answer="AGREE"]').getAttribute('aria-checked'), 'true');
    assert.equal(await page.getByRole('radio').count(), 5);
    for (const label of await page.locator('.scale-label').all())
    {
        assert.equal(await label.isVisible(), true);
        assert.ok((await label.innerText()).trim().length > 0);
    }
    await page.locator('[data-answer="NEUTRAL"]').focus();
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.locator('[data-answer="AGREE"]').getAttribute('aria-checked'), 'true');
    assert.equal(await page.locator('.scale-point.selected .answer-selection').innerText(), '✓');
    await page.locator('.scale-point.selected').hover();
    await page.waitForFunction(() =>
    {
        const selected = document.querySelector('.scale-point.selected');
        if (!selected) return false;
        const style = window.getComputedStyle(selected);
        return style.backgroundColor === style.borderTopColor && style.color === 'rgb(255, 255, 255)';
    });
    await checkLayout(page);
    await page.locator('.scale-question').screenshot({ path: join(screenshotDirectory, 'question-' + language + '-' + page.viewportSize().width + '.png') });
    for (let index = 1; index < 36; index += 1)
    {
        await page.locator('[data-answer="' + answer + '"]').click();
        if (index < 35) await page.getByRole('button', { name: language === 'pt' ? 'Próxima' : 'Next', exact: true }).click();
    }
    if (themeScore !== undefined)
    {
        const themedResult = await page.evaluate(async ({ score, identifiers, language }) =>
        {
            const response = await window.fetch('/api/elections/brazil-2026/compare?lang=' + language,
            {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId: 'brazil-presidential-2026-v2', scores: Object.fromEntries(identifiers.map(identifier => [identifier, score])) })
            });
            if (!response.ok) throw new Error('Cannot calculate theme verification profile');
            return response.json();
        }, { score: themeScore, identifiers: presentation.axisIdentifiers, language });
        await page.route('**/brazil-2026/results?*', route => route.fulfill({ json: themedResult }));
    }
    const resultResponse = page.waitForResponse(response => response.url().includes('/brazil-2026/results?') && response.status() === 200);
    await page.getByRole('button', { name: language === 'pt' ? 'Comparar respostas' : 'Compare answers', exact: true }).click();
    await page.locator('#seu-perfil').waitFor();
    const result = await (await resultResponse).json();
    const scores = Object.fromEntries(result.axes.map(entry => [entry.axis.id, entry.userScore]));
    const expected = presentation.classificationLabels(scores, language);
    if (themeScore !== undefined) assert.equal(expected.family, themeScore === 100 ? 'left' : 'right');
    assert.equal(await page.locator('body').getAttribute('data-political-family'), expected.family);
    assert.equal(await page.locator('body').evaluate(body => window.getComputedStyle(body).backgroundColor),
        await page.locator('#seu-perfil .ideology-header').evaluate(header => window.getComputedStyle(header).backgroundColor));
    const axisBoxes = await page.locator('#seu-perfil .profile-axis').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    if (page.viewportSize().width > 650) assert.ok(Math.abs(axisBoxes[0].y - axisBoxes[1].y) < 1);
    else assert.ok(axisBoxes[1].y > axisBoxes[0].y);
    assert.ok(axisBoxes.every(box => box.height < 280), 'Axis cards should stay compact');
    assert.equal(await page.locator('#seu-perfil .profile-axis').count(), 12);
    assert.equal(await page.locator('#seu-perfil .axis-explanation').count(), 12);
    assert.equal(await page.locator('.comparison-axis').count(), 12);
    assert.equal(await page.locator('.comparison-marker').count(), 36);
    assert.equal(await page.locator('.detailed-comparison').getAttribute('open'), null);
    assert.equal(await page.locator('.comparison-axis').first().isVisible(), false);
    const comparisonToggle = page.locator('.detailed-comparison > summary');
    await comparisonToggle.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.comparison-axis').first().isVisible(), true);
    await checkLayout(page);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.comparison-axis').first().isVisible(), false);
    assert.equal(await page.locator('#seu-perfil .ideology-header .profile-note').count(), 0);
    assert.equal(await page.locator('.candidate-compatibility').count(), 2);
    const percentages = await page.locator('#seu-perfil .axis-pole-labels').allTextContents();
    for (const label of percentages)
    {
        const values = [...label.matchAll(/(\d+)%/g)].map(match => Number(match[1]));
        assert.equal(values[0] + values[1], 100);
    }
    if (answer === 'NEUTRAL')
    {
        assert.equal(await page.locator('#seu-perfil .ideology-header').getAttribute('data-family'), 'centre');
        assert.equal(await page.locator('#seu-perfil .ideology-header').getAttribute('data-subtype'), 'balanced-centrism');
    }
    await checkLayout(page);
    await page.screenshot({ path: join(screenshotDirectory, 'results-' + language + '-' + page.viewportSize().width + '.png'), fullPage: true });
    const compatibilityBeforeSwitch = await page.locator('.candidate-compatibility strong').allTextContents();
    const axisLabelBeforeSwitch = await page.locator('#seu-perfil .profile-axis').first().innerText();
    await page.getByRole('link', { name: language === 'pt' ? 'English' : 'Português', exact: true }).click();
    await page.locator('#seu-perfil').waitFor();
    assert.deepEqual(await page.locator('.candidate-compatibility strong').allTextContents(), compatibilityBeforeSwitch);
    assert.notEqual(await page.locator('#seu-perfil .profile-axis').first().innerText(), axisLabelBeforeSwitch);
    await page.getByRole('link', { name: language === 'pt' ? 'Português' : 'English', exact: true }).click();
    await page.locator('#seu-perfil').waitFor();
    assert.deepEqual(await page.locator('.candidate-compatibility strong').allTextContents(), compatibilityBeforeSwitch);
    assert.equal(await page.locator('#seu-perfil .profile-axis').first().innerText(), axisLabelBeforeSwitch);
    await page.getByRole('button', { name: language === 'pt' ? 'Compartilhar resultado' : 'Share result', exact: true }).click();
    const preview = page.locator('.share-result-preview');
    await preview.waitFor();
    await preview.evaluate(image => image.decode());
    assert.equal(await preview.evaluate(image => image.naturalWidth), 1080);
    assert.equal(await preview.evaluate(image => image.naturalHeight), 1920);
    const downloadReady = page.waitForEvent('download');
    await page.getByRole('link', { name: language === 'pt' ? 'Baixar cartão' : 'Download card', exact: true }).click();
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), '2turno-result.png');
    await download.saveAs(join(screenshotDirectory, 'share-' + language + '-' + page.viewportSize().width + '.png'));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: language === 'pt' ? 'Começar novamente' : 'Start again', exact: true }).click();
    await page.locator('.home-options').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-political-family'), null);
    if (themeScore !== undefined) await page.unroute('**/brazil-2026/results?*');
}



async function checkCandidatePages(page, language)
{
    for (const candidate of profiles.candidates)
    {
        await page.goto(website + (language === 'en' ? '/en' : '') + '/candidatos/' + candidate.id);
        await page.locator('.candidate-page-header').waitFor();
        const expected = presentation.classificationLabels(candidate.scores, language);
        assert.equal(await page.locator('.ideology-header').getAttribute('data-family'), expected.family);
        assert.equal(await page.locator('.ideology-header h2').innerText(), expected.subtypeLabel);
        assert.equal(await page.locator('.axis-profile .profile-axis').count(), 12);
        assert.equal(await page.locator('tbody tr').count(), 12);
        assert.ok(await page.locator('.portrait').evaluate(image => image.complete && image.naturalWidth > 0));
        assert.ok((await page.locator('.running-mate').innerText()).includes(candidate.runningMate.name));
        assert.ok(await page.locator('tbody a[href*="#page="]').count() > 0);
        await checkLayout(page);
        await page.screenshot({ path: join(screenshotDirectory, candidate.id + '-' + language + '-' + page.viewportSize().width + '.png'), fullPage: true });
    }
}



async function checkMissingPortrait(browser)
{
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route('**/fotos/**', route => route.abort());
    await page.goto(website);
    await page.locator('.home-options .portrait-fallback').first().waitFor();
    assert.equal(await page.locator('.home-options .portrait-fallback').count(), 2);
    await page.goto(website + '/candidatos/lula-da-silva');
    await page.locator('.static-portrait-fallback').waitFor({ state: 'visible' });
    await checkLayout(page);
    await context.close();
}



async function checkUnavailableExample(browser)
{
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route('**/brazil-2026/compare?*', route => route.abort());
    await page.goto(website);
    const retry = page.locator('#exemplo button');
    await retry.waitFor();
    assert.equal(await page.locator('#exemplo .candidate-compatibility').count(), 0);
    assert.equal(await page.locator('#example-profile .profile-axis').count(), 4);
    await page.unroute('**/brazil-2026/compare?*');
    await retry.click();
    await page.locator('#exemplo .candidate-compatibility').first().waitFor();
    assert.equal(await page.locator('#exemplo .candidate-compatibility').count(), 2);
    await context.close();
}



async function main()
{
    mkdirSync(screenshotDirectory, { recursive: true });
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try
    {
        for (const language of ['pt', 'en'])
        {
            for (const width of [1280, 768, 390])
            {
                const context = await browser.newContext();
                const page = await context.newPage();
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await checkHome(page, language, width);
                await checkResults(page, language, width === 1280 ? 'NEUTRAL' : 'STRONGLY_AGREE', width === 768 ? (language === 'pt' ? 100 : 0) : undefined);
                await checkCandidatePages(page, language);
                assert.deepEqual(errors, []);
                await context.close();
                process.stdout.write(language + ' ' + width + ': home, quiz, user, comparisons and candidates passed.\n');
            }
        }
        await checkMissingPortrait(browser);
        process.stdout.write('Missing portrait fallbacks passed.\n');
        await checkUnavailableExample(browser);
        process.stdout.write('Unavailable example and retry passed.\n');
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
