const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');

const website = process.env.ELECTION_TEST_URL || 'http://127.0.0.1:5173';
const outputDirectory = join(__dirname, '../node_modules/.cache/election-browser');



async function auditPage(page, name)
{
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    writeFileSync(join(outputDirectory, name + '-accessibility.json'), JSON.stringify(report.violations, null, 2));
    return report.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
}



async function main()
{
    mkdirSync(outputDirectory, { recursive: true });
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try
    {
        const violations = [];
        for (const language of ['pt', 'en'])
        {
            for (const width of [320, 768, 1280])
            {
                const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
                const page = await context.newPage();
                const prefix = language === 'en' ? '/en' : '';
                for (const path of ['', '/candidatos/lula-da-silva', '/candidatos/flavio-bolsonaro', '/election-methodology'])
                {
                    await page.goto(website + prefix + (path || '/'));
                    await page.waitForLoadState('networkidle');
                    await page.addStyleTag({ content: 'html, body { overflow-x: visible !important; }' });
                    const name = (path.split('/').pop() || 'home') + '-' + language + '-' + width;
                    violations.push(...(await auditPage(page, name)).map(violation => ({ page: name, ...violation })));
                    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
                    assert.equal(overflow, false, name + ' must reflow');
                    if (!path)
                    {
                        await page.locator('.skip-link').focus();
                        assert.equal(await page.evaluate(() => document.activeElement?.className), 'skip-link');
                        await page.keyboard.press('Enter');
                        assert.equal(await page.evaluate(() => document.activeElement?.id), 'main-content');
                        await page.locator('.home-options .candidate-info-button').first().click();
                        await page.getByRole('dialog').waitFor();
                        violations.push(...(await auditPage(page, name + '-dialog')).map(violation => ({ page: name + '-dialog', ...violation })));
                        const bounds = await page.getByRole('dialog').boundingBox();
                        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 801, 'Dialog must fit height');
                        await page.keyboard.press('Escape');
                    }
                }
                await context.close();
                process.stdout.write(language + ' ' + width + ': navigation, reflow and dialog checked.\n');
            }
        }
        if (violations.length) process.stdout.write(JSON.stringify(violations, null, 2) + '\n');
        assert.equal(violations.length, 0, 'Accessibility violations');
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
