'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Plus, Receipt, ReceiptEuro, ReceiptIndianRupee, ReceiptJapaneseYen, ReceiptPoundSterling, ReceiptSwissFranc, ReceiptText, ReceiptTurkishLira, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { ChipGroup, Field, Input, Select, ToggleChip } from '@/components/ui/field';
import { icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { formatMoney, plural } from '@/lib/format';
import { avatarName } from '../shell/tripState';
import { MoneyInput, maxAmountFor, moneyStep, tripCurrency, tripHomeCountry } from './currency';
import type { FeatureProps } from './types';

type Handle = { kind: string; handle: string };
type Expense = { id: string; title: string; amount: number; paidBy: string; splitAmong: string[]; createdBy: string };
type Transfer = { from: string; to: string; amount: number };

// Payout apps the settle-up engine accepts (Cash App is organiser-payee only for now). UPI is rupees-only.
const KINDS: Record<string, { label: string; placeholder: string }> = {
  upi: { label: 'UPI', placeholder: 'yourname@okaxis' },
  paypal: { label: 'PayPal', placeholder: 'paypal.me username' },
  venmo: { label: 'Venmo', placeholder: 'Venmo username' },
  revolut: { label: 'Revolut', placeholder: 'revolut.me username' },
  monzo: { label: 'Monzo', placeholder: 'monzo.me username' },
};
const EUROZONE = new Set(['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);
// Most-used apps first for the group's home country; the rest follow so nobody is locked out.
function kindsFor(homeCountry: string, currency: string, saved?: string): string[] {
  const first = homeCountry === 'IN' ? ['upi', 'paypal', 'venmo', 'revolut', 'monzo']
    : homeCountry === 'US' ? ['venmo', 'paypal', 'revolut']
      : homeCountry === 'GB' ? ['monzo', 'revolut', 'paypal']
        : EUROZONE.has(homeCountry) ? ['revolut', 'paypal'] : ['paypal', 'revolut'];
  const ordered = Array.from(new Set([...first, 'paypal', 'revolut', 'venmo', 'monzo', 'upi']));
  return ordered.filter((k) => k === saved || k !== 'upi' || currency === 'INR');
}
const RECEIPT_ICONS: Record<string, typeof Receipt> = { INR: ReceiptIndianRupee, USD: Receipt, CAD: Receipt, AUD: Receipt, NZD: Receipt, SGD: Receipt, MXN: Receipt, EUR: ReceiptEuro, GBP: ReceiptPoundSterling, JPY: ReceiptJapaneseYen, CHF: ReceiptSwissFranc, TRY: ReceiptTurkishLira };
const validHandle = (kind: string, handle: string) => (kind === 'upi' ? /^[\w.-]{2,64}@[A-Za-z][\w]{1,63}$/ : /^[A-Za-z0-9._-]{2,64}$/).test(handle.trim().replace(/^@/, ''));

// Deep link to the payee's own app; Fermat never holds the money. Amounts are prefilled only where the app takes that
// currency (UPI rupees, Venmo dollars, Monzo pounds, PayPal any); otherwise the link opens the payee's profile.
function payLink(payee: Handle, nickname: string, amount: number, tripName: string, currency: string) {
  const h = encodeURIComponent(payee.handle); const note = encodeURIComponent(tripName);
  switch (payee.kind) {
    case 'upi': return currency === 'INR' ? `upi://pay?pa=${payee.handle}&pn=${encodeURIComponent(nickname)}&am=${amount}&cu=INR&tn=${note}` : null;
    case 'paypal': return `https://paypal.me/${h}/${amount}${currency === 'INR' ? '' : currency}`;
    case 'venmo': return currency === 'USD' ? `https://venmo.com/${h}?txn=pay&amount=${amount}&note=${note}` : `https://venmo.com/u/${h}`;
    case 'revolut': return `https://revolut.me/${h}`;
    case 'monzo': return currency === 'GBP' ? `https://monzo.me/${h}/${amount}` : `https://monzo.me/${h}`;
    default: return null;
  }
}

function SubHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h4 className="type-overline m-0 text-ink-muted">{children}</h4>
      {aside && <span className="type-caption text-ink-muted">{aside}</span>}
    </div>
  );
}

// Free shared-expense splitter: who paid, who owes, and the fewest transfers to settle.
export default function SettleUp({ trip, uid, owner, disabled, command }: FeatureProps) {
  const data = trip?.features?.settleUp;
  const roster: string[] = Object.values(trip?.members || {}).filter((m: any) => m.status === 'approved').sort((a: any, b: any) => a.joinOrder - b.joinOrder).map((m: any) => m.uid);
  const name = (id: string) => trip?.members?.[id]?.nickname || 'A former member';
  const mine: Handle | undefined = data?.payoutHandles?.[uid];
  const currency: string = data?.currency || tripCurrency(trip);
  const cap = maxAmountFor(currency);
  const money = (value: number) => formatMoney(value, currency);
  const kinds = kindsFor(tripHomeCountry(trip), currency, mine?.kind);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(uid);
  const [split, setSplit] = useState<string[] | null>(null); // null = everyone
  const [kind, setKind] = useState(mine?.kind || kinds[0]);
  const [handle, setHandle] = useState(mine?.handle || '');
  const mineKey = JSON.stringify(mine || null);
  useEffect(() => { setKind(mine?.kind || kinds[0]); setHandle(mine?.handle || ''); }, [mineKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return null;

  const splitAmong = split || roster;
  const value = Number(amount);
  const canAdd = title.trim().length > 0 && title.trim().length <= 80 && Number.isInteger(value) && value >= 1 && value <= cap && splitAmong.length > 0;
  const toggle = (id: string) => setSplit(splitAmong.includes(id) ? splitAmong.filter((x) => x !== id) : roster.filter((x) => x === id || splitAmong.includes(x)));
  const addExpense = async () => {
    const sent = await command({ type: 'addExpense', title: title.trim(), amount: value, paidBy, splitAmong: split ? roster.filter((id) => split.includes(id)) : undefined });
    if (sent) { setTitle(''); setAmount(''); setSplit(null); setPaidBy(uid); }
  };
  const saveHandle = () => command({ type: 'setPayoutHandle', kind, handle: handle.trim() });
  const expenses: Expense[] = [...data.expenses].reverse();
  const transfers: Transfer[] = data.transfers;
  const balanceIds = Object.keys(data.balances).sort((a, b) => roster.indexOf(a) - roster.indexOf(b));
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const myNet: number = data.myNet ?? data.balances[uid] ?? 0;
  const who = (id: string) => (id === uid ? 'You' : name(id));
  const handleError = handle.trim() !== '' && !validHandle(kind, handle) ? (kind === 'upi' ? 'Enter a UPI ID like name@okbank.' : 'Use 2 to 64 letters, numbers, dots, dashes or underscores.') : undefined;
  const savedKind = mine ? KINDS[mine.kind]?.label : null;
  const ReceiptIcon = RECEIPT_ICONS[currency] || ReceiptText;

  return (
    <Card>
      <CardHeader
        icon={icons.money}
        title="Split costs"
        description="Add shared bills. We work out who pays whom."
        action={expenses.length > 0 && (myNet > 0
          ? <StatusPill status="info" icon={icons.money}>You get back {money(myNet)}</StatusPill>
          : myNet < 0
            ? <StatusPill status="warning" icon={icons.money}>You owe {money(-myNet)}</StatusPill>
            : <StatusPill status="done">You're square</StatusPill>)}
      />
      <CardBody className="grid gap-8">
        {/* 1. Who pays whom: the actionable part first. */}
        {expenses.length > 0 && (
          <section className="grid gap-3" aria-label="Settle up">
            <SubHeading aside={`${plural(expenses.length, 'bill')} · ${money(total)}`}>Who pays whom</SubHeading>
            {!transfers.length ? (
              <p className="type-body m-0 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 font-medium text-success-ink">
                <icons.success className="size-5 text-success" strokeWidth={1.75} aria-hidden /> Everyone is square.
              </p>
            ) : (
              <ul className="m-0 grid list-none gap-2 p-0">
                {transfers.map((t) => {
                  const payee: Handle | undefined = data.payoutHandles[t.to];
                  const yours = t.from === uid;
                  const link = yours && payee ? payLink(payee, name(t.to), t.amount, trip.name, currency) : null;
                  return (
                    <li key={`${t.from}-${t.to}`} className={cn('grid gap-3 rounded-xl px-4 py-3 sm:flex sm:items-center sm:gap-4', yours ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : 'bg-surface ring-1 ring-inset ring-line-subtle')}>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex shrink-0 items-center">
                          <Avatar name={avatarName(name(t.from))} size="sm" className="ring-2 ring-surface" />
                          <ArrowRight className="mx-1 hidden size-4 text-ink-faint sm:block" strokeWidth={2} aria-hidden />
                          <Avatar name={avatarName(name(t.to))} size="sm" className="-ml-1.5 ring-2 ring-surface sm:ml-0" />
                        </div>
                        <p className="type-body m-0 min-w-0 flex-1 text-ink-soft">
                          <span className="font-semibold text-ink">{yours ? 'You pay' : `${name(t.from)} pays`}</span> {t.to === uid ? 'you' : name(t.to)}
                        </p>
                        <span className="type-num shrink-0 font-display text-lg font-bold text-ink">{money(t.amount)}</span>
                      </div>
                      {yours && (link ? (
                        <Button asChild size="sm" className="max-sm:w-full">
                          <a href={link} {...(link.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><icons.money strokeWidth={2} aria-hidden />Pay {name(t.to)}</a>
                        </Button>
                      ) : (
                        <span className="type-caption flex items-center gap-1.5 text-ink-muted sm:max-w-[11rem]">
                          <icons.pending className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                          Ask {name(t.to)} to add a payout method
                        </span>
                      ))}
                    </li>
                  );
                })}
              </ul>
            )}

            {balanceIds.length > 0 && (
              <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 pt-1 sm:grid-cols-2" aria-label="Balances">
                {balanceIds.map((id) => {
                  const net = data.balances[id];
                  return (
                    <li key={id} className="flex items-center justify-between gap-3 border-0 border-b border-solid border-line-subtle py-2">
                      <span className="type-small flex min-w-0 items-center gap-2 font-medium text-ink">
                        <Avatar name={avatarName(name(id))} size="xs" />
                        <span className="truncate">{who(id)}</span>
                      </span>
                      <span className={cn('type-small type-num shrink-0 font-semibold', net > 0 ? 'text-success-ink' : net < 0 ? 'text-warning-ink' : 'text-ink-muted')}>
                        {net > 0 ? `gets back ${money(net)}` : net < 0 ? `owes ${money(-net)}` : 'settled'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* 2. Add a bill. */}
        <section className="grid gap-4 rounded-2xl bg-surface-muted p-4 sm:p-5" aria-label="Add an expense">
          <h4 className="type-h3 m-0">Add an expense</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.3fr]">
            <Field label="What was it for?">
              <Input maxLength={80} placeholder="Dinner at the beach shack" value={title} disabled={disabled} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Amount">
              <MoneyInput currency={currency} step={1} placeholder={currency === 'INR' ? '2400' : String(moneyStep(currency) * 12)} value={amount} disabled={disabled} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Paid by">
              <Select value={paidBy} disabled={disabled} onChange={(e) => setPaidBy(e.target.value)}>
                {roster.map((id) => <option key={id} value={id}>{id === uid ? `${name(id)} (you)` : name(id)}</option>)}
              </Select>
            </Field>
          </div>
          <ChipGroup label="Split between">
            {roster.map((id) => (
              <ToggleChip key={id} selected={splitAmong.includes(id)} disabled={disabled} onSelectedChange={() => toggle(id)}>
                {id === uid ? `${name(id)} (you)` : name(id)}
              </ToggleChip>
            ))}
          </ChipGroup>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={cn('type-small m-0', splitAmong.length ? 'text-ink-muted' : 'font-medium text-danger-ink')} role={splitAmong.length ? undefined : 'alert'}>
              {!splitAmong.length
                ? 'Pick at least one person to split with.'
                : canAdd
                  ? <>About <span className="type-num font-semibold text-ink">{money(Math.ceil(value / splitAmong.length))}</span> each for {plural(splitAmong.length, 'person', 'people')}</>
                  : `Split between ${plural(splitAmong.length, 'person', 'people')}`}
            </p>
            <Button variant="secondary" icon={Plus} disabled={disabled || !canAdd} onClick={addExpense}>Add expense</Button>
          </div>
        </section>

        {/* 3. The bills. */}
        <section className="grid gap-3" aria-label="Expenses">
          <SubHeading>Expenses</SubHeading>
          {!expenses.length ? (
            <p className="type-small m-0 text-ink-muted">Nothing added yet. Add the first bill above.</p>
          ) : (
            <ul className="m-0 grid list-none p-0">
              {expenses.map((e) => {
                const everyone = e.splitAmong.length === roster.length && roster.every((id) => e.splitAmong.includes(id));
                return (
                  <li key={e.id} className="flex items-center gap-3 border-0 border-b border-solid border-line-subtle py-3 last:border-b-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-soft">
                      <ReceiptIcon className="size-[1.125rem]" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="type-body m-0 truncate font-semibold text-ink">{e.title}</p>
                      <p className="type-small m-0 text-ink-muted">
                        {e.paidBy === uid ? 'You' : name(e.paidBy)} paid · {everyone ? 'split with everyone' : `split with ${e.splitAmong.map((id) => (id === uid ? 'you' : name(id))).join(', ')}`}
                      </p>
                    </div>
                    <span className="type-num shrink-0 font-semibold text-ink">{money(e.amount)}</span>
                    {(owner || e.createdBy === uid) && (
                      <Button size="icon-sm" variant="ghost" disabled={disabled} aria-label={`Remove ${e.title}`} title="Remove" onClick={() => command({ type: 'removeExpense', expenseId: e.id })}>
                        <Trash2 strokeWidth={1.75} aria-hidden />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 4. How others pay the viewer back (shared with the group). */}
        <section className="grid gap-4 border-0 border-t border-solid border-line-subtle pt-6" aria-label="Your payout method">
          <div>
            <h4 className="type-h3 m-0">How you get paid back</h4>
            <p className="type-small m-0 mt-0.5 text-ink-muted">
              {mine ? <>The group sees this. Saved: <span className="font-semibold text-ink">{savedKind} {mine.kind === 'venmo' || mine.kind === 'revolut' ? '@' : ''}{mine.handle}</span></> : 'The group sees this so they can pay you back.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
            <Field label="Method" hideLabel>
              <Select value={kind} disabled={disabled} onChange={(e) => setKind(e.target.value)}>
                {kinds.map((k) => <option key={k} value={k}>{KINDS[k].label}</option>)}
              </Select>
            </Field>
            <Field label="Payout handle" hideLabel error={handleError}>
              <Input placeholder={KINDS[kind]?.placeholder} value={handle} disabled={disabled} onChange={(e) => setHandle(e.target.value)} />
            </Field>
            <Button variant="outline" disabled={disabled || !validHandle(kind, handle)} onClick={saveHandle}>Save</Button>
          </div>
        </section>
      </CardBody>
    </Card>
  );
}
