import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Back of the Box",
  description: "The rules for using Back of the Box.",
};

const H2 = "mt-8 font-display text-xl text-ink";
const P = "mt-2 text-ink-soft";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Back of the Box
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Terms of Service</h1>
      <p className="mt-1 text-sm text-ink-soft">Last updated October 28, 2026</p>
      <p className={P}>
        These terms cover your use of Back of the Box (the &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to them. If you
        don&rsquo;t agree, please don&rsquo;t use it.
      </p>

      <h2 className={H2}>The Service</h2>
      <p className={P}>
        Back of the Box creates a daily printable page of puzzles, facts and kid-friendly news, delivered by email or from the app. It is
        made for parents and guardians to use with their children. You must be 18 or older, or the age of majority where you live, to create an account.
      </p>

      <h2 className={H2}>Your account</h2>
      <p className={P}>
        You sign in with Google. You&rsquo;re responsible for activity on your account and for the information you put into it. Please use a first name or
        nickname for your child, not their full name or other personal details.
      </p>

      <h2 className={H2}>Free trial, plans and billing</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-ink-soft">
        <li>New accounts get a free first month. It starts when you first open the app.</li>
        <li>After that, a paid plan is needed to keep pages active and delivered. Plans are billed yearly or quarterly through Stripe, and renew automatically until you cancel.</li>
        <li>Prices and plan limits are shown on the Plan page. We may change prices going forward, and we&rsquo;ll give notice before a change applies to your renewal.</li>
        <li>You can cancel any time from the Plan page. Your plan stays active until the end of the period you&rsquo;ve paid for. Except where the law requires otherwise, payments are non-refundable, though if something went wrong, email us and we&rsquo;ll try to make it right.</li>
        <li>Access codes give free time and have no cash value. We may end a code that is abused.</li>
      </ul>

      <h2 className={H2}>Acceptable use</h2>
      <p className={P}>
        Don&rsquo;t misuse the Service: no trying to break or overload it, access other people&rsquo;s accounts, scrape it, or use it for anything unlawful. Don&rsquo;t resell or
        republish the content at scale. Printing pages for your own family, classroom or friends is fine.
      </p>

      <h2 className={H2}>Content</h2>
      <p className={P}>
        We create the puzzles, facts and text. News items are rewritten from public sources into kid-friendly summaries using AI, and we
        credit the sources where we can. We work to keep content age-appropriate, but AI-written text can occasionally be wrong or miss the mark,
        so please look pages over for your own child. Back of the Box is an activity, not educational, medical, legal or financial advice. Stock and sports
        modules are for fun and are not investment advice.
      </p>

      <h2 className={H2}>Third-party services</h2>
      <p className={P}>
        The Service relies on providers such as Google, Stripe, Resend and Anthropic. Their own terms apply to how you use their parts. We aren&rsquo;t responsible
        for outages or changes on their side, including delayed or missed emails.
      </p>

      <h2 className={H2}>Availability and changes</h2>
      <p className={P}>
        We&rsquo;re still growing, and features may change, pause or be removed. We aim for reliable daily delivery but can&rsquo;t guarantee uninterrupted service.
      </p>

      <h2 className={H2}>Ending your account</h2>
      <p className={P}>
        You can stop using the Service or ask us to delete your account at any time. We may suspend or close accounts that break these terms.
      </p>

      <h2 className={H2}>Disclaimer and liability</h2>
      <p className={P}>
        The Service is provided &ldquo;as is&rdquo; without warranties of any kind. To the fullest extent the law allows, Back of the Box isn&rsquo;t liable for indirect or consequential
        losses, and our total liability for any claim is limited to the amount you paid us in the 12 months before the claim.
      </p>

      <h2 className={H2}>Changes to these terms</h2>
      <p className={P}>
        We may update these terms. If a change is meaningful we&rsquo;ll update the date above and, where appropriate, let you know. Continuing to use the Service after a change means you accept it.
      </p>

      <h2 className={H2}>Contact</h2>
      <p className={P}>
        Questions: <a className="font-semibold text-stamp hover:underline" href="mailto:support@backofthebox.xyz">support@backofthebox.xyz</a>.
      </p>
      <p className="mt-8 text-sm text-ink-soft">
        See also our <Link className="font-semibold text-stamp hover:underline" href="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
