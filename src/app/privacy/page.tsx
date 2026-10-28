import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Back of the Box",
  description: "What Back of the Box collects, why, and who it is shared with.",
};

const H2 = "mt-8 font-display text-xl text-ink";
const P = "mt-2 text-ink-soft";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Back of the Box
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Privacy Policy</h1>
      <p className="mt-1 text-sm text-ink-soft">Last updated October 28, 2026</p>
      <p className={P}>
        Back of the Box makes a daily printable page of puzzles, facts and news for kids, and emails it to a parent. This page explains
        what we collect to do that, and what we do with it. The short version: we collect the minimum, we don&rsquo;t sell it, and kids
        never have accounts.
      </p>

      <h2 className={H2}>Who this is for</h2>
      <p className={P}>
        Back of the Box is used by parents and guardians. Children do not sign in, and we don&rsquo;t knowingly collect information
        directly from children. A parent creates each page and chooses what goes in it.
      </p>

      <h2 className={H2}>What we collect</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
        <li>
          <strong className="text-ink">Your Google account email</strong> when you sign in with Google. We use it to identify your account and to send
          the daily email. We don&rsquo;t store your Google profile name or photo.
        </li>
        <li>
          <strong className="text-ink">What you enter</strong>: each page&rsquo;s first name or nickname for the child (you can use any name you like), an age
          range, the modules you choose, delivery time and time zone, the email address it&rsquo;s sent to, and your weather city or ZIP,
          favorite sports teams and stock tickers if you add them.
        </li>
        <li>
          <strong className="text-ink">Google Calendar events (optional)</strong>: if you turn on the Calendar module, we ask Google for read-only access to
          your calendars so we can show today&rsquo;s events on the page. We only read event titles and times for the calendar you pick, and only
          to build that page. We don&rsquo;t change anything in your calendar.
        </li>
        <li>
          <strong className="text-ink">Billing information</strong>: payments are handled by Stripe. We never see or store your card number. We keep your plan,
          subscription status and Stripe customer ID.
        </li>
        <li>
          <strong className="text-ink">Support messages</strong> you send us through the help chat or by email.
        </li>
        <li>
          <strong className="text-ink">Basic usage and delivery logs</strong>, such as which days a page was delivered and error logs, to keep the service running.
        </li>
      </ul>

      <h2 className={H2}>How we use it</h2>
      <p className={P}>
        To sign you in, build and deliver each daily page, run your subscription, answer support requests, and keep the service working
        and safe. We don&rsquo;t use your information for advertising and we don&rsquo;t sell or rent it.
      </p>

      <h2 className={H2}>Who we share it with</h2>
      <p className={P}>Only the services that help us run Back of the Box, and only what they need:</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
        <li>Google, for sign-in and (if you enable it) read-only Calendar access.</li>
        <li>Stripe, to take payments.</li>
        <li>Resend, to send the daily email.</li>
        <li>Supabase and Vercel, to store your data and host the app.</li>
        <li>
          Anthropic, whose AI models rewrite news into kid-friendly text and power the help chat. News rewriting doesn&rsquo;t use your
          personal information. Messages you type into the help chat are sent to Anthropic to generate a reply.
        </li>
        <li>Law enforcement or others only if the law requires it.</li>
      </ul>
      <p className={P}>
        Our use of information received from Google APIs follows the{" "}
        <a
          className="font-semibold text-stamp hover:underline"
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Calendar data is used only to show your events on your page. It is never used for advertising, sold, or used to
        train AI models.
      </p>

      <h2 className={H2}>How long we keep it</h2>
      <p className={P}>
        We keep your account data while your account is open. Delete a page and its settings go with it. To close your account and delete
        everything, email us and we&rsquo;ll do it. We may keep billing records as long as the law requires.
      </p>

      <h2 className={H2}>Your choices</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
        <li>Ask to see, correct or delete your data any time by emailing us.</li>
        <li>Turn off the Calendar module, or remove Back of the Box&rsquo;s access at myaccount.google.com/permissions.</li>
        <li>Unsubscribe or pause by making a page inactive, or cancel your plan on the Plan page.</li>
      </ul>

      <h2 className={H2}>Security</h2>
      <p className={P}>
        Data is stored with reputable providers and sent over HTTPS. No system is perfectly secure, so we can&rsquo;t promise absolute
        security, but we take reasonable steps to protect your information.
      </p>

      <h2 className={H2}>Changes</h2>
      <p className={P}>If we change this policy in a meaningful way we&rsquo;ll update the date above and, where appropriate, tell you by email.</p>

      <h2 className={H2}>Contact</h2>
      <p className={P}>
        Questions or requests: <a className="font-semibold text-stamp hover:underline" href="mailto:support@backofthebox.xyz">support@backofthebox.xyz</a>.
      </p>
      <p className="mt-8 text-sm text-ink-soft">
        See also our <Link className="font-semibold text-stamp hover:underline" href="/terms">Terms of Service</Link>.
      </p>
    </main>
  );
}
