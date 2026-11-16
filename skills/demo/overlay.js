// Inject with page.evaluateOnNewDocument(fs.readFileSync(this file)). Then in page.evaluate: const d = window.__d.
window.__d = {
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),

    // Caption band at the bottom. Optional second line (translation); RTL is detected.
    caption(line1, line2) {
        let c = document.getElementById('__cap');
        if (!c) {
            c = document.createElement('div');
            c.id = '__cap';
            c.style.cssText =
                'position:fixed;left:0;right:0;bottom:0;min-height:72px;display:flex;flex-direction:column;justify-content:center;' +
                'z-index:2147483647;background:#111827;color:#fff;font:600 17px system-ui,sans-serif;text-align:center;' +
                'pointer-events:none;line-height:1.45;padding:6px 16px;border-top:3px solid #84cc16';
            const st = document.createElement('style');
            st.textContent = 'body{padding-bottom:80px!important}';
            document.head.appendChild(st);
            document.body.appendChild(c);
        }
        const dir = (t) => (/[֐-ࣿ]/.test(t) ? 'rtl' : 'ltr');
        c.innerHTML =
            `<div dir="${dir(line1)}">${line1}</div>` +
            (line2 ? `<div dir="${dir(line2)}" style="font-weight:500;opacity:.88">${line2}</div>` : '');
    },

    // Full-screen title card for intro/outro. card(null) removes it.
    card(title, sub) {
        document.getElementById('__card')?.remove();
        if (!title) return;
        const el = document.createElement('div');
        el.id = '__card';
        el.style.cssText =
            'position:fixed;inset:0;z-index:2147483646;background:#0f172a;color:#fff;display:flex;flex-direction:column;' +
            'align-items:center;justify-content:center;gap:14px;font:700 40px system-ui,sans-serif;text-align:center;padding:40px';
        el.innerHTML = `<div>${title}</div>` + (sub ? `<div style="font:500 20px system-ui,sans-serif;opacity:.75">${sub}</div>` : '');
        document.body.appendChild(el);
    },

    // Orange outline so the viewer sees what is about to be clicked, or the result.
    flash(el, ms = 2500) {
        el.scrollIntoView({ block: 'center' });
        const [o, oo] = [el.style.outline, el.style.outlineOffset];
        el.style.outline = '3px solid #f59e0b';
        el.style.outlineOffset = '2px';
        setTimeout(() => Object.assign(el.style, { outline: o, outlineOffset: oo }), ms);
    },
    async click(el) {
        this.flash(el, 1400);
        await this.wait(900);
        el.click();
        await this.wait(500);
    },

    // Visible typing that React/Vue notice (they ignore el.value = x).
    async type(el, text, ms = 28) {
        el.scrollIntoView({ block: 'center' });
        el.focus();
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const set = Object.getOwnPropertyDescriptor(proto, 'value').set;
        for (let i = 1; i <= text.length; i++) {
            set.call(el, text.slice(0, i));
            el.dispatchEvent(new Event('input', { bubbles: true }));
            await this.wait(ms);
        }
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
};
