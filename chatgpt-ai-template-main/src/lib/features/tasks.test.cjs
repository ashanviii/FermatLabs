const assert = require('node:assert/strict');
const test = require('node:test');

const { createTripState, applyCommand, buildTripProjection, validatePlan } = require('../collaborativeTrip');
const { MAX_TASKS, project } = require('./tasks');

const ownerInputs = { departureCity: 'Delhi', budget: 1000000, passportExpiry: '2031-12', visas: [], datesConfirmed: true, preferences: ['food'], entryCheckAcknowledged: true, isAdult: true, hasIndianPassport: true };

function collectingTrip() {
  const trip = createTripState({ id: 't1', ownerUid: 'owner', name: 'Test', startDate: '2026-12-10', endDate: '2026-12-15', expectedSize: 4, createdAt: Date.parse('2026-10-20T00:00:00Z') });
  return applyCommand(trip, { type: 'addDemoMembers', uid: 'owner' });
}
function votingTrip() {
  let trip = collectingTrip();
  trip = applyCommand(trip, { type: 'submitConstraints', uid: 'owner', expectedInputRevision: trip.inputRevision, constraints: ownerInputs });
  return applyCommand(trip, { type: 'openVoting', uid: 'owner', expectedInputRevision: trip.inputRevision });
}
function lockedTrip() {
  let trip = votingTrip();
  trip = applyCommand(trip, { type: 'vote', uid: 'owner', destinationId: 'goa', round: trip.round, inputRevision: trip.inputRevision });
  return applyCommand(trip, { type: 'lock', uid: 'owner', round: trip.round, inputRevision: trip.inputRevision, idempotencyKey: 'lock-1' });
}

const base = lockedTrip();
const demoUids = Object.keys(base.members).filter((u) => u !== 'owner');
const [alice, bob, cara] = demoUids;
const view = (trip, uid) => buildTripProjection(trip, uid).features.tasks;
const add = (trip, uid, title, extra = {}) => applyCommand(trip, { type: 'addTask', uid, title, now: 1000, ...extra });
const run = (trip, type, uid, fields) => applyCommand(trip, { type, uid, ...fields });

test('old trips without tasks project an empty list', () => {
  const tasks = view(base, 'owner');
  assert.deepEqual(tasks.tasks, []);
  assert.equal(tasks.myOpenTasks, 0);
});

test('only approved members can use task commands', () => {
  const trip = add(base, 'owner', 'Book stays');
  assert.throws(() => add(base, 'stranger', 'Book stays'), /membership required/);
  assert.throws(() => run(trip, 'assignTask', 'stranger', { taskId: 'task-1', assigneeUid: null }), /membership required/);
  assert.throws(() => run(trip, 'completeTask', 'stranger', { taskId: 'task-1', done: true }), /membership required/);
  assert.throws(() => run(trip, 'removeTask', 'stranger', { taskId: 'task-1' }), /membership required/);
});

test('addTask validates title and assignee', () => {
  assert.throws(() => add(base, 'owner', ''), /required/);
  assert.throws(() => add(base, 'owner', '   '), /required/);
  assert.throws(() => add(base, 'owner', 42), /required/);
  assert.throws(() => add(base, 'owner', 'x'.repeat(81)), /required/);
  assert.throws(() => add(base, 'owner', 'Book stays', { assigneeUid: 'stranger' }), /not allowed/);
  let trip = base;
  for (let i = 0; i < MAX_TASKS; i += 1) trip = add(trip, alice, `Task ${i}`);
  assert.throws(() => add(trip, alice, 'One more'), /allowed/);
});

test('addTask stores a sequential task with creator, assignee and server time', () => {
  let trip = add(base, alice, '  Compare   flights ', { assigneeUid: bob, now: 5000 });
  trip = add(trip, 'owner', 'x'.repeat(80));
  assert.deepEqual(trip.tasks[0], { id: 'task-1', title: 'Compare flights', assigneeUid: bob, done: false, createdBy: alice, at: 5000 });
  assert.equal(trip.tasks[1].id, 'task-2');
  assert.equal(trip.tasks[1].assigneeUid, null);
  assert.equal(trip.taskSeq, 2);
  trip = run(trip, 'removeTask', 'owner', { taskId: 'task-2' });
  assert.equal(add(trip, 'owner', 'Next').tasks[1].id, 'task-3', 'ids are never reused');
  assert.deepEqual(validatePlan(trip.activePlan), [], 'tasks never touch the plan');
});

test('assignTask: creator, current assignee or organizer only', () => {
  const trip = add(base, alice, 'Book stays', { assigneeUid: bob });
  assert.throws(() => run(trip, 'assignTask', cara, { taskId: 'task-1', assigneeUid: cara }), /allowed/);
  assert.equal(run(trip, 'assignTask', alice, { taskId: 'task-1', assigneeUid: cara }).tasks[0].assigneeUid, cara);
  assert.equal(run(trip, 'assignTask', bob, { taskId: 'task-1', assigneeUid: null }).tasks[0].assigneeUid, null);
  assert.equal(run(trip, 'assignTask', 'owner', { taskId: 'task-1', assigneeUid: 'owner' }).tasks[0].assigneeUid, 'owner');
  assert.throws(() => run(trip, 'assignTask', alice, { taskId: 'task-1', assigneeUid: 'stranger' }), /not allowed/);
  assert.throws(() => run(trip, 'assignTask', alice, { taskId: 'task-9', assigneeUid: null }), /existing task is required/);
});

