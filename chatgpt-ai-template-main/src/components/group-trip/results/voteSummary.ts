// Turns the engine's anonymous lock explanation (trip.lockExplanation) into plain-language results: a ranked tally, a
// verdict sentence for everyone and a personal line for the viewer. Counts only; nothing here ever names a voter.
import { formatList, plural } from '@/lib/format';

export type IneligibleEntry = { id: string; budgetShort?: number; passport?: number; visaTiming?: number; tooShort?: boolean; outOfScope?: boolean };
export type LockExplanation = {
  winner: string;
  totals: Record<string, number>;
  eligible: string[];
  ineligible: IneligibleEntry[];
  decidedBy: 'votes' | 'preferenceTieBreak' | 'orderTieBreak';
  topVoted: string[];
};
export type ReasonKey = 'budget' | 'passport' | 'visa' | 'tooShort' | 'scope' | 'unknown';
export type Reason = { key: ReasonKey; count: number; pill: string; phrase: string };
export type VoteRow = { id: string; name: string; votes: number; eligible: boolean | null; winner: boolean; mine: boolean; reasons: Reason[] };
/** The viewer's own fit for their pick (from trip.myPrivateStatus); only ever shown to the viewer. */
export type MyFit = { fits?: boolean; blocker?: string | null; unlockAmount?: number | null; total?: number | null } | null | undefined;
export type Personal = { outcome: 'won' | 'ineligible' | 'fewerVotes' | 'tieBreak' | 'unknown'; text: string; ownShare?: { kind: 'budget' | 'passport' | 'visa'; count: number; unlockAmount?: number } };
export type VoteSummary = { rows: VoteRow[]; verdict: string; personal: Personal | null; totalVotes: number; otherIneligible: number; legacy: boolean };

/** "new-york" -> "New York": last-resort label for ids missing from trip.destinations (e.g. out of scope). */
export const prettifyId = (id: string) => id.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

/** Anonymous reasons an option could not win, as short pill labels and past-tense phrases. */
export function reasonsFor(entry: IneligibleEntry | undefined, scope?: string): Reason[] {
  if (!entry) return [];
  const out: Reason[] = [];
  if (entry.outOfScope) {
    const phrase = scope === 'domestic' ? 'the trip is domestic only' : scope === 'international' ? 'the trip is international only' : "it's outside the trip's scope";
    out.push({ key: 'scope', count: 0, pill: 'Outside trip scope', phrase });
  }
  if (entry.tooShort) out.push({ key: 'tooShort', count: 0, pill: 'Trip too short', phrase: 'the trip was too short for it' });
  const budget = entry.budgetShort || 0;
  if (budget) out.push({ key: 'budget', count: budget, pill: `${plural(budget, 'budget')} short`, phrase: budget === 1 ? '1 budget was short' : `${budget} budgets were short` });
  const passport = entry.passport || 0;
  if (passport) out.push({ key: 'passport', count: passport, pill: plural(passport, 'passport issue'), phrase: passport === 1 ? "1 passport didn't qualify" : `${passport} passports didn't qualify` });
  const visa = entry.visaTiming || 0;
  if (visa) out.push({ key: 'visa', count: visa, pill: 'Visa timing', phrase: visa === 1 ? "one person couldn't get a visa in time" : `${visa} people couldn't get visas in time` });
  if (!out.length) out.push({ key: 'unknown', count: 0, pill: "Couldn't be planned", phrase: "it couldn't be planned for these dates" });
  return out;
}

const phraseOf = (reasons: Reason[]) => formatList(reasons.map((r) => r.phrase));
const pillsOf = (reasons: Reason[]) => reasons.map((r) => r.pill.charAt(0).toLowerCase() + r.pill.slice(1)).join(', ');

interface Input {
  explanation: LockExplanation | null | undefined;
  /** Old locks have no explanation; fall back to the published totals and the plan's destination. */
  publishedTotals?: Record<string, number> | null;
  winnerId?: string | null;
  myVote?: string | null;
  myFit?: MyFit;
  nameOf: (id: string) => string;
  scope?: string;
}

