import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  avatarUrl,
  displayName,
  sendPasswordReset,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
  useAuth,
} from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { Notice, PageHeader, Section, buttonClass } from "../components/ui";

const fieldClass =
  "w-full rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand";

/** Supabase's own default floor is six; eight is ours, and the form says so. */
const MIN_PASSWORD = 8;

/** Google's mark, drawn rather than loaded — no third-party request for a logo. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-ink-soft/80">{hint}</p>}
    </div>
  );
}

type Mode = "signin" | "signup" | "forgot";

/**
 * Supabase error text is written for developers. These are the handful a
 * visitor can actually hit, in words they can act on; anything else falls
 * through as-is rather than being flattened into a useless "something went
 * wrong".
 */
function readable(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "That email and password don't match an account. Check them, or create an account below.";
  }
  if (m.includes("email not confirmed")) {
    return "Your account isn't confirmed yet — open the link in the email we sent you.";
  }
  if (m.includes("password should be")) {
    return `Pick a password of at least ${MIN_PASSWORD} characters.`;
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "There is already an account for that address. Sign in instead, or reset the password.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts just now. Wait a minute and try again.";
  }
  return message;
}

/**
 * One door for everybody.
 *
 * Three ways in, because a wholesale buyer who cannot get past this page never
 * sees a price: Google for the people who would rather not invent a password,
 * an email account for the people who would rather not hand Google their
 * business, and a recovery link for the ones who forgot. Staff use the same
 * form — an admin is an ordinary account with a row in `admins`.
 */
