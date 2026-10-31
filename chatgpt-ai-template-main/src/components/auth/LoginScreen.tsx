'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Users,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import FermatMark from '../landing/FermatMark';
import { Button } from '../ui/button';
import { Card, CardBody, CardHeader } from '../ui/card';
import { Field, Input } from '../ui/field';
import { Notice } from '../ui/notice';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import '../../../app/(marketing)/landing.css';

type Mode = 'login' | 'signup';

const copy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Pick up your trips, votes and group plans where you left off.',
    submit: 'Log in',
  },
  signup: {
    title: 'Plan better trips together',
    subtitle:
      'Create an account to plan, vote and stay inside everyone’s budget.',
    submit: 'Create account',
  },
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function ProductPanel() {
  const checklist = [
    'Dates everyone can make',
    'A destination the group chose',
    'A plan inside the shared budget',
  ];

  return (
    <aside className="relative hidden overflow-hidden rounded-2xl border border-solid border-brand-800 bg-brand-950 p-8 text-white shadow-pop lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-24 size-96 rounded-full bg-warm-400/10 blur-3xl"
      />

      <div className="relative max-w-lg">
        <span className="type-overline text-brand-200">
          Built for group trips
        </span>
        <h2 className="type-display mt-5 !text-white">
          One trip.
          <br />
          Everyone heard.
        </h2>
        <p className="type-lead mt-5 max-w-md text-white/70">
          Replace the endless group chat with one clear place to choose dates,
          vote on destinations and build the plan.
        </p>
      </div>

      <Card className="relative mt-10 max-w-xl border-white/10 bg-white/95 text-ink shadow-pop">
        <CardHeader
          icon={Users}
          title="Goa long weekend"
          description="4 travellers · 3 nights"
          action={
            <span className="rounded-md bg-success-soft px-2.5 py-1 text-xs font-semibold text-success-ink">
              Ready to plan
            </span>
          }
        />
        <CardBody className="grid gap-3">
          {checklist.map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-lg bg-surface-muted px-3.5 py-3"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-600 text-white">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
              <span className="type-small font-medium text-ink">{item}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <p className="relative mt-8 flex items-center gap-2 text-sm text-white/60">
        <LockKeyhole className="size-4" aria-hidden /> Your personal budget
        stays private.
      </p>
    </aside>
  );
}

export default function LoginScreen({
  onGoogleSignIn,
}: {
  onGoogleSignIn: () => Promise<void>;
}) {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<'email' | 'google' | 'reset' | null>(
    null,
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const t = copy[mode];

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const run = async (
    kind: 'email' | 'google' | 'reset',
    action: () => Promise<void>,
  ) => {
    setPending(kind);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e: any) {
      if (kind !== 'google')
        setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setPending(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    run('email', () =>
      mode === 'signup'
        ? signUpWithEmail(name.trim(), email.trim(), password)
        : signInWithEmail(email.trim(), password),
    );
  };

  const handleReset = () => {
    if (!email.trim()) {
      setError('Enter your email above and we will send you a reset link.');
      return;
    }
    run('reset', async () => {
      await resetPassword(email.trim());
      setNotice(`Reset link sent to ${email.trim()}. Check your inbox.`);
    });
  };

  return (
    <div className="landing fixed inset-0 z-[1500] overflow-y-auto bg-canvas">
      <div className="grid min-h-full gap-4 p-4 lg:grid-cols-[minmax(420px,0.78fr)_1.22fr]">
        <section className="flex min-h-[calc(100dvh-2rem)] flex-col rounded-2xl border border-solid border-line bg-surface px-5 py-5 shadow-sm sm:px-9 sm:py-7">
          <header className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-ink no-underline"
            >
              <FermatMark className="h-7 text-brand-900" />
              Fermat
            </Link>
            <Button asChild variant="ghost" size="sm" icon={ArrowLeft}>
              <Link href="/">Home</Link>
            </Button>
          </header>

          <main className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center py-10 text-left">
            <div className="mb-8">
              <h1 className="type-h1 m-0">{t.title}</h1>
              <p className="type-body mb-0 mt-2 text-ink-muted">{t.subtitle}</p>
            </div>

            <Tabs
              value={mode}
              onValueChange={(value) => switchMode(value as Mode)}
            >
              <TabsList
                className="grid w-full grid-cols-2"
                aria-label="Log in or sign up"
              >
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <Field label="Name">
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="What should we call you?"
                    autoComplete="name"
                    required
                  />
                </Field>
              )}

              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field
                label="Password"
                aside={
                  mode === 'login' ? (
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={pending !== null}
                      className="cursor-pointer border-0 bg-transparent p-0 font-sans text-xs font-semibold text-brand-700 hover:underline disabled:opacity-60"
                    >
                      {pending === 'reset' ? 'Sending…' : 'Forgot password?'}
                    </button>
                  ) : undefined
                }
              >
                <span className="relative block">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    className="pr-11"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      mode === 'signup'
                        ? 'At least 6 characters'
                        : 'Your password'
                    }
                    autoComplete={
                      mode === 'signup' ? 'new-password' : 'current-password'
                    }
                    minLength={mode === 'signup' ? 6 : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center border-0 bg-transparent text-ink-muted hover:text-ink"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </span>
              </Field>

              {error && <Notice tone="danger">{error}</Notice>}
              {notice && <Notice tone="success">{notice}</Notice>}

              <Button
                type="submit"
                block
                loading={pending === 'email'}
                disabled={pending !== null}
              >
                {t.submit}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
              <span className="h-px flex-1 bg-line" />
              or continue with
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button
              type="button"
              variant="outline"
              block
              onClick={() => run('google', onGoogleSignIn)}
              disabled={pending !== null}
            >
              {pending === 'google' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              {pending === 'google' ? 'Opening Google…' : 'Google'}
            </Button>

            <p className="type-caption mb-0 mt-6 text-center text-ink-muted">
              By continuing, you agree to Fermat’s terms and privacy policy.
            </p>
          </main>

          <footer className="type-caption text-ink-muted">
            © {new Date().getFullYear()} Fermat
          </footer>
        </section>

        <ProductPanel />
      </div>
    </div>
  );
}