export function summariseVotes({ explanation, publishedTotals, winnerId, myVote, myFit, nameOf, scope }: Input): VoteSummary | null {
  const legacy = !explanation;
  const winner = explanation?.winner || winnerId || null;
  const totals: Record<string, number> = { ...(explanation?.totals || publishedTotals || {}) };
  if (!winner) return null;
  if (legacy && !Object.keys(totals).length) return null;

  const ineligibleById = new Map((explanation?.ineligible || []).map((entry) => [entry.id, entry]));
  const eligibleIds = new Set(explanation?.eligible || [winner]);
  const votes = (id: string) => totals[id] || 0;
  const name = (id: string) => nameOf(id) || prettifyId(id);
  const ids = Object.keys(totals).filter((id) => votes(id) > 0);
  if (!ids.includes(winner)) ids.push(winner);

  const rows: VoteRow[] = ids
    .map((id) => {
      const eligible = id === winner || eligibleIds.has(id) ? true : ineligibleById.has(id) ? false : legacy ? null : false;
      return { id, name: name(id), votes: votes(id), eligible, winner: id === winner, mine: id === myVote, reasons: eligible === false ? reasonsFor(ineligibleById.get(id), scope) : [] };
    })
    .sort((a, b) => b.votes - a.votes || Number(b.winner) - Number(a.winner) || Number(b.eligible === true) - Number(a.eligible === true) || a.name.localeCompare(b.name));

  const totalVotes = Object.values(totals).reduce((sum, n) => sum + n, 0);
  const otherIneligible = legacy ? 0 : (explanation?.ineligible || []).filter((entry) => !votes(entry.id) && !entry.outOfScope).length;
  const W = name(winner);
  const wv = votes(winner);
  const decidedBy = explanation?.decidedBy || 'votes';
  const onlyOption = !legacy && (explanation?.eligible.length || 0) === 1;
  const tiedEligible = rows.filter((row) => !row.winner && row.eligible === true && row.votes === wv);
  const tieWhy = decidedBy === 'preferenceTieBreak' ? `${W} matched more people's interests` : `with interests equal too, ${W} came first in the list`;

  let verdict: string;
  if (legacy) {
    const top = rows[0];
    verdict = top.winner ? `${W} won with ${plural(wv, 'vote')}.` : `${top.name} got the most votes, but not everyone could go there. ${W} was the top pick the whole group could make.`;
  } else if (wv === 0) {
    verdict = `None of the options that got votes worked for everyone, so ${W} won: ${onlyOption ? "it's the only option everyone can make" : decidedBy === 'preferenceTieBreak' ? "it matched the most people's interests" : 'it came first in the list of options everyone can make'}.`;
  } else {
    const higher = rows.filter((row) => row.eligible === false && row.votes > wv);
    const tiedOut = rows.filter((row) => row.eligible === false && row.votes === wv);
    const parts: string[] = [];
    if (higher.length === 1) {
      parts.push(`${higher[0].name} had the most votes (${higher[0].votes}), but ${phraseOf(higher[0].reasons)}, so ${W}, the top pick everyone can make, won with ${plural(wv, 'vote')}.`);
    } else if (higher.length > 1) {
      parts.push(`${formatList(higher.map((row) => `${row.name} (${row.votes})`))} had more votes, but ${higher.length === 2 ? 'neither' : 'none of them'} worked for everyone, so ${W}, the top pick everyone can make, won with ${plural(wv, 'vote')}.`);
    } else if (tiedOut.length) {
      const blocked = tiedOut.map((row) => `${row.name} (${pillsOf(row.reasons)})`);
      parts.push(`${formatList([W, ...tiedOut.map((row) => row.name)])} tied on ${plural(wv, 'vote')}, but ${formatList(blocked)} didn't work for everyone, so ${W} won.`);
    }
    if (decidedBy !== 'votes' && tiedEligible.length) {
      const others = formatList(tiedEligible.map((row) => row.name));
      parts.push(parts.length ? `It tied with ${others} on ${plural(wv, 'vote')}; ${tieWhy}.` : `${W} and ${others} tied on ${plural(wv, 'vote')}; ${tieWhy}.`);
    }
    if (!parts.length) {
      parts.push(`${W} won with ${totalVotes ? `${wv} of ${plural(totalVotes, 'vote')}` : plural(wv, 'vote')}.`);
      const lower = rows.filter((row) => row.eligible === false && row.votes > 0 && row.votes < wv);
      if (lower.length) parts.push(`${formatList(lower.map((row) => row.name))} also got ${lower.length === 1 && lower[0].votes === 1 ? 'a vote' : 'votes'} but didn't work for everyone.`);
    }
    verdict = parts.join(' ');
  }

  let personal: Personal | null = null;
  const mineRow = myVote ? rows.find((row) => row.id === myVote) : undefined;
  if (myVote && mineRow) {
    const Y = mineRow.name;
    if (mineRow.winner) {
      personal = { outcome: 'won', text: `You voted ${Y}, and it won.` };
    } else if (mineRow.eligible === false) {
      const own = ownShare(mineRow.reasons, myFit);
      personal = { outcome: 'ineligible', text: `You voted ${Y}. It couldn't win because ${phraseOf(mineRow.reasons)}.`, ...(own ? { ownShare: own } : {}) };
    } else if (mineRow.eligible === null) {
      personal = { outcome: 'unknown', text: `You voted ${Y}. ${W} was the top pick the whole group could make.` };
    } else if (mineRow.votes === wv && decidedBy !== 'votes') {
      personal = {
        outcome: 'tieBreak',
        text: `You voted ${Y}. It tied with ${W} on ${plural(wv, 'vote')}; ${tieWhy}.`,
      };
    } else {
      personal = { outcome: 'fewerVotes', text: `You voted ${Y}. Everyone could go, but it got ${plural(mineRow.votes, 'vote')} to ${W}'s ${wv}.` };
    }
  }

  return { rows, verdict, personal, totalVotes, otherIneligible, legacy };
}

/** Whether the viewer's own details were among the anonymous reasons (told only to the viewer). */
function ownShare(reasons: Reason[], fit: MyFit): Personal['ownShare'] | undefined {
  if (!fit) return undefined;
  const count = (key: ReasonKey) => reasons.find((r) => r.key === key)?.count || 0;
  if (fit.blocker === 'passport' && count('passport')) return { kind: 'passport', count: count('passport') };
  if (fit.blocker === 'visaTiming' && count('visa')) return { kind: 'visa', count: count('visa') };
  if (!fit.blocker && fit.fits === false && count('budget')) return { kind: 'budget', count: count('budget'), unlockAmount: fit.unlockAmount || undefined };
  return undefined;
}
