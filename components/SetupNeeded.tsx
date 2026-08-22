export function SetupNeeded() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="num text-[11px] uppercase tracking-[0.24em] text-[var(--fg2)]">
        Founder Deck · not configured
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Two environment variables to go</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--fg2)]">
        The app is deployed but has no database connection yet. Add these in your Vercel project
        under <strong>Settings → Environment Variables</strong>, then redeploy.
      </p>
      <pre className="num mt-5 overflow-x-auto rounded-lg border bg-[var(--bg2)] p-4 text-[12px] leading-relaxed hairline">
{`DATABASE_URL        = your Neon connection string
NEXT_PUBLIC_SITE_URL = https://your-domain.vercel.app
SIMULATE_PAYMENTS    = 1`}
      </pre>
      <p className="mt-4 text-[13px] leading-relaxed text-[var(--fg2)]">
        Then run <code className="num">npm run db:push</code> and{" "}
        <code className="num">npm run db:seed</code> locally once, pointed at the same database, to
        create the tables and the starter deck.
      </p>
    </main>
  );
}
