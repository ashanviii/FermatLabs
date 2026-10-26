// Planner load-share: shared to-dos anyone in the group can pick up, plus anonymous "waiting on" counts for nudges.
const MAX_TASKS = 60;
const MAX_TITLE = 80;

const tasksOf = (state) => state.tasks || [];
const approved = (state, uid) => state.members[uid]?.status === 'approved';

function cleanTitle(value, ctx) {
  const title = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!title || title.length > MAX_TITLE) ctx.fail(`A task title of 1 to ${MAX_TITLE} characters is required`);
  return title;
}

function cleanAssignee(state, value, ctx) {
  if (value == null || value === '') return null;
  if (!approved(state, value)) ctx.fail('Tasks can only be assigned to approved members; that person is not allowed');
  return value;
}

function findTask(state, taskId, ctx) {
  return tasksOf(state).find((task) => task.id === taskId) || ctx.fail('An existing task is required');
}

function allowOnly(uids, uid, ctx) {
  if (!uids.includes(uid)) ctx.fail('Only the task creator, its assignee or the organizer is allowed to do that');
}

function addTask(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  const title = cleanTitle(command.title, ctx); const assigneeUid = cleanAssignee(state, command.assigneeUid, ctx);
  if (tasksOf(state).length >= MAX_TASKS) ctx.fail(`At most ${MAX_TASKS} tasks are allowed; remove some first`);
  state.taskSeq = (state.taskSeq || 0) + 1;
  state.tasks = [...tasksOf(state), { id: `task-${state.taskSeq}`, title, assigneeUid, done: false, createdBy: command.uid, at: command.now }];
  return state;
}

function assignTask(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  const task = findTask(state, command.taskId, ctx);
  allowOnly([task.createdBy, task.assigneeUid, state.ownerUid], command.uid, ctx);
  task.assigneeUid = cleanAssignee(state, command.assigneeUid, ctx);
  return state;
}

function completeTask(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  const task = findTask(state, command.taskId, ctx);
  allowOnly([task.createdBy, task.assigneeUid, state.ownerUid], command.uid, ctx);
  if (typeof command.done !== 'boolean') ctx.fail('A done value of true or false is required');
  task.done = command.done;
  return state;
}

function removeTask(state, command, ctx) {
  ctx.memberOnly(state, command.uid);
  const task = findTask(state, command.taskId, ctx);
  allowOnly([task.createdBy, state.ownerUid], command.uid, ctx);
  state.tasks = tasksOf(state).filter((item) => item.id !== task.id);
  return state;
}

// Anonymous counts only: how many approved members still owe inputs, a ballot or a plan approval.
function waitingOn(state, ctx) {
  const ids = ctx.approvedIds(state);
  const count = (pending) => ids.filter(pending).length;
  return {
    inputs: count((uid) => !ctx.completeConstraint(state.constraints[uid])),
    votes: state.phase === 'voting' ? count((uid) => !state.ballots[uid]) : 0,
    approvals: state.activePlan ? count((uid) => state.activePlan.approvals?.[uid] !== 'approved') : 0,
  };
}

// Assignees who have since left are shown as unassigned.
function project(state, viewerUid, ctx) {
  const tasks = tasksOf(state).map((task) => ({ ...task, assigneeUid: task.assigneeUid && approved(state, task.assigneeUid) ? task.assigneeUid : null }));
  const myOpenTasks = tasks.filter((task) => !task.done && task.assigneeUid === viewerUid).length;
  return { tasks, waitingOn: waitingOn(state, ctx), myOpenTasks };
}

module.exports = { name: 'tasks', commands: { addTask, assignTask, completeTask, removeTask }, project, MAX_TASKS, MAX_TITLE };
