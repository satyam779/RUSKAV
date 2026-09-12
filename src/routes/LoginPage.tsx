import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { avatarUrl, displayName, signIn, signInWithGoogle, signOut, useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import { Notice, PageHeader, Section, buttonClass } from "../components/ui";

const fieldClass =
  "rounded-xl border border-ink/12 bg-paper-dim/60 px-4 py-3 text-sm text-ink transition placeholder:text-ink-soft/60 focus:border-brand";

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

/**
 * One door for everybody.
 *
 * Customers sign in with Google — no password to invent, no account to
 * confirm. Staff can do the same, and the password form stays behind a
 * disclosure for accounts created directly in the Supabase dashboard, which is
 * also the way back in if Google is ever misconfigured.
 */
export function LoginPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Where a signed-in visitor actually wanted to be: back where they came
  // from, or the dashboard if this is a staff account.
  useEffect(() => {
    if (!session) return;
    if (next) navigate(next, { replace: true });
    else if (isAdmin) navigate("/admin", { replace: true });
  }, [session, isAdmin, next, navigate]);

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
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  const user = session?.user;
  const avatar = avatarUrl(user);

  return (
    <>
      <PageHeader
        kicker={session ? "Your account" : "Sign in"}
        title={session ? "You're signed in." : "Sign in to Ruskav."}
        intro={
          session
            ? "Your details fill themselves in at checkout, and everything you send is kept against your account."
            : "Sign in with Google to keep your orders and enquiries together. You can still order as a guest without an account."
        }
        tone="dim"
      />

      <Section className="bg-paper pt-10 md:pt-14">
        <div className="mx-auto max-w-md">
          {!isSupabaseConfigured ? (
            <Notice tone="warn">
              <strong className="font-semibold">Sign-in isn&apos;t connected yet.</strong> Add your
              Supabase URL and anon key to <code className="font-mono text-xs">.env.local</code>,
              then restart the dev server. See <code className="font-mono text-xs">README.md</code>{" "}
              for the full setup.
            </Notice>
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

              <div className="mt-7 flex flex-wrap gap-3">
                {isAdmin && (
                  <Link to="/admin" className={buttonClass("primary")}>
                    Open the dashboard
                  </Link>
                )}
                <Link to="/shop" className={buttonClass(isAdmin ? "outline" : "primary")}>
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
            <div className="rounded-[2rem] border border-ink/10 bg-white p-7 shadow-xl shadow-ink/5 md:p-8">
              <button
                type="button"
                onClick={() => void withGoogle()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleMark />
                {busy ? "Opening Google…" : "Continue with Google"}
              </button>
              <p className="mt-3 text-center text-xs text-ink-soft">
                First time? Signing in creates your account — there is nothing else to fill in.
              </p>

              {error && (
                <p role="alert" className="mt-4 text-sm font-medium text-brand">
                  {error}
                </p>
              )}

              {showPassword ? (
                <form onSubmit={submit} className="mt-7 border-t border-ink/10 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/70">
                    Staff sign-in
                  </p>
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-email" className="text-sm font-medium text-ink">
                        Email
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={fieldClass}
                        placeholder="you@ruskav.com"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="login-password" className="text-sm font-medium text-ink">
                        Password
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={fieldClass}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className={buttonClass("primary", "mt-5 w-full !py-3.5")}
                  >
                    {busy ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPassword(true)}
                  className="mt-6 block w-full text-center text-xs font-semibold text-ink-soft transition hover:text-brand"
                >
                  Staff: sign in with a password instead
                </button>
              )}
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
              {session ? "Browse the shop" : "Order as a guest"}
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
