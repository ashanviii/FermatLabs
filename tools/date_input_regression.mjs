// Real-browser regression for the create form's dates: types an invalid range into the actual <input type="date">
// fields (like a person, key by key) and checks that the visible values, the draft and the Create button agree.
// Usage: node tools/date_input_regression.mjs [appUrl]   (needs Playwright's headless Chromium in ~/.cache/ms-playwright)
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const app = process.argv[2] || 'http://127.0.0.1:3007';
const cache = join(homedir(), '.cache/ms-playwright');
const shellDir = readdirSync(cache).find((name) => name.startsWith('chromium_headless_shell-'));
const bin = join(cache, shellDir, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(bin, ['--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, '--window-size=1280,1600', '--lang=en-US', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws; let nextId = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
async function typeKeys(text) {
  for (const ch of text) {
    const code = /\d/.test(ch) ? `Digit${ch}` : undefined;
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, code, windowsVirtualKeyCode: ch.charCodeAt(0) });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, code, windowsVirtualKeyCode: ch.charCodeAt(0) });
    await sleep(40);
  }
}
async function typeDate(name, mmddyyyy) {
  await evaluate(`(() => { const el = document.querySelector('input[name="${name}"]'); el.scrollIntoView({ block: 'center' }); el.focus(); return true; })()`);
  await typeKeys(mmddyyyy);
  await evaluate(`document.querySelector('input[name="${name}"]').blur(), true`);
  await sleep(300);
}

let failed = 0;
const check = (label, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`); if (!ok) failed += 1; };
try {
  let target;
  for (let i = 0; i < 50 && !target; i += 1) { try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch { await sleep(200); } }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (event) => { const msg = JSON.parse(event.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)[msg.error ? 'reject' : 'resolve'](msg.error || msg.result); pending.delete(msg.id); } });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: `${app}/plan?preview=create` });
  for (let i = 0; i < 60; i += 1) { if (await evaluate(`!!document.querySelector('input[name="endDate"]')`)) break; await sleep(250); }

  const state = () => evaluate(`(() => {
    const field = (n) => document.querySelector('input[name="' + n + '"]');
    const create = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('Create trip'));
    const errors = [...document.querySelectorAll('[id$="-error"], .text-danger-ink')].map((e) => e.textContent.trim()).filter(Boolean);
    const summary = create?.closest('form')?.querySelector('p.type-small')?.textContent || '';
    return { start: field('startDate').value, end: field('endDate').value, startValid: field('startDate').validity.valid, endValid: field('endDate').validity.valid, createDisabled: create?.disabled, errors, summary };
  })()`);

  const before = await state();
  check('form starts valid', before.startValid && before.endValid && before.createDisabled === false, `${before.start} → ${before.end}`);

  // The reported case: first day 15 Dec, then last day 10 Dec (before the first day).
  await typeDate('startDate', '12152026');
  await typeDate('endDate', '12102026');
  const after = await state();
  check('visible first day is 15 Dec', after.start === '2026-12-15', after.start);
  check('visible last day is 10 Dec or flagged incomplete', after.end === '2026-12-10' || !after.endValid, `${after.end} valid=${after.endValid}`);
  check('Create trip is disabled', after.createDisabled === true);
  check('an inline date error is shown', after.errors.some((e) => /last day|first day|date/i.test(e)), after.errors.join(' | '));
  check('summary does not still claim the old 10–15 Dec range', !/10\s*[–-]\s*15 Dec/.test(after.summary), after.summary.trim());

  // Clicking Create anyway must not submit: the button is disabled and the form re-checks the visible fields.
  await evaluate(`document.querySelector('input[name="endDate"]').closest('form').requestSubmit(), true`);
  await sleep(300); // the form focuses the offending field on the next frame
  const clicked = await evaluate(`document.activeElement?.getAttribute('name') || document.activeElement?.tagName`);
  check('submitting anyway focuses the invalid date instead of creating', /endDate|startDate|INPUT/.test(String(clicked)), String(clicked));

  // Recovery: a valid range re-enables Create.
  await typeDate('endDate', '12202026');
  const fixed = await state();
  check('fixing the last day re-enables Create', fixed.createDisabled === false && fixed.end === '2026-12-20', `${fixed.start} → ${fixed.end}`);
} catch (error) {
  console.log('FAIL  harness error:', error.message); failed += 1;
} finally {
  ws?.close(); chrome.kill();
  console.log(failed ? `\n${failed} check(s) failed` : '\nAll date checks passed');
  process.exit(failed ? 1 : 0);
}
