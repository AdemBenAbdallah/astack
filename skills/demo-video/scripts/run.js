// node run.js <scenario.js> [--record] [--only=scene1,scene2] [--no-prepare]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { createKit } = require('./kit');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const record = args.includes('--record');
const skipPrepare = args.includes('--no-prepare');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',') : null;

if (!file) {
    console.error('usage: node run.js <scenario.js> [--record] [--only=scene1,scene2] [--no-prepare]');
    process.exit(2);
}

(async () => {
    const kit = createKit(file);
    const scenario = require(path.resolve(file));
    const name = scenario.output || path.basename(file, '.js');
    fs.rmSync(path.join(kit.outDir, 'shots'), { recursive: true, force: true });
    fs.mkdirSync(kit.outDir, { recursive: true });

    if (scenario.prepare && !skipPrepare) {
        console.log('prepare');
        await scenario.prepare(kit);
    }

    const { browser, page } = await kit.launch(scenario.viewport || {});
    const webm = path.join(kit.outDir, `${name}.webm`);
    let recorder = null;
    const started = Date.now();
    try {
        if (record) {
            // Load the first page before recording starts, so the video does not open on a blank page.
            const s = scenario.startAs;
            if (s && s.user !== undefined) await kit.signInAs(page, s.user);
            if (s && s.route) await kit.go(page, s.route, s.readyText);
            recorder = await page.screencast({ path: webm });
        }
        for (const [scene, fn] of Object.entries(scenario.scenes)) {
            if (only && !only.includes(scene)) continue;
            console.log(`scene ${scene}`);
            await fn(page, kit);
        }
        console.log(`done in ${Math.round((Date.now() - started) / 1000)}s`);
    } catch (e) {
        console.error('FAILED', e.message);
        console.error(`screenshots: ${path.join(kit.outDir, 'shots')}`);
        process.exitCode = 1;
    } finally {
        if (recorder) await recorder.stop();
        await browser.close();
    }

    if (record && !process.exitCode) {
        const mp4 = path.join(kit.outDir, `${name}.mp4`);
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', mp4]);
        fs.rmSync(webm, { force: true });
        console.log(`video: ${mp4}`);
    }
})();
