'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { PrivateBadge } from '@/components/ui/badge';
import { ChipGroup, Field, RadioCards, Select, ToggleChip } from '@/components/ui/field';
import { icons } from '@/components/ui/icons';
import seeds from '@/lib/groupTripSeeds.v1.json';
import type { FeatureProps } from './types';

type Prefs = { diet: string; alcohol: string; skipTags: string[] };
type Alcohol = 'fine' | 'avoid';

const DIETS: [string, string][] = [['any', 'No restrictions'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'], ['jain', 'Jain'], ['halal', 'Halal']];
// Activity tags of the options this trip offers (trip.destinations); the seed list is a fallback for old projections.
const tagsOf = (destinations: { tags?: string[] }[]) => Array.from(new Set(destinations.flatMap((d) => d.tags || [])));
const SEED_TAGS = tagsOf(seeds.destinations);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const DEFAULTS: Prefs = { diet: 'any', alcohol: 'fine', skipTags: [] };
const ALCOHOL: { value: Alcohol; label: string }[] = [{ value: 'fine', label: 'Fine with me' }, { value: 'avoid', label: 'Prefer to avoid' }];

// Private diet, alcohol and skip choices; the plan works around them without naming anyone.
export default function SilentPrefs({ disabled, command, trip }: FeatureProps) {
  const offered: any[] | undefined = trip?.destinations;
  const TAGS = offered?.length ? tagsOf(offered) : SEED_TAGS;
  const saved: Prefs = { ...DEFAULTS, ...(trip?.features?.silentPrefs?.myPreferences || {}) };
  const savedKey = JSON.stringify(saved);
  const [form, setForm] = useState<Prefs>(saved);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { if (!dirty) setForm(JSON.parse(savedKey)); }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<Prefs>) => { setDirty(true); setNotice(''); setForm((current) => ({ ...current, ...patch })); };
  const toggleTag = (tag: string) => update({ skipTags: form.skipTags.includes(tag) ? form.skipTags.filter((t) => t !== tag) : [...form.skipTags, tag] });
  const save = async () => {
    const skipTags = TAGS.filter((tag) => form.skipTags.includes(tag));
    if (await command({ type: 'setPrivatePreferences', diet: form.diet, alcohol: form.alcohol, skipTags })) { setDirty(false); setNotice('Saved'); }
  };

  return (
    <Card>
      <CardHeader
        icon={icons.private}
        iconTone="private"
        title="Private preferences"
        description="The plan quietly works around these. Nobody sees whose they are."
        action={<PrivateBadge size="sm" />}
      />
      <CardBody className="grid gap-6">
        <div className="grid gap-5">
          <Field label="Food" className="sm:max-w-xs">
            <Select value={form.diet} disabled={disabled} onChange={(e) => update({ diet: e.target.value })}>
              {DIETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </Field>
          <RadioCards<Alcohol>
            legend="Alcohol"
            name="silent-prefs-alcohol"
            columns={2}
            value={form.alcohol as Alcohol}
            onChange={(alcohol) => update({ alcohol })}
            options={ALCOHOL.map((option) => ({ ...option, disabled }))}
            className="sm:max-w-md [&_label]:py-2.5"
          />
        </div>
        <div className="grid gap-2">
          <ChipGroup label="Activities you'd rather skip">
            {TAGS.map((tag) => (
              <ToggleChip key={tag} selected={form.skipTags.includes(tag)} disabled={disabled} onSelectedChange={() => toggleTag(tag)}>
                {capitalize(tag)}
              </ToggleChip>
            ))}
          </ChipGroup>
          <p className="type-small m-0 text-ink-muted">You won&apos;t pay for skipped activities. The others still go.</p>
        </div>
      </CardBody>
      <CardFooter>
        <p className="type-small m-0 flex items-center gap-1.5 text-ink-muted" role="status">
          {notice ? (
            <>
              <icons.success className="size-4 text-success" strokeWidth={2} aria-hidden />
              <span className="font-semibold text-success-ink">{notice}</span>
            </>
          ) : dirty ? 'You have unsaved changes' : null}
        </p>
        <Button variant="secondary" disabled={disabled || !dirty} onClick={save} icon={icons.check}>Save preferences</Button>
      </CardFooter>
    </Card>
  );
}
