// .demo/demo.config.js — the only project-specific file. Delete what you don't need.
module.exports = {
    app: 'http://localhost:3000', // base URL; routes in scenarios are added to it
    viewport: { width: 1280, height: 800 },
    // lang: 'ar',                 // browser language
    // chrome: '/usr/bin/chromium', // only if Chrome is not found automatically

    // Runs in every page before the app loads: localStorage, feature flags, theme...
    // beforeLoad: () => { localStorage.setItem('theme', 'light'); },

    // Log in WITHOUT the login form. `user` is whatever your scenarios pass (id, email, role name).
    // Usual ways: set the session cookie, or call the login API and copy the cookie / token.
    // async signIn(page, user, kit) {
    //     const res = await fetch('http://localhost:5000/auth/login', {
    //         method: 'POST', headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ email: user, password: 'demo1234' })
    //     });
    //     const token = (await res.json()).token;
    //     await page.setCookie({ name: 'session', value: token, domain: 'localhost', path: '/' });
    // },

    // Call the backend to prepare data in prepare(kit). Return parsed JSON, throw on error.
    // async api(method, route, user, body, kit) {
    //     const res = await fetch('http://localhost:5000' + route, {
    //         method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body)
    //     });
    //     if (!res.ok) throw new Error(`${method} ${route} -> ${res.status} ${await res.text()}`);
    //     return res.json();
    // },

    // Extra things scenarios can use as kit.<name> (ids, a db helper...).
    // kit: { ADMIN: 1 },
};
