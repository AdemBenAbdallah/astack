// Plan (~2-3 min):
//   1. intro   — title card, then the page where the feature lives
//   2. create  — the user fills the form and saves
//   3. result  — the new row appears, highlighted
//   4. outro
const USER = 1; // passed to signIn in demo.config.js

module.exports = {
    output: 'my-feature', // -> .demo/out/my-feature.mp4
    // viewport: { width: 412, height: 880 }, // phone
    startAs: { user: USER, route: '/items', readyText: 'Items' }, // first frame of the video

    // Make the data the video needs. Safe to run twice: look up before creating.
    async prepare(kit) {},

    scenes: {
        async intro(page, kit) {
            await kit.signInAs(page, USER);
            await kit.go(page, '/items', 'Items');
            await kit.step(page, 'intro', async () => {
                const d = window.__d;
                d.card('New: create items in one click', 'Feature demo');
                await d.wait(3000);
                d.card(null);
                d.caption('This is the items page');
                await d.wait(3000);
            });
        },

        async create(page, kit) {
            // Values from Node go in as extra arguments; the function itself runs in the browser.
            await kit.step(page, 'create', async (name) => {
                const d = window.__d;
                d.caption('Click "New item" and fill the form');
                await d.click(d.btn('New item'));
                const dlg = await d.until(() => d.dialog());
                await d.type(d.field('Name', dlg), name);
                await d.pick(d.combo('Category', dlg), 'Tools');
                await d.click(d.btn('Save', dlg));
                await d.until(() => !d.dialog());
            }, 'Hammer');
        },

        async result(page, kit) {
            await kit.step(page, 'result', async () => {
                const d = window.__d;
                d.flash(await d.until(() => d.row('Hammer')));
                d.caption('The new item is in the list');
                await d.wait(4000);
            });
        },

        async outro(page, kit) {
            await kit.step(page, 'outro', async () => {
                const d = window.__d;
                d.card('Create items in one click');
                await d.wait(3000);
            });
        }
    }
};
