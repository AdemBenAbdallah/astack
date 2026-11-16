// node peek.js <route> [user] [--click="text>>next text"]
// Prints what a page shows (tabs, buttons, fields, dropdowns, table) as text. Cheaper than screenshots.
const fs = require('fs');
const path = require('path');
const { createKit } = require('./kit');

const argv = process.argv.slice(2);
const [route, user] = argv.filter((a) => !a.startsWith('--'));
const clickArg = argv.find((a) => a.startsWith('--click='));
const clicks = clickArg ? clickArg.slice(8).split('>>') : [];

if (!route) {
    console.error('usage: node peek.js <route> [user] [--click="text1>>text2"]');
    process.exit(2);
}

(async () => {
    const kit = createKit();
    const { browser, page } = await kit.launch();
    try {
        if (user !== undefined && kit.config.signIn) await kit.signInAs(page, user);
        await kit.go(page, route);
        await kit.sleep(2500);
        for (const text of clicks) {
            await page.evaluate(async (t) => {
                const d = window.__d;
                const el = await d.until(() => d.btn(t) || d.row(t));
                el.click();
                await d.wait(1500);
            }, text.trim());
        }
        const info = await page.evaluate(() => {
            const d = window.__d;
            const root = d.dialog() || document.querySelector('main') || document.body;
            const visible = (el) => el.getClientRects().length > 0;
            const uniq = (list) => [...new Set(list.filter(Boolean))];
            const all = (sel) => [...root.querySelectorAll(sel)].filter(visible);
            return {
                url: location.href,
                dialogOpen: Boolean(d.dialog()),
                tabs: uniq(all('[role=tab]').map((t) => t.innerText.trim())),
                buttons: uniq(all('button, [role=button], input[type=submit]').map((b) => d.text(b) || b.getAttribute('aria-label'))),
                links: uniq(all('a[href]').map((a) => a.innerText.trim())).slice(0, 30),
                textFields: uniq(
                    all('input, textarea')
                        .filter((i) => i.type !== 'hidden' && i.type !== 'checkbox' && i.type !== 'radio' && i.getAttribute('aria-hidden') !== 'true' && i.getAttribute('role') !== 'combobox')
                        .map((i) => `${d.lbl(i) || '(no label)'} [${i.type || i.tagName.toLowerCase()}]`)
                ),
                dropdowns: uniq(all('[role=combobox], select').map((c) => `${d.lbl(c) || '(no label)'} = "${c.tagName === 'SELECT' ? c.selectedOptions[0]?.text || '' : c.innerText.trim()}"`)),
                checkboxes: uniq(all('input[type=checkbox], input[type=radio], [role=switch]').map((c) => d.lbl(c) || c.closest('label')?.innerText.trim())),
                tableHeader: [...root.querySelectorAll('thead th')].map((t) => t.innerText.trim()).join(' | '),
                firstRows: [...root.querySelectorAll('tbody tr')].slice(0, 5).map((r) => r.innerText.replace(/\s+/g, ' ').slice(0, 200)),
                text: (root.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 1500)
            };
        });
        console.log(JSON.stringify(info, null, 2));
        const shot = path.join(kit.outDir, 'peek.png');
        fs.mkdirSync(kit.outDir, { recursive: true });
        await page.screenshot({ path: shot });
        console.log(`screenshot (open only if needed): ${shot}`);
    } finally {
        await browser.close();
    }
})();
