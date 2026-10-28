const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const sharp = require('sharp');
const profiles = require('../src/data/electionProfiles.generated.json');
const alignment = require('../src/utils/electionAlignment.cjs');
const renderer = require('../src/utils/electionShareCard.cjs');
const translations = require('../src/i18n/electionShare.json');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:8088';
const directory = join(__dirname, '../node_modules/.cache/share-dashboard');



function comparisonFixture(language, profile)
{
    const axes = profiles.axes[language];
    const scores = profile === 'lula' ? profiles.candidates[0].scores : profile === 'flavio' ? profiles.candidates[1].scores
        : profile === 'developmentalism' ? Object.fromEntries(axes.map(axis => [axis.id, axis.id === 'direitos_sociais' || axis.id === 'laicidade' ? 50 : 65]))
        : Object.fromEntries(axes.map((axis, index) => [axis.id, profile === 'mixed' ? index % 2 ? 25 : 75 : 50]));
    const comparison = alignment.compareProfiles(scores, profiles.candidates, axes);
    return {
        modelId: 'brazil-presidential-2026-v2', asOf: '2026-10-05', scoringMethod: 'mean-absolute-distance-v1',
        axes: axes.map(axis => ({ axis, userScore: scores[axis.id], candidateScores: Object.fromEntries(profiles.candidates.map(candidate => [candidate.id, candidate.scores[axis.id]])) })),
        candidates: comparison.candidates, closestCandidateIds: comparison.closestCandidateIds, answeredQuestionCounts: {}
    };
}



