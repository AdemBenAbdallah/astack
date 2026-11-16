// The kit passed to scenarios. Project settings come from demo.config.js (see templates/).
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HELPERS = fs.readFileSync(path.join(__dirname, 'helpers.js'), 'utf8');

// Find demo.config.js: walk up from `start`, then from the current folder.
function findConfig(start) {
    for (const from of [start, process.cwd()]) {
        let dir = path.resolve(from);
        while (true) {
            for (const f of ['demo.config.js', '.demo/demo.config.js']) {
                const p = path.join(dir, f);
                if (fs.existsSync(p)) return p;
            }
            const up = path.dirname(dir);
            if (up === dir) break;
            dir = up;
        }
    }
    return null;
}

// Use the project's puppeteer if it has one, else the skill's puppeteer-core + a local Chrome.
function loadPuppeteer(projectDir) {
    for (const name of ['puppeteer', 'puppeteer-core']) {
        for (const base of [projectDir, __dirname]) {
            try {
                return { lib: createRequire(path.join(base, 'x.js'))(name), full: name === 'puppeteer' };
            } catch {}
        }
    }
    throw new Error(`puppeteer not found. Run: npm install --prefix ${__dirname}`);
}

function findChrome() {
    const list = [
        process.env.CHROME_PATH,
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ];
    return list.find((p) => p && fs.existsSync(p));
}

function createKit(scenarioPath) {
    const configPath = findConfig(scenarioPath ? path.dirname(path.resolve(scenarioPath)) : process.cwd());
    const config = configPath ? require(configPath) : {};
    const root = configPath ? path.dirname(configPath) : process.cwd();
    const outDir = path.join(root, 'out');
    const { lib: puppeteer, full } = loadPuppeteer(root);

    const kit = {
        config,
        root,
        outDir,
        app: config.app || 'http://localhost:3000',
        sleep,

        async launch(viewport = {}) {
            const { width = 1280, height = 800 } = { ...config.viewport, ...viewport };
            const executablePath = config.chrome || (full ? undefined : findChrome());
            const browser = await puppeteer.launch({
                headless: true,
                executablePath,
                defaultViewport: { width, height },
                args: [`--window-size=${width},${height}`, ...(config.lang ? [`--lang=${config.lang}`] : [])]
            });
            const page = await browser.newPage();
            page.setDefaultTimeout(60000);
            await page.evaluateOnNewDocument(HELPERS);
            if (config.beforeLoad) await page.evaluateOnNewDocument(config.beforeLoad);
            return { browser, page };
        },

        // Log in as a user without the login form (see signIn in demo.config.js).
        async signInAs(page, user) {
            if (!config.signIn) throw new Error('signInAs: add signIn(page, user, kit) to demo.config.js');
            await config.signIn(page, user, kit);
        },

        // Open a route of the app and wait until a text is on screen.
        async go(page, route, readyText) {
            const url = /^[a-z]+:/.test(route) ? route : kit.app + route;
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            if (readyText) {
                await page.waitForFunction((t) => document.body && document.body.innerText.includes(t), { timeout: 60000 }, readyText);
            }
            await sleep(1000);
        },

        // Runs fn IN THE BROWSER (only window.__d and the DOM there; pass values as extra args).
        // Saves a screenshot per step, or FAIL-<name>.png when it throws.
        async step(page, name, fn, ...args) {
            const dir = path.join(outDir, 'shots');
            fs.mkdirSync(dir, { recursive: true });
            try {
                await page.evaluate(fn, ...args);
            } catch (e) {
                await page.screenshot({ path: path.join(dir, `FAIL-${name}.png`) });
                throw new Error(`step "${name}" failed: ${e.message}`);
            }
            await page.screenshot({ path: path.join(dir, `${name}.png`) });
        },

        // Call the backend to prepare data (see api in demo.config.js).
        async api(method, route, user, body) {
            if (!config.api) throw new Error('api: add api(method, route, user, body, kit) to demo.config.js');
            return config.api(method, route, user, body, kit);
        },

        // Turn a file (PDF first page, or PNG/JPG) into a data URL for d.showImage().
        imageOf(file) {
            const { execFileSync } = require('child_process');
            let png = file;
            if (file.endsWith('.pdf')) {
                const base = file.slice(0, -4);
                execFileSync('pdftoppm', ['-r', '80', '-png', '-f', '1', '-l', '1', '-singlefile', file, base]);
                png = `${base}.png`;
            }
            const type = png.endsWith('.jpg') || png.endsWith('.jpeg') ? 'jpeg' : 'png';
            return `data:image/${type};base64,${fs.readFileSync(png).toString('base64')}`;
        }
    };
    // Project extras (tokens, ids, db helpers...) become kit.<name>.
    Object.assign(kit, config.kit || {});
    return kit;
}

module.exports = { createKit };