test('completeTask: assignee, creator or organizer with a boolean', () => {
  const trip = add(base, alice, 'Check visa rules', { assigneeUid: bob });
  assert.throws(() => run(trip, 'completeTask', cara, { taskId: 'task-1', done: true }), /allowed/);
  assert.throws(() => run(trip, 'completeTask', bob, { taskId: 'task-1', done: 'yes' }), /required/);
  assert.throws(() => run(trip, 'completeTask', bob, { taskId: 'nope', done: true }), /required/);
  for (const uid of [alice, bob, 'owner']) assert.equal(run(trip, 'completeTask', uid, { taskId: 'task-1', done: true }).tasks[0].done, true);
  const undone = run(run(trip, 'completeTask', bob, { taskId: 'task-1', done: true }), 'completeTask', bob, { taskId: 'task-1', done: false });
  assert.equal(undone.tasks[0].done, false);
});

test('removeTask: creator or organizer only, not the assignee', () => {
  const trip = add(base, alice, 'Buy travel insurance', { assigneeUid: bob });
  assert.throws(() => run(trip, 'removeTask', bob, { taskId: 'task-1' }), /allowed/);
  assert.throws(() => run(trip, 'removeTask', cara, { taskId: 'task-1' }), /allowed/);
  assert.deepEqual(run(trip, 'removeTask', alice, { taskId: 'task-1' }).tasks, []);
  assert.deepEqual(run(trip, 'removeTask', 'owner', { taskId: 'task-1' }).tasks, []);
  assert.throws(() => run(trip, 'removeTask', 'owner', { taskId: 'task-1x' }), /required/);
});

test('tasks work in every phase', () => {
  for (const trip of [collectingTrip(), votingTrip(), base]) assert.equal(add(trip, 'owner', 'Find dates that work').tasks.length, 1);
});

test('project shows tasks and the viewer\'s own open count', () => {
  let trip = add(base, 'owner', 'Book stays', { assigneeUid: alice });
  trip = add(trip, 'owner', 'Compare flights', { assigneeUid: alice });
  trip = add(trip, 'owner', 'Sort a forex card', { assigneeUid: bob });
  trip = run(trip, 'completeTask', alice, { taskId: 'task-2', done: true });
  assert.equal(view(trip, alice).myOpenTasks, 1);
  assert.equal(view(trip, bob).myOpenTasks, 1);
  assert.equal(view(trip, 'owner').myOpenTasks, 0);
  assert.deepEqual(view(trip, cara).tasks.map((task) => task.title), ['Book stays', 'Compare flights', 'Sort a forex card']);
});

test('assignees who are no longer approved show as unassigned', () => {
  const trip = add(base, 'owner', 'Book stays', { assigneeUid: alice });
  trip.members[alice].status = 'removed';
  const ctx = { approvedIds: (s) => Object.keys(s.members).filter((uid) => s.members[uid].status === 'approved'), completeConstraint: Boolean };
  assert.equal(project(trip, 'owner', ctx).tasks[0].assigneeUid, null);
});

test('waitingOn counts inputs, ballots and approvals anonymously', () => {
  const collecting = view(collectingTrip(), 'owner').waitingOn;
  assert.deepEqual(collecting, { inputs: 1, votes: 0, approvals: 0 });
  const voting = view(votingTrip(), alice).waitingOn;
  assert.deepEqual(voting, { inputs: 0, votes: 1, approvals: 0 }, 'demo members auto-vote, the organizer has not');
  assert.deepEqual(view(base, alice).waitingOn, { inputs: 0, votes: 0, approvals: 1 });
  const approvedPlan = run(base, 'approvePlan', 'owner', { planVersion: base.activePlan.version, planRevision: base.activePlan.revision, decision: 'approved' });
  assert.deepEqual(view(approvedPlan, alice).waitingOn, { inputs: 0, votes: 0, approvals: 0 });
});

test('privacy: projection never carries budgets, constraints or who is late', () => {
  const trip = add(base, alice, 'Book stays', { assigneeUid: bob });
  for (const viewer of ['owner', ...demoUids]) {
    const tasks = view(trip, viewer);
    const text = JSON.stringify(tasks);
    assert.ok(!/budget|passport|preferences|constraints|ballot|1000000/.test(text));
    Object.values(tasks.waitingOn).forEach((value) => assert.equal(typeof value, 'number'));
    assert.deepEqual(Object.keys(tasks).sort(), ['myOpenTasks', 'tasks', 'waitingOn']);
  }
  assert.throws(() => buildTripProjection(trip, 'stranger'), /membership required/);
});
