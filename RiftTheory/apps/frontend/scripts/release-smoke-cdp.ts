// Local production-preview smoke helper. Never connects to a remote browser.
export {};
const mode = process.argv[2] ?? "inspect";
const native = mode.startsWith("native");
const endpoint = native ? "http://127.0.0.1:9225" : mode.startsWith("offline-fresh") ?
    "http://127.0.0.1:9226" : "http://127.0.0.1:9224";
const tabs = await (await fetch(`${endpoint}/json/list`)).json() as Array<{
    type: string; url: string; webSocketDebuggerUrl: string;
}>;
const target = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(native ? "https://tauri.localhost/" :
    mode === "offline-fresh" ? "about:blank" : "http://127.0.0.1:3011/"));
if (!target) throw new Error("Local production preview tab is unavailable");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise<void>((resolve, reject) => {
    socket.onopen = () => resolve();
    socket.onerror = () => reject(new Error("CDP connection failed"));
});
let sequence = 0;
const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) {
        if ((mode === "offline-fresh-diagnostic" || mode === "browser-console") && (message.method === "Runtime.consoleAPICalled" || message.method === "Runtime.exceptionThrown"))
            console.log(JSON.stringify({method:message.method, args:message.params?.args?.map((arg:any)=>arg.value ?? arg.description), exception:message.params?.exceptionDetails?.exception?.description}));
        return;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
};
function send(method: string, params: Record<string, unknown> = {}) {
    const id = ++sequence;
    return new Promise<any>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
    });
}
async function evaluate(expression: string) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
}
await send("Runtime.enable");
if (mode === "browser-diagnostic") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Draft')?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(JSON.stringify(await evaluate(`({search:document.querySelector('#draftTableSearch')?.outerHTML,rows:Array.from(document.querySelectorAll('tbody tr,[role="row"]')).slice(0,5).map(r=>r.outerHTML.slice(0,800)),tables:document.querySelectorAll('table').length,text:document.body.innerText.slice(-900)})`),null,2));
    socket.close(); process.exit(0);
}
if (mode === "browser-state") {
    console.log(JSON.stringify(await evaluate(`({ready:document.readyState,root:document.querySelector('#root')?.innerHTML.slice(0,1500),scripts:Array.from(document.scripts).map(s=>s.src),body:document.body.innerText.slice(0,700)})`),null,2));
    socket.close(); process.exit(0);
}
if (mode === "native-storage") {
    console.log(JSON.stringify(await evaluate(`({saved:localStorage.getItem('rifttheory.manual-draft.v1'),origin:location.origin,body:document.body.innerText.slice(0,500)})`),null,2));
    socket.close(); process.exit(0);
}
if (mode === "native-sentinel") {
    console.log(JSON.stringify(await evaluate(`(() => { localStorage.setItem('rifttheory.install-smoke-20261001','preserve-local-data'); return {sentinel:localStorage.getItem('rifttheory.install-smoke-20261001'),draft:localStorage.getItem('rifttheory.manual-draft.v1')}; })()`),null,2));
    socket.close(); process.exit(0);
}
if (mode === "native-sentinel-read") {
    console.log(JSON.stringify(await evaluate(`({sentinel:localStorage.getItem('rifttheory.install-smoke-20261001'),draft:localStorage.getItem('rifttheory.manual-draft.v1')})`),null,2));
    socket.close(); process.exit(0);
}
if (mode === "native-sentinel-clear") {
    console.log(JSON.stringify(await evaluate(`(() => { localStorage.removeItem('rifttheory.install-smoke-20261001'); return localStorage.getItem('rifttheory.install-smoke-20261001'); })()`),null,2));
    socket.close(); process.exit(0);
}
if (mode === "browser-console") {
    await send("Page.enable");
    await send("Page.reload", { ignoreCache: true });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log(JSON.stringify(await evaluate(`({body:document.body.innerText.slice(0,500),root:!!document.querySelector('#root')})`)));
    socket.close(); process.exit(0);
}
if (mode === "browser-ux") {
    await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 850, deviceScaleFactor: 1, mobile: false });
    await send("Page.reload");
    const click = (label: string) => evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()===${JSON.stringify(label)} && !b.disabled)?.click()`);
    const waitFor = async (expression: string) => {
        for (let attempt = 0; attempt < 40; attempt++) {
            if (await evaluate(expression)) return;
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        throw new Error(`Timed out: ${expression}`);
    };
    await click("Draft");
    await waitFor(`!!document.querySelector('#draftTableSearch')`);
    await click("Reset draft");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const pick = await evaluate(`(() => {
        const input=document.querySelector('#draftTableSearch');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Ashe');
        input.dispatchEvent(new Event('input',{bubbles:true}));
        const row=Array.from(document.querySelectorAll('tbody tr')).find(row=>row.querySelector('img[alt="Ashe"]') && row.querySelector('[aria-label="Bot"]'));
        if (!row) return 'row missing'; row.click(); return 'picked';
    })()`);
    await click("Strategy");
    await waitFor(`!!document.querySelector('.strategy-workspace')`);
    const before = await evaluate(`({pick:${JSON.stringify(pick)},saved:localStorage.getItem('rifttheory.manual-draft.v1'),undo:!!Array.from(document.querySelectorAll('.strategy-header-actions button')).find(b=>b.textContent?.trim()==='Undo'&&!b.disabled)})`);
    await click("Undo");
    const undone = await evaluate(`({saved:localStorage.getItem('rifttheory.manual-draft.v1'),redo:!!Array.from(document.querySelectorAll('.strategy-header-actions button')).find(b=>b.textContent?.trim()==='Redo'&&!b.disabled),buttons:Array.from(document.querySelectorAll('.strategy-header-actions button')).map(b=>b.outerHTML.slice(0,200)),text:document.body.innerText.slice(0,350),strategy:!!document.querySelector('.strategy-workspace')})`);
    if (!undone.strategy || !undone.redo) throw new Error(`Strategy disappeared during Undo: ${JSON.stringify(undone)}`);
    await click("Redo");
    await send("Page.reload");
    await waitFor(`!!document.querySelector('#draftTableSearch')`);
    const restored = await evaluate(`({draftText:document.body.innerText.slice(0,350),saved:localStorage.getItem('rifttheory.manual-draft.v1')})`);
    await send("Emulation.setDeviceMetricsOverride", { width: 430, height: 850, deviceScaleFactor: 1, mobile: false });
    await click("Strategy");
    await waitFor(`!!document.querySelector('.strategy-workspace')`);
    const narrow = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,decision:!!document.querySelector('[aria-label="Current draft decision"]'),compare:Array.from(document.querySelectorAll('[aria-label="Current draft decision"] button')).map(b=>b.textContent?.trim()),status:document.querySelector('.strategy-decision-evidence')?.textContent?.trim()})`);
    const opened = await evaluate(`(() => { const button=Array.from(document.querySelectorAll('[aria-label="Current draft decision"] button')).find(b=>b.textContent?.trim().startsWith('Try ') && b.getBoundingClientRect().width); button?.click(); return !!button; })()`);
    await waitFor(`!!Array.from(document.querySelectorAll('.strategy-preview')).find(e=>e.getBoundingClientRect().width)`);
    const comparison = await evaluate(`({open:!!document.querySelector('.strategy-preview'),focus:document.activeElement?.className,scroll:document.documentElement.scrollWidth})`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Close comparison' && b.getBoundingClientRect().width)?.click()`);
    const closed = await evaluate(`({open:!!document.querySelector('.strategy-preview'),focus:document.activeElement?.textContent?.trim(),scroll:document.documentElement.scrollWidth})`);
    if (narrow.scroll > narrow.width || !opened || !comparison.open || closed.open || !closed.focus?.startsWith('Try ')) throw new Error('Narrow Strategy comparison failed');
    await evaluate(`localStorage.setItem('rifttheory.manual-draft.v1','{broken')`);
    await send("Page.reload");
    await waitFor(`!!document.querySelector('#draftTableSearch')`);
    const corrupt = await evaluate(`({text:document.body.innerText.slice(0,380),saved:localStorage.getItem('rifttheory.manual-draft.v1')})`);
    if (!corrupt.text.includes('Next pick: B1') || corrupt.saved !== '{broken') throw new Error('Corrupt manual draft fallback failed');
    console.log(JSON.stringify({before,undone,restored,narrow,comparison,closed,corrupt}, null, 2));
    socket.close(); process.exit(0);
}
if (mode === "eval" || mode === "native-eval") {
    console.log(JSON.stringify(await evaluate(process.argv[3] ?? "null"), null, 2));
    socket.close();
    process.exit(0);
}
if (mode === "native-dom") {
    console.log(JSON.stringify(await evaluate(`Array.from(document.querySelectorAll('tr,[role=row]')).slice(0,8).map(e=>({tag:e.tagName,text:e.textContent?.slice(0,100),html:e.outerHTML.slice(0,400)}))`), null, 2));
    socket.close();
    process.exit(0);
}
if (mode === "native-fill" || mode === "native-sequence") {
    const win = await send("Browser.getWindowForTarget");
    await send("Browser.setWindowBounds", { windowId: win.windowId,
        bounds: { left: win.bounds.left, top: win.bounds.top, width: 1600, height: 850, windowState: "normal" } });
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Draft')?.click()`);
    if (mode === "native-sequence") {
        await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Reset draft')?.click()`);
    }
    const picks = [
        ["Ashe", "Bot"], ["Vi", "Jungle"], ["Janna", "Support"],
        ["Poppy", "Top"], ["Anivia", "Mid"], ["Ahri", "Mid"],
        ["Aphelios", "Bot"], ["Ivern", "Jungle"], ["Bard", "Support"],
    ];
    for (const [index, [champion, role]] of picks.entries()) {
        if (mode === "native-sequence" && (index === 4 || index === 5)) {
            await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Strategy')?.click()`);
            await new Promise((resolve) => setTimeout(resolve, 500));
            const label = index === 4 ? "B3" : "R3";
            console.log(`${label}: ${JSON.stringify(await evaluate(`document.body.innerText.slice(0,1750)`))}`);
            await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Draft')?.click()`);
        }
        const result = await evaluate(`(() => {
            const input = document.querySelector('#draftTableSearch');
            if (!input) return 'search missing';
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(champion)});
            input.dispatchEvent(new Event('input', {bubbles:true}));
            const row = Array.from(document.querySelectorAll('tbody tr')).find(row =>
                row.querySelector('img[alt=${JSON.stringify(champion)}]') &&
                row.querySelector('[aria-label=${JSON.stringify(role)}]'));
            if (!row) return 'row missing';
            row.click();
            return 'picked';
        })()`);
        console.log(`${champion} · ${role}: ${result}`);
        if (result !== "picked") break;
        await new Promise((resolve) => setTimeout(resolve, 120));
    }
    console.log(JSON.stringify(await evaluate(`document.body.innerText.slice(0,420)`)));
    socket.close();
    process.exit(0);
}
if (mode === "native-r5") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Strategy')?.click()`);
    const win = await send("Browser.getWindowForTarget");
    await send("Browser.setWindowBounds", { windowId: win.windowId,
        bounds: { left: win.bounds.left, top: win.bounds.top, width: 430, height: 850, windowState: "normal" } });
    await new Promise((resolve) => setTimeout(resolve, 1300));
    console.log(JSON.stringify(await evaluate(`({ viewport: innerWidth, outer: outerWidth, scroll: document.documentElement.scrollWidth,
        decision: document.body.innerText.slice(0,2000), hasR5: document.body.innerText.includes('CURRENT SLOT · BOUNDED RESPONSE SEARCH'),
        draftComplete: document.body.innerText.includes('Draft complete'), inspect: Array.from(document.querySelectorAll('button')).some(b=>b.textContent?.includes('Inspect this line')) })`), null, 2));
    socket.close();
    process.exit(0);
}
if (mode === "native-new-ux") {
    const before = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,decision:!!document.querySelector('[aria-label="Current draft decision"]'),actions:Array.from(document.querySelectorAll('[aria-label="Current draft decision"] button')).filter(b=>b.getBoundingClientRect().width).map(b=>b.textContent?.trim())})`);
    await evaluate(`Array.from(document.querySelectorAll('[aria-label="Current draft decision"] button')).find(b=>b.textContent?.trim().startsWith('Try ')&&b.getBoundingClientRect().width)?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    const opened = await evaluate(`({preview:!!document.querySelector('.strategy-preview'),focus:document.activeElement?.className,scroll:document.documentElement.scrollWidth})`);
    await evaluate(`Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty')&&s.getBoundingClientRect().width)?.focus()`);
    await send("Page.bringToFront");
    await send("Input.dispatchKeyEvent", { type:"rawKeyDown", key:"Enter", code:"Enter", windowsVirtualKeyCode:13, nativeVirtualKeyCode:13 });
    await send("Input.dispatchKeyEvent", { type:"char", text:"\r", unmodifiedText:"\r", key:"Enter", code:"Enter", windowsVirtualKeyCode:13 });
    await send("Input.dispatchKeyEvent", { type:"keyUp", key:"Enter", code:"Enter", windowsVirtualKeyCode:13, nativeVirtualKeyCode:13 });
    const details = await evaluate(`({open:Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty')&&s.getBoundingClientRect().width)?.parentElement.open,focus:document.activeElement?.tagName})`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Close comparison'&&b.getBoundingClientRect().width)?.click()`);
    const closed = await evaluate(`({preview:!!document.querySelector('.strategy-preview'),focus:document.activeElement?.textContent?.trim(),scroll:document.documentElement.scrollWidth})`);
    console.log(JSON.stringify({before,opened,details,closed},null,2));
    if (before.width!==430 || before.scroll>430 || !opened.preview || !details.open || closed.preview || !closed.focus?.startsWith('Try ')) throw new Error('Native narrow Strategy interaction failed');
    socket.close(); process.exit(0);
}
if (mode === "native-live-ready") {
    let state: any;
    for (let attempt=0; attempt<40; attempt++) {
        state=await evaluate(`({text:document.body.innerText.slice(0,1100),scroll:document.documentElement.scrollWidth,width:innerWidth})`);
        if (!state.text.includes('Loading Live Draft')) break;
        await new Promise((resolve)=>setTimeout(resolve,200));
    }
    console.log(JSON.stringify(state,null,2));
    if (state.text.includes('Loading Live Draft') || state.scroll>state.width || !state.text.includes('Live Draft')) throw new Error('Installed Live Draft did not load');
    socket.close(); process.exit(0);
}
if (mode === "native-interact") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('Inspect this line') && b.getBoundingClientRect().width>0)?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const opened = await evaluate(`({close: Array.from(document.querySelectorAll('button')).some(b=>b.textContent?.includes('Close comparison') && b.getBoundingClientRect().width>0), focus: document.activeElement?.outerHTML.slice(0,180), width:document.documentElement.scrollWidth, viewport:innerWidth})`);
    const details = await evaluate(`(() => { const summary = Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty') && s.getBoundingClientRect().width>0); if(!summary) return 'missing'; if(summary.parentElement.open) summary.click(); summary.focus(); return summary.parentElement.open; })()`);
    await send("Page.bringToFront");
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "char", text: "\r", unmodifiedText: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    const expanded = await evaluate(`(() => { const summary = Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty') && s.getBoundingClientRect().width>0); return {open:summary?.parentElement.open, focus:document.activeElement?.tagName}; })()`);
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "char", text: "\r", unmodifiedText: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    const closedDetails = await evaluate(`Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty') && s.getBoundingClientRect().width>0)?.parentElement.open`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('Close comparison') && b.getBoundingClientRect().width>0)?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const final = await evaluate(`({close: Array.from(document.querySelectorAll('button')).some(b=>b.textContent?.includes('Close comparison') && b.getBoundingClientRect().width>0), focus:document.activeElement?.textContent?.trim()?.slice(0,80), scroll:document.documentElement.scrollWidth, viewport:innerWidth})`);
    console.log(JSON.stringify({opened, detailsBefore:details, expanded, detailsAfter:closedDetails, final}, null, 2));
    socket.close();
    process.exit(0);
}
if (mode === "native-key") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.includes('Inspect this line') && b.getBoundingClientRect().width>0)?.click()`);
    await evaluate(`Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty') && s.getBoundingClientRect().width>0)?.focus()`);
    await send("Page.bringToFront");
    await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "char", text: "\r", unmodifiedText: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    console.log(JSON.stringify(await evaluate(`(() => { const s=Array.from(document.querySelectorAll('summary')).find(s=>s.textContent?.includes('Search method and uncertainty') && s.getBoundingClientRect().width>0); return {open:s?.parentElement.open, focus:document.activeElement?.tagName}; })()`)));
    socket.close();
    process.exit(0);
}
if (mode === "native-search") {
    const query = process.argv[3] ?? "Ashe";
    console.log(JSON.stringify(await evaluate(`(() => { const input = document.querySelector('#draftTableSearch'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, ${JSON.stringify(query)}); input.dispatchEvent(new Event('input', {bubbles:true})); return Array.from(document.querySelectorAll('tbody tr')).slice(0,10).map(e=>({text:e.textContent?.slice(0,100),html:e.outerHTML.slice(0,1600)})); })()`), null, 2));
    socket.close();
    process.exit(0);
}
if (mode === "strategy" || mode === "native") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Strategy')?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
}
if (mode === "native-draft") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Draft')?.click()`);
}
if (mode === "native-live") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Live Draft')?.click()`);
}
if (mode === "narrow") {
    await send("Emulation.setDeviceMetricsOverride", { width: 430, height: 850, deviceScaleFactor: 1, mobile: false });
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Strategy')?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
}
if (mode === "native-narrow") {
    const resized = await evaluate(`(async () => {
        const bridge = window.__TAURI_INTERNALS__;
        try {
            await bridge.invoke('plugin:window|set_size', {
                label: bridge.metadata.currentWindow.label,
                value: { Logical: { width: 430, height: 850 } },
            });
            return 'ok';
        } catch (error) { return String(error); }
    })()`);
    console.log(`Native resize: ${resized}`);
    if (resized !== "ok") {
        try {
            const win = await send("Browser.getWindowForTarget");
            await send("Browser.setWindowBounds", { windowId: win.windowId,
                bounds: { left: win.bounds.left, top: win.bounds.top, width: 430, height: 850, windowState: "normal" } });
            console.log(`CDP window resize: ${JSON.stringify(win)}`);
        } catch (error) { console.log(`CDP window resize: ${String(error)}`); }
    }
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Strategy')?.click()`);
    await new Promise((resolve) => setTimeout(resolve, 1200));
}
if (mode === "offline" || mode === "offline-empty") {
    if (mode === "offline-empty") {
        await send("Storage.clearDataForOrigin", { origin: "http://127.0.0.1:3011", storageTypes: "indexeddb,cache_storage" });
    }
    await send("Page.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `const originalFetch = window.fetch.bind(window); window.fetch = (input, init) => String(input).startsWith('http://127.0.0.1:3011/') || String(input).startsWith('data/') ? originalFetch(input, init) : Promise.reject(new Error('Simulated offline'));` });
    await send("Page.reload", { ignoreCache: true });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    if (mode === "offline-empty") {
        const fallback = await evaluate(`({alert:document.querySelector('[role="alert"]')?.textContent?.trim(),retry:Array.from(document.querySelectorAll('button')).some(b=>b.textContent?.includes('Retry statistics')),text:document.body.innerText.slice(0,320)})`);
        console.log(JSON.stringify(fallback,null,2));
        if (!fallback.retry) throw new Error('Offline dataset fallback is not visible');
    }
}
if (mode === "offline-fresh") {
    await send("Page.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `const originalFetch = window.fetch.bind(window); window.fetch = (input, init) => String(input).startsWith('http://127.0.0.1:3011/') || String(input).startsWith('data/') ? originalFetch(input, init) : Promise.reject(new Error('Simulated offline'));` });
    await send("Page.navigate", { url: "http://127.0.0.1:3011/" });
    await new Promise((resolve) => setTimeout(resolve, 3000));
}
if (mode === "offline-fresh-diagnostic") {
    await send("Page.enable");
    await send("Page.reload", { ignoreCache: true });
    await new Promise((resolve) => setTimeout(resolve, 4000));
}
if (mode === "preview" || mode === "native-preview") {
    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.includes('Inspect this line'))?.click()`);
}
const info = await evaluate(`({ title: document.title, text: document.body.innerText.slice(0, 2500), tail: document.body.innerText.slice(-1400), buttons: Array.from(document.querySelectorAll('button')).map((b) => b.textContent?.trim()).filter((x) => x && /close|preview|inspect|retry/i.test(x)).slice(0, 20), inputs: Array.from(document.querySelectorAll('input')).map((e) => ({placeholder:e.placeholder,aria:e.getAttribute('aria-label')})).slice(0,10), focus: document.activeElement?.textContent?.trim()?.slice(0, 100), alerts: Array.from(document.querySelectorAll('[role="alert"]')).map((e) => e.textContent), width: document.documentElement.scrollWidth, viewport: innerWidth, outerWidth: outerWidth, debug: 'RIFTTHEORY_DEBUG' in window })`);
console.log(JSON.stringify(info, null, 2));
socket.close();
