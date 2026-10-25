'use client';
// Step 1: get everyone in. Invite link, join requests, who's joined, and the demo-travellers testing helper.
import { useEffect, useState } from 'react';
import { FlaskConical, RefreshCw, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarStack } from '@/components/ui/avatar';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { icons } from '@/components/ui/icons';
import { plural } from '@/lib/format';
import { approvedCount, avatarName, inviteMessage, inviteUrl, memberList, openWhatsApp } from './tripState';

interface InvitePanelProps {
  trip: any;
  owner: boolean;
  invite: string;
  disabled: boolean;
  command: (command: any) => Promise<boolean>;
}

function InviteLink({ trip, invite }: { trip: any; invite: string }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(inviteUrl(invite)), [invite]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <div className="grid gap-3">
      <div className="flex min-w-0 items-center gap-2 rounded-xl bg-surface-muted px-3.5 py-3">
        <icons.link className="size-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
        <span className="type-small min-w-0 flex-1 truncate text-ink-soft" title={url}>
          {url}
        </span>
      </div>
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <Button variant="whatsapp" icon={icons.whatsapp} onClick={() => openWhatsApp(inviteMessage(trip.name, inviteUrl(invite)))}>
          Share on WhatsApp
        </Button>
        <Button
          variant="outline"
          icon={copied ? icons.check : icons.copy}
          onClick={() => navigator.clipboard.writeText(inviteUrl(invite)).then(() => setCopied(true))}
        >
          {copied ? 'Link copied' : 'Copy link'}
        </Button>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {copied ? 'Invite link copied' : ''}
      </p>
    </div>
  );
}

export function InvitePanel({ trip, owner, invite, disabled, command }: InvitePanelProps) {
  const members = memberList(trip);
  const joined = approvedCount(trip);
  const open = Math.max(0, trip.expectedSize - joined);
  const requests: any[] = trip.pendingRequests || [];
  const canInvite = trip.phase === 'collecting';

  return (
    <Card>
      <CardHeader
        icon={icons.invite}
        title={open > 0 ? 'Get everyone in' : 'Everyone is in'}
        description={
          open > 0
            ? owner
              ? `Share the link. You let each person in. ${plural(open, 'spot')} left.`
              : `Waiting for ${plural(open, 'more person', 'more people')} to join.`
            : `All ${trip.expectedSize} spots are filled.`
        }
      />
      <CardBody className="grid gap-6">
        {/* Who's in */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <AvatarStack names={members.map((m: any) => avatarName(m.nickname))} max={6} />
              <span className="type-small font-semibold text-ink">
                {joined} of {trip.expectedSize} joined
              </span>
            </div>
            {open === 0 ? <StatusPill status="ok">Full</StatusPill> : <StatusPill status="pending">{plural(open, 'spot')} open</StatusPill>}
          </div>
          <Progress label="People joined" value={joined} max={trip.expectedSize} size="sm" />
        </div>

        {/* Join requests (organizer only) */}
        {owner && requests.length > 0 && (
          <div className="grid gap-2">
            <h4 className="type-small m-0 font-bold text-ink">Asking to join</h4>
            <ul className="m-0 grid list-none gap-2 p-0">
              {requests.map((member: any) => (
                <li key={member.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={avatarName(member.nickname)} size="sm" status="pending" />
                    <span className="type-body truncate font-semibold text-ink">{member.nickname}</span>
                  </span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="ghost" disabled={disabled} onClick={() => command({ type: 'rejectMember', memberUid: member.uid })}>
                      Decline
                    </Button>
                    <Button size="sm" icon={icons.check} disabled={disabled} onClick={() => command({ type: 'admitMember', memberUid: member.uid })}>
                      Let in
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Invite link */}
        {invite && canInvite && <InviteLink trip={trip} invite={invite} />}
        {owner && canInvite && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="type-small m-0 text-ink-muted">
              {invite ? 'A new link stops the old one from working.' : 'Links are shown once for safety. Make a new one to share.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={invite ? 'outline' : 'secondary'} icon={RefreshCw} disabled={disabled} onClick={() => command({ type: 'rotateInvite' })}>
                {invite ? 'New link' : 'Make invite link'}
              </Button>
              <Button size="sm" variant="ghost" icon={Ban} disabled={disabled} onClick={() => command({ type: 'revokeInvite' })}>
                Turn off link
              </Button>
            </div>
          </div>
        )}

        {/* Testing helper */}
        {owner && trip.phase === 'collecting' && open > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 size-5 shrink-0 text-ink-muted" strokeWidth={1.75} aria-hidden />
              <div>
                <p className="type-small m-0 flex flex-wrap items-center gap-2 font-semibold text-ink">
                  Try it alone <Badge size="sm">Testing helper</Badge>
                </p>
                <p className="type-small m-0 mt-0.5 text-ink-muted">Fill the empty spots with pretend travellers.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" icon={FlaskConical} disabled={disabled} onClick={() => command({ type: 'addDemoMembers' })}>
              Add demo travellers
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function PendingApproval() {
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 py-10 text-center sm:py-12">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <icons.pending className="size-6" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="type-h2 m-0">Waiting for the organizer</h2>
        <p className="type-body m-0 max-w-prose text-ink-muted">They need to let you in. This page updates by itself as soon as they do.</p>
        <StatusPill status="pending">Request sent</StatusPill>
      </CardBody>
    </Card>
  );
}