async function exportCard(page, language, theme, name, comparison, missingPortraits)
{
    const copy = translations[language];
    await page.getByRole('button', { name: copy.interface.share, exact: true }).click();
    const preview = page.locator('.share-result-preview');
    await preview.waitFor();
    await preview.evaluate(image => image.decode());
    const details = await preview.evaluate(image =>
    {
        const canvas = window.shareCanvas;
        const header = document.querySelector('#seu-perfil .ideology-header');
        return {
            width: image.naturalWidth, height: image.naturalHeight, text: canvas.shareText,
            portraits: canvas.sharePortraits || [], url: image.src,
            profileBackground: getComputedStyle(header).backgroundColor,
            profileTitle: getComputedStyle(header.querySelector('h2')).color
        };
    });
    assert.equal(details.width, 2160);
    assert.equal(details.height, 3600);
    assert.ok(details.text.some(entry => entry.value === copy.axes));
    assert.ok(details.text.some(entry => entry.value === copy.disclaimer));
    assert.equal(details.portraits.length, missingPortraits ? 0 : 2);
    assert.ok(details.text.every(entry => entry.left >= 0 && entry.right <= 1080 && entry.vertical > 0 && entry.vertical < 1800), 'All text must fit within the exported image');
    for (const entry of renderer.shareSummary(comparison, language).axes)
    {
        const expected = entry.axis.label;
        const words = expected.split(' ');
        assert.ok(words.every(word => details.text.some(drawn => drawn.vertical >= 696 && drawn.vertical < 1284 && drawn.value.includes(word))), 'Translated axis missing: ' + expected);
    }
    const percentages = comparison.candidates.map(candidate => new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(candidate.compatibility) + '%');
    assert.ok(percentages.every(value => details.text.some(entry => entry.value === value)));
    const downloadReady = page.waitForEvent('download');
    await page.getByRole('link', { name: copy.interface.download, exact: true }).click();
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), '2turno-result.png');
    const filename = join(directory, name + '.png');
    await download.saveAs(filename);
    const metadata = await sharp(filename).metadata();
    assert.equal(metadata.format, 'png');
    const profileBackground = await sharp(filename).extract({ left: 100, top: 280, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
    const profileAccent = await sharp(filename).extract({ left: 124, top: 400, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
    assert.deepEqual([...profileBackground], details.profileBackground.match(/\d+/g).map(Number), 'Profile background must match the results page');
    assert.deepEqual([...profileAccent], details.profileTitle.match(/\d+/g).map(Number), 'Profile accent must match the results title');
    assert.equal(details.text.find(entry => entry.vertical === 225).color.toLowerCase(), '#' + Buffer.from(details.profileTitle.match(/\d+/g).map(Number)).toString('hex'), 'Exported title must use the actual profile title color');
    const pixel = await sharp(filename).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
    assert.equal('#' + pixel.toString('hex').toUpperCase(), renderer.themes[theme].background.toUpperCase());
    if (await page.getByRole('dialog').getByRole('button', { name: copy.interface.share, exact: true }).count())
    {
        await page.getByRole('dialog').getByRole('button', { name: copy.interface.share, exact: true }).click();
        assert.equal(await page.evaluate(() => window.lastSharedFile?.type), 'image/png');
        assert.equal(await page.evaluate(() => window.lastSharedFile?.name), '2turno-result.png');
    }
    const report = await new AxeBuilder({ page }).include('.share-result-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(report.violations.map(violation => violation.id), []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false);
    await page.keyboard.press('Escape');
    return details.url;
}



async function checkCase(browser, language, theme, width, profile = 'balanced', missingPortraits = false)
{
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === 'dark' ? 'light' : 'dark', reducedMotion: 'reduce' });
    const comparison = comparisonFixture(language, profile);
    await context.addInitScript(({ comparison, theme, nativeSharing }) =>
    {
        if (!localStorage.getItem('share-test-initialized'))
        {
            localStorage.setItem('2turno-theme', theme);
            localStorage.setItem('share-test-initialized', 'true');
            sessionStorage.setItem('2turno-language-progress', JSON.stringify({ variant: 'extended', choosingFormat: false, answers: {}, questionIndex: 0, questionIds: [], comparison, modeActive: false }));
        }
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => nativeSharing });
        Object.defineProperty(navigator, 'share', { configurable: true, value: nativeSharing ? async payload => { window.lastSharedFile = payload.files[0]; } : undefined });
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function(value, horizontal, vertical, ...rest)
        {
            if (this.canvas.width === 2160)
            {
                window.shareCanvas = this.canvas;
                this.canvas.shareText ||= [];
                const width = this.measureText(value).width;
                const left = this.textAlign === 'right' ? horizontal - width : horizontal;
                this.canvas.shareText.push({ value, vertical, left, right: left + width, font: this.font, color: this.fillStyle });
            }
            return fillText.call(this, value, horizontal, vertical, ...rest);
        };
        const drawImage = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function(image, ...coordinates)
        {
            if (this.canvas.width === 2160)
            {
                this.canvas.sharePortraits ||= [];
                this.canvas.sharePortraits.push(image.src);
            }
            return drawImage.call(this, image, ...coordinates);
        };
    }, { comparison, theme, nativeSharing: width < 700 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (missingPortraits) await page.route('**/fotos/*.jpg', route => route.abort());
    try
    {
        await page.goto(website + (language === 'pt' ? '/' : '/en'));
        await page.locator('#seu-perfil').waitFor();
        const name = language + '-' + theme + '-' + width + '-' + profile + (missingPortraits ? '-fallback' : '');
        const first = await exportCard(page, language, theme, name, comparison, missingPortraits);
        await page.locator('.theme-toggle').click();
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        await page.waitForFunction(expected => (document.documentElement.dataset.theme || 'dark') === expected, nextTheme);
        const second = await exportCard(page, language, nextTheme, name + '-theme-switch', comparison, missingPortraits);
        assert.notEqual(first, second, 'Theme changes must invalidate the previous image');
        if (profile === 'balanced')
        {
            await page.locator('.language-switch').click();
            await page.locator('#seu-perfil').waitFor();
            const nextLanguage = language === 'pt' ? 'en' : 'pt';
            await exportCard(page, nextLanguage, nextTheme, name + '-language-switch', comparison, missingPortraits);
        }
        assert.deepEqual(errors, []);
        process.stdout.write(name + ': PNG, current app theme/language, portraits, scores, download, sharing and accessibility passed.\n');
    }
    finally
    {
        await context.close();
    }
}



async function main()
{
    mkdirSync(directory, { recursive: true });
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try
    {
        for (const language of ['pt', 'en'])
            for (const theme of ['dark', 'light'])
                for (const width of [390, 1280]) await checkCase(browser, language, theme, width);
        await checkCase(browser, 'pt', 'dark', 390, 'developmentalism');
        await checkCase(browser, 'pt', 'dark', 390, 'lula');
        await checkCase(browser, 'en', 'light', 1280, 'flavio');
        await checkCase(browser, 'en', 'dark', 390, 'mixed', true);
    }
    finally
    {
        await browser.close();
    }
}

main().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
