// Injected into every page as window.__d. Code inside kit.step() runs in the browser and uses these.
window.__d = {
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),

    // Caption band at the bottom. Second line is optional (e.g. a translation); RTL is detected.
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
            st.textContent = 'body{padding-bottom:80px!important}.MuiDialog-container{height:calc(100% - 80px)!important}';
            document.head.appendChild(st);
            document.body.appendChild(c);
        }
        const dir = (t) => (/[֐-ࣿ]/.test(t) ? 'rtl' : 'ltr');
        c.innerHTML =
            `<div dir="${dir(line1)}">${line1}</div>` +
            (line2 ? `<div dir="${dir(line2)}" style="font-weight:500;opacity:.88">${line2}</div>` : '');
    },

    // Full-screen title card (intro / outro). d.card(null) removes it.
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

    // Shows an image (data URL) over the page, scrolls it, then removes it. For PDFs, prints, emails.
    async showImage(src, line1, line2, ms = 9000) {
        const veil = document.createElement('div');
        veil.style.cssText =
            'position:fixed;inset:0;z-index:99990;background:rgba(15,23,42,.72);display:flex;justify-content:center;align-items:flex-start;overflow:hidden;padding-top:24px';
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width:min(640px,90vw);box-shadow:0 10px 40px rgba(0,0,0,.5);border-radius:6px;background:#fff;transition:transform 4s ease-in-out';
        veil.appendChild(img);
        document.body.appendChild(veil);
        if (line1) this.caption(line1, line2);
        await this.wait(ms / 2);
        img.style.transform = 'translateY(-240px)';
        await this.wait(ms / 2);
        veil.remove();
    },

    // React/Vue ignore el.value = x; this uses the native setter and fires the events.
    setVal(el, v) {
        const p = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(p, 'value').set.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    async type(el, text, ms = 28) {
        if (!el) throw new Error('type: element not found');
        el.scrollIntoView({ block: 'center' });
        el.focus();
        for (let i = 1; i <= text.length; i++) {
            this.setVal(el, text.slice(0, i));
            await this.wait(ms);
        }
        await this.wait(250);
    },

    mark(el, ms = 1400) {
        const o = el.style.outline;
        const oo = el.style.outlineOffset;
        el.style.outline = '3px solid #f59e0b';
        el.style.outlineOffset = '2px';
        setTimeout(() => {
            el.style.outline = o;
            el.style.outlineOffset = oo;
        }, ms);
    },
    async click(el, pause = 900) {
        if (!el) throw new Error('click: element not found');
        el.scrollIntoView({ block: 'center' });
        this.mark(el);
        await this.wait(pause);
        el.click();
        await this.wait(500);
    },
    flash(el, ms = 2500) {
        if (!el) throw new Error('flash: element not found');
        el.scrollIntoView({ block: 'center' });
        this.mark(el, ms);
    },

    // --- finding things by what the viewer sees ---
    text: (el) => (el.innerText || el.value || '').trim(),
    btn(text, root = document) {
        return [...root.querySelectorAll('button, a, [role=button], [role=tab], [role=menuitem], input[type=submit]')].find(
            (b) => this.text(b) === text || b.getAttribute('aria-label') === text
        );
    },
    lbl(el) {
        const l =
            el.closest('.MuiFormControl-root')?.querySelector('label') ||
            (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
            el.closest('label');
        const t = (l && l.innerText) || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || '';
        return t.replace(/\*/g, '').trim();
    },
    field(label, root = document, nth = 0) {
        return [...root.querySelectorAll('input, textarea, select')].filter(
            (i) => i.getAttribute('aria-hidden') !== 'true' && i.type !== 'hidden' && this.lbl(i) === label
        )[nth];
    },
    combo(label, root = document, nth = 0) {
        return [...root.querySelectorAll('[role=combobox], select')].filter((c) => this.lbl(c) === label)[nth];
    },
    // Picks an option in a native <select> or a custom dropdown (MUI, Radix, headless...), visibly.
    async pick(combo, option) {
        if (!combo) throw new Error(`pick: dropdown not found for "${option}"`);
        combo.scrollIntoView({ block: 'center' });
        this.mark(combo);
        await this.wait(600);
        if (combo.tagName === 'SELECT') {
            const o = [...combo.options].find((x) => x.text.trim() === option);
            if (!o) throw new Error(`pick: option "${option}" not found`);
            this.setVal(combo, o.value);
            await this.wait(500);
            return;
        }
        combo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
        combo.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
        await this.wait(400);
        if (!document.querySelector('[role=option]')) combo.click();
        const o = await this.until(() => [...document.querySelectorAll('[role=option]')].find((x) => x.innerText.trim() === option), 5000).catch(() => null);
        if (!o) throw new Error(`pick: option "${option}" not found`);
        o.style.background = '#fde68a';
        await this.wait(600);
        o.click();
        await this.wait(500);
    },
    async until(fn, ms = 15000) {
        const end = Date.now() + ms;
        while (Date.now() < end) {
            const v = fn();
            if (v) return v;
            await this.wait(200);
        }
        throw new Error('until: timed out');
    },
    dialog: () => document.querySelector('[role=dialog], dialog[open]'),
    row: (text, root = document) => [...root.querySelectorAll('tbody tr, [role=row]')].find((r) => r.innerText.includes(text)),
    has: (text) => document.body.innerText.includes(text)
};
