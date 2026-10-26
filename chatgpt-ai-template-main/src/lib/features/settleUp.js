// Free settle-up: shared expenses, net balances, and the fewest whole-rupee transfers to square up.
// Expenses and payout handles are intentionally group-visible; no private budget data is touched.
const MAX_AMOUNT = 10000000;
const HANDLE_KINDS = ['upi', 'paypal', 'venmo', 'revolut', 'monzo'];
const UPI_PATTERN = /^[\w.-]{2,64}@[A-Za-z][\w]{1,63}$/;
const HANDLE_PATTERN = /^[A-Za-z0-9._-]{2,64}$/;

// Stable member order: join order first, uid as a tie-break (also covers members no longer on the roster).
function byJoinOrder(members, ids) {
  const rank = (uid) => (members[uid] && Number.isFinite(members[uid].joinOrder) ? members[uid].joinOrder : Infinity);
  return [...ids].sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
}

// Net per member = paid - owed. Remainder rupees go to the earliest joiners in the split, so totals always sum to 0.
function computeBalances(expenses, members, allocate, rosterIds = []) {
  const net = Object.fromEntries(rosterIds.map((uid) => [uid, 0]));
  (expenses || []).forEach((expense) => {
    const shares = allocate(expense.amount, byJoinOrder(members, expense.splitAmong));
    net[expense.paidBy] = (net[expense.paidBy] || 0) + expense.amount;
    Object.entries(shares).forEach(([uid, share]) => { net[uid] = (net[uid] || 0) - share; });
  });
  return net;
}

// Greedy: the largest debtor pays the largest creditor until everyone is square. Ties resolve by `order`.
function settleTransfers(balances, order = Object.keys(balances)) {
  const position = (uid) => { const index = order.indexOf(uid); return index === -1 ? Infinity : index; };
  const pick = (entries, sign) => entries.filter((e) => sign * e.amount > 0).sort((a, b) => sign * (b.amount - a.amount) || position(a.uid) - position(b.uid))[0];
  const entries = Object.entries(balances).map(([uid, amount]) => ({ uid, amount }));
  const transfers = [];
  for (let creditor = pick(entries, 1), debtor = pick(entries, -1); creditor && debtor; creditor = pick(entries, 1), debtor = pick(entries, -1)) {
    const amount = Math.min(creditor.amount, -debtor.amount);
    transfers.push({ from: debtor.uid, to: creditor.uid, amount });
    creditor.amount -= amount; debtor.amount += amount;
  }
  return transfers;
}

function approvedMember(state, uid, ctx) { return ctx.approvedIds(state).includes(uid); }

function addExpense(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  const title = typeof command.title === 'string' ? command.title.trim() : '';
  if (!title || title.length > 80) ctx.fail('An expense title of 1–80 characters is required');
  const max = ctx.maxAmount || MAX_AMOUNT; const inr = (ctx.settings?.currency || 'INR') === 'INR';
  if (!Number.isSafeInteger(command.amount) || command.amount < 1 || command.amount > max) ctx.fail(inr ? 'A whole-rupee amount from 1 to 1,00,00,000 is required' : `A whole-number amount from 1 to ${max.toLocaleString('en-US')} is required`);
  const paidBy = command.paidBy == null || command.paidBy === '' ? command.uid : command.paidBy;
  if (!approvedMember(state, paidBy, ctx)) ctx.fail('The payer must be an approved member; others are not allowed');
  const ids = ctx.approvedIds(state);
  const splitAmong = command.splitAmong == null ? ids : command.splitAmong;
  if (!Array.isArray(splitAmong) || !splitAmong.length || new Set(splitAmong).size !== splitAmong.length || splitAmong.some((uid) => !ids.includes(uid))) {
    ctx.fail('At least one distinct approved member is required in the split');
  }
  state.expenseSeq = (state.expenseSeq || 0) + 1;
  state.expenses = [...(state.expenses || []), { id: `exp-${state.expenseSeq}`, title, amount: command.amount, paidBy, splitAmong: byJoinOrder(state.members, splitAmong), createdBy: command.uid, at: command.now }];
  return state;
}

function removeExpense(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  const expense = (state.expenses || []).find((item) => item.id === command.expenseId);
  if (!expense) ctx.fail('An existing expense is required');
  if (expense.createdBy !== command.uid && state.ownerUid !== command.uid) ctx.fail('Only the person who added it or the organizer is allowed to remove it');
  state.expenses = state.expenses.filter((item) => item.id !== command.expenseId);
  return state;
}

function setPayoutHandle(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  if (!HANDLE_KINDS.includes(command.kind)) ctx.fail(`Payout method must be one of the allowed kinds: ${HANDLE_KINDS.join(', ')}`);
  const handle = typeof command.handle === 'string' ? command.handle.trim().replace(/^@/, '') : '';
  const valid = command.kind === 'upi' ? UPI_PATTERN.test(handle) : HANDLE_PATTERN.test(handle);
  if (!valid) ctx.fail(command.kind === 'upi' ? 'A valid UPI ID like name@okbank is required' : 'A username of 2–64 letters, numbers, dots, dashes, or underscores is required');
  state.payoutHandles = { ...(state.payoutHandles || {}), [command.uid]: { kind: command.kind, handle } };
  return state;
}

function project(state, viewerUid, ctx) {
  const expenses = ctx.clone(state.expenses || []);
  const roster = ctx.approvedIds(state);
  const balances = computeBalances(expenses, state.members, ctx.allocateInteger, roster);
  const transfers = settleTransfers(balances, byJoinOrder(state.members, Object.keys(balances)));
  return { currency: ctx.settings?.currency || 'INR', expenses, balances, transfers, payoutHandles: ctx.clone(state.payoutHandles || {}), myNet: balances[viewerUid] || 0 };
}

module.exports = {
  name: 'settleUp',
  commands: { addExpense, removeExpense, setPayoutHandle },
  project,
  computeBalances,
  settleTransfers,
  byJoinOrder,
  HANDLE_KINDS,
};