export function LoginPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  // Supabase sends people back here signed in to a short-lived recovery
  // session. That is not "logged in and done" — it is "prove it by setting a
  // password" — so the usual redirect has to stand down until they have.
  const recovery = params.get("recovery") === "1";

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [recoveryDone, setRecoveryDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Where a signed-in visitor actually wanted to be: back where they came
  // from, or the dashboard if this is a staff account.
  useEffect(() => {
    if (!session) return;
    if (recovery && !recoveryDone) return;
    if (next) navigate(next, { replace: true });
    else if (isAdmin) navigate("/admin", { replace: true });
  }, [session, isAdmin, next, navigate, recovery, recoveryDone]);

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
    setPassword("");
  };

  const withGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      // Leaves the page for Google, so `busy` is never cleared on success.
      await signInWithGoogle(next ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();

    if (mode === "signup") {
      if (!name.trim()) return setError("Tell us your name so we know who we're quoting.");
      if (password.length < MIN_PASSWORD) {
        return setError(`Pick a password of at least ${MIN_PASSWORD} characters.`);
      }
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(trimmedEmail, password);
      } else if (mode === "signup") {
        const { needsConfirmation, alreadyRegistered } = await signUp(
          name,
          trimmedEmail,
          password
        );
        if (alreadyRegistered) {
          switchTo("signin");
          setEmail(trimmedEmail);
          setNotice(
            "There is already an account for that address. Sign in below, or reset the password."
          );
        } else if (needsConfirmation) {
          setNotice(
            `Account created. We've emailed ${trimmedEmail} a confirmation link — open it and you're in.`
          );
        }
        // With email confirmation switched off the session arrives here and
        // the redirect effect takes it from there.
      } else {
        await sendPasswordReset(trimmedEmail);
        setNotice(
          `If an account exists for ${trimmedEmail}, a reset link is on its way. It expires in an hour.`
        );
      }
    } catch (err) {
      setError(readable(err instanceof Error ? err.message : "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < MIN_PASSWORD) {
      return setError(`Pick a password of at least ${MIN_PASSWORD} characters.`);
    }
    setBusy(true);
    try {
      await updatePassword(newPassword);
      setNotice("Password updated. You're signed in.");
      setRecoveryDone(true);
    } catch (err) {
      setError(readable(err instanceof Error ? err.message : "Could not set that password."));
    } finally {
      setBusy(false);
    }
  };

  const user = session?.user;
  const avatar = avatarUrl(user);
  const settingNewPassword = Boolean(session) && recovery && !recoveryDone;

  const heading = {
    signin: "Sign in to see wholesale prices.",
    signup: "Create your trade account.",
    forgot: "Reset your password.",
  }[mode];

  const intro = {
    signin:
      "Trade pricing is for account holders. Sign in and every price on the site unlocks.",
    signup:
      "Free, and it takes a minute. An account unlocks case pricing across the range and keeps your orders and enquiries together.",
    forgot: "Tell us the address on your account and we'll send you a link to set a new password.",
  }[mode];

  return (
    <>
      <PageHeader
        kicker={session ? "Your account" : "Trade account"}
        title={session && !settingNewPassword ? "Your prices are unlocked." : heading}
        intro={
          session && !settingNewPassword
            ? "Case rates and per-piece costs are visible across the site, your details fill themselves in at checkout, and everything you send is kept against your account."
            : intro
        }
        tone="dim"
      />

      <Section className="bg-paper pt-8 md:pt-14">
        <div className="mx-auto max-w-md">
          {!isSupabaseConfigured ? (
            <Notice tone="warn">
              <strong className="font-semibold">Sign-in isn&apos;t connected yet.</strong> Add your
              Supabase URL and anon key to <code className="font-mono text-xs">.env.local</code>,
              then restart the dev server. See <code className="font-mono text-xs">README.md</code>{" "}
              for the full setup.
            </Notice>
          ) : settingNewPassword ? (
            <form
              onSubmit={submitNewPassword}
              className="rounded-[2rem] border border-ink/10 bg-white p-7 shadow-xl shadow-ink/5 md:p-8"
            >
              <h2 className="font-display text-xl font-medium text-ink">Set a new password</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                This link signed you in. Choose a password and we&apos;ll keep you here.
              </p>
              <div className="mt-6">
                <Field id="new-password" label="New password" hint={`At least ${MIN_PASSWORD} characters.`}>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={fieldClass}
                    placeholder="••••••••"
                  />
                </Field>
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm font-medium text-brand">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className={buttonClass("primary", "mt-5 w-full !py-3.5")}
              >
                {busy ? "Saving…" : "Save password"}
              </button>
            </form>
          ) : session ? (
            <div className="rounded-[2rem] border border-ink/10 bg-white p-7 shadow-xl shadow-ink/5 md:p-8">
              <div className="flex items-center gap-4">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    width={56}
                    height={56}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-display grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-xl font-semibold text-brand-dark">
                    {displayName(user).slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-display truncate text-lg font-medium text-ink">
                    {displayName(user)}
                  </p>
                  {user?.email && <p className="truncate text-sm text-ink-soft">{user.email}</p>}
                </div>
              </div>

              {notice && (
                <p className="mt-5 rounded-xl bg-brand-tint px-4 py-3 text-sm text-brand-dark">
                  {notice}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {isAdmin && (
                  <Link to="/admin" className={buttonClass("primary")}>
                    Open the dashboard
                  </Link>
                )}
                <Link to="/account" className={buttonClass(isAdmin ? "outline" : "primary")}>
                  Your quotes &amp; orders
                </Link>
                <Link to="/shop" className={buttonClass("outline")}>
                  Go to the shop
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={buttonClass("quiet")}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5 sm:p-7 md:p-8">
              <button
                type="button"
                onClick={() => void withGoogle()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleMark />
                {busy ? "Working…" : "Continue with Google"}
              </button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft/60">
                  or use email
                </span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              {mode !== "forgot" && (
                <div
                  role="tablist"
                  aria-label="Email account"
                  className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-paper-dim p-1"
                >
                  {(
                    [
                      ["signin", "Sign in"],
                      ["signup", "Create account"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={mode === value}
                      onClick={() => switchTo(value)}
                      className={`rounded-full px-4 py-2 text-[13px] font-bold transition ${
                        mode === value
                          ? "bg-brand text-white shadow-sm shadow-brand/25"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={submit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <Field id="signup-name" label="Full name">
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={fieldClass}
                      placeholder="Priya Sharma"
                    />
                  </Field>
                )}

                <Field id="login-email" label="Email">
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="you@company.com"
                  />
                </Field>

                {mode !== "forgot" && (
                  <Field
                    id="login-password"
                    label="Password"
                    hint={mode === "signup" ? `At least ${MIN_PASSWORD} characters.` : undefined}
                  >
                    <input
                      id="login-password"
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={mode === "signup" ? MIN_PASSWORD : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={fieldClass}
                      placeholder="••••••••"
                    />
                  </Field>
                )}

                {error && (
                  <p role="alert" className="text-sm font-medium text-brand">
                    {error}
                  </p>
                )}
                {notice && (
                  <p
                    role="status"
                    className="rounded-xl bg-brand-tint px-4 py-3 text-sm leading-relaxed text-brand-dark"
                  >
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className={buttonClass("primary", "mt-1 w-full !py-3.5")}
                >
                  {busy
                    ? "Working…"
                    : mode === "signin"
                      ? "Sign in"
                      : mode === "signup"
                        ? "Create account"
                        : "Email me a reset link"}
                </button>
              </form>

              <div className="mt-4 text-center text-xs text-ink-soft">
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchTo("forgot")}
                    className="font-semibold text-ink-soft transition hover:text-brand"
                  >
                    Forgotten your password?
                  </button>
                )}
                {mode === "forgot" && (
                  <button
                    type="button"
                    onClick={() => switchTo("signin")}
                    className="font-semibold text-ink-soft transition hover:text-brand"
                  >
                    ← Back to sign in
                  </button>
                )}
                {mode === "signup" && (
                  <p>
                    By creating an account you agree that we may contact you about your
                    enquiries and orders.
                  </p>
                )}
              </div>

              <ul className="mt-6 flex flex-col gap-2.5 border-t border-ink/10 pt-5">
                {[
                  "Case prices, per-piece rates and current offers",
                  "Order totals with GST, and online payment",
                  "Your enquiries and orders kept in one place",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-brand"
                    >
                      <path
                        d="M3.5 8.5 6.5 11.5 12.5 4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session && !isAdmin && !loading && (
            <p className="mt-6 text-center text-xs text-ink-soft/80">
              Dashboard access is granted separately — a staff account has to be listed in the{" "}
              <code className="font-mono">admins</code> table.
            </p>
          )}

          <p className="mt-8 text-center text-sm text-ink-soft">
            {session ? "Ready to order?" : "Don't want an account?"}{" "}
            <Link to="/shop" className="font-semibold text-brand hover:underline">
              {session ? "Browse the shop" : "Browse the range and send an enquiry"}
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
