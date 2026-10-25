'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { PrivateBadge, StatusPill } from '@/components/ui/badge';
import { Field, Input, Select } from '@/components/ui/field';
import { icons } from '@/components/ui/icons';
import { Notice } from '@/components/ui/notice';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatMoney } from '@/lib/format';
import { MoneyInput, maxAmountFor, moneyStep, roundUpMoney, tripCurrency, wholeUnits } from './currency';
import type { FeatureProps } from './types';

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'brand' | 'success' }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-small font-semibold text-ink">{label}</span>
        <span className="type-small type-num text-ink-muted"><span className="font-bold text-ink">{value}</span> of {max}</span>
      </div>
      <Progress label={label} value={value} max={max} tone={tone} size="md" />
    </div>
  );
}

// Private "I'm in if..." pledge; only counts and the viewer's own outcome are shown.
export default function Pledges({ trip, uid, disabled, command }: FeatureProps) {
  const data = trip?.features?.pledges;
  const currency = tripCurrency(trip);
  const cap = maxAmountFor(currency);
  const money = (amount: number) => formatMoney(amount, currency);
  const size: number = trip?.expectedSize || 2;
  const myShare: number = trip?.activePlan?.memberTotals?.find((m: any) => m.uid === uid)?.total || 0;
  const mine = data?.myPledge;
  const defaults = () => ({ minGoing: mine?.minGoing ?? size, maxShare: String(mine?.maxShare ?? roundUpMoney(myShare, currency)), deadline: mine?.deadline || '' });
  const [form, setForm] = useState(defaults);
  const [dirty, setDirty] = useState(false);
  const mineKey = JSON.stringify(mine || null);
  useEffect(() => { if (!dirty) setForm(defaults()); }, [mineKey, myShare, size]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!data) return null;

  const update = (patch: Partial<typeof form>) => { setDirty(true); setForm((current) => ({ ...current, ...patch })); };
  const maxShare = Number(form.maxShare);
  const valid = Number.isInteger(maxShare) && maxShare >= 1 && maxShare <= cap;
  const save = async () => { if (await command({ type: 'setPledge', minGoing: form.minGoing, maxShare, deadline: form.deadline || null })) setDirty(false); };
  const withdraw = async () => { if (await command({ type: 'clearPledge' })) setDirty(false); };
  const approved = Object.values(trip.members || {}).filter((m: any) => m.status === 'approved').length || size;

  return (
    <Card>
      <CardHeader
        icon={icons.pledge}
        title="Lock in who's going"
        description="Say when you're in. Your conditions stay private."
        action={data.everyoneIn ? <StatusPill status="ok">Everyone's in</StatusPill> : undefined}
      />
      <CardBody className="grid gap-6">
        {/* Anonymous group progress: counts only. */}
        <div className="grid gap-4 rounded-2xl bg-surface-muted p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            <Meter label="Pledged" value={data.pledgedCount} max={approved} tone="brand" />
            <Meter label="Firmly in" value={data.firmlyInCount} max={approved} tone="success" />
          </div>
          {(data.everyoneIn || data.earliestDeadline) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {data.everyoneIn && <p className="type-small m-0 font-semibold text-success-ink">Everyone is firmly in. Time to book.</p>}
              {data.earliestDeadline && (
                <p className="type-small m-0 flex items-center gap-1.5 text-ink-muted">
                  <icons.calendar className="size-4 text-ink-faint" strokeWidth={1.75} aria-hidden />
                  First decide-by date: <span className="font-semibold text-ink">{formatDate(data.earliestDeadline)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* The viewer's private pledge. */}
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="type-h3 m-0">Your pledge</h4>
            <PrivateBadge size="sm" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="I'm in if at least">
              <Select value={form.minGoing} disabled={disabled} onChange={(e) => update({ minGoing: Number(e.target.value) })}>
                {Array.from({ length: Math.max(0, size - 1) }, (_, i) => i + 2).map((n) => <option key={n} value={n}>{n} people go</option>)}
              </Select>
            </Field>
            <Field
              label="And my share is at most"
              error={!valid ? `Enter ${wholeUnits(currency)}, up to ${money(cap)}.` : undefined}
              hint={`Today: ${money(myShare)}`}
            >
              <MoneyInput currency={currency} step={moneyStep(currency)} value={form.maxShare} disabled={disabled} onChange={(e) => update({ maxShare: e.target.value })} />
            </Field>
            <Field label="Decide by" aside="Optional">
              <Input type="date" max={trip.startDate} value={form.deadline} disabled={disabled} onChange={(e) => update({ deadline: e.target.value })} />
            </Field>
          </div>
          {mine?.stale ? (
            <Notice tone="warning" title="The plan changed since you pledged.">Save your pledge again so it counts.</Notice>
          ) : mine ? (
            <Notice tone="private" icon={data.iAmFirmlyIn ? icons.success : icons.pending} title={data.iAmFirmlyIn ? "You're firmly in." : "Your conditions aren't met yet."}>
              {data.iAmFirmlyIn ? `Your share would be ${money(data.myShareIfFirm)}.` : "We'll count you in once they are."}
            </Notice>
          ) : null}
        </div>
      </CardBody>
      <CardFooter>
        <span className="type-small text-ink-muted">{mine ? 'You can change or withdraw any time.' : "You haven't pledged yet."}</span>
        <div className="flex flex-wrap gap-2">
          {mine && <Button variant="ghost" disabled={disabled} onClick={withdraw}>Withdraw</Button>}
          <Button variant="secondary" icon={icons.pledge} disabled={disabled || !valid} onClick={save}>{mine ? 'Update pledge' : 'Save pledge'}</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
