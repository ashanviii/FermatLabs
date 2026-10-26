// Smoke test: organizer alone + demo travellers through lock, against the running app.
const [apiKey, app] = process.argv.slice(2);
const su = await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: `demo-${crypto.randomUUID()}@example.test`, password: `Pw-${crypto.randomUUID()}`, returnSecureToken: true }) })).json();
const call = async (body) => { const r = await fetch(`${app}/api/group-trips`, { method: 'POST', headers: { authorization: `Bearer ${su.idToken}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(`${body.command?.type || body.action}: ${j.error}`); return j.trip; };
let t = await call({ action: 'create', idempotencyKey: `smoke-${crypto.randomUUID()}`, trip: { name: 'Demo smoke', startDate: '2026-12-24', endDate: '2026-12-28', expectedSize: 4 } });
const cmd = (command) => call({ action: 'command', tripId: t.id, command });
t = await cmd({ type: 'addDemoMembers' }); console.log('members:', Object.values(t.members).map((m) => m.nickname).join(', '));
t = await cmd({ type: 'submitConstraints', expectedInputRevision: t.inputRevision, constraints: { departureCity: 'Delhi', budget: 200000, passportExpiry: '2030-01', visas: [], datesConfirmed: true, preferences: ['food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true } });
console.log('board:', t.destinationBoard.map((d) => `${d.destinationId}:${d.eligible ? 'ok' : `${d.budgetShort}b/${d.passport}p/${d.visaTiming}v`}`).join(' '));
t = await cmd({ type: 'openVoting', expectedInputRevision: t.inputRevision }); console.log('ballots after open:', t.ballotProgress);
t = await cmd({ type: 'vote', destinationId: 'goa', round: t.round, inputRevision: t.inputRevision });
t = await cmd({ type: 'lock', round: t.round, inputRevision: t.inputRevision, idempotencyKey: `lock-${crypto.randomUUID()}` });
console.log(`locked: ${t.activePlan.destinationName}, approvals ${Object.keys(t.activePlan.approvals).length}/4, dropout +₹${t.myDropoutImpact?.increase}`);
