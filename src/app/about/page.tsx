import Link from "next/link";
import { AppNav } from "@/components/AppNav";

export const metadata = {
  title: "About | Back of the Box",
  description: "Back of the Box is built by a dad and his son: a fresh printed puzzle page every morning, with no screen.",
};

export default function AboutPage() {
  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Built by a dad and his son, for families</h1>
        <div className="mt-6 grid items-start gap-6 md:grid-cols-[0.9fr_1.1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dad-and-son.jpg"
            alt="An illustration of a dad and his son grinning in front of a space shuttle"
            className="w-full rounded-2xl border border-rule shadow-sm"
          />
          <div className="space-y-3 leading-relaxed text-ink-soft">
            <p>
              We love puzzles. Mazes, crosswords, a good riddle over breakfast. We wanted something to do together in
              the morning that wasn&apos;t a screen.
            </p>
            <p>
              Remember when the morning had a newspaper on the table, a pencil nearby, and nobody was scrolling? That&apos;s
              the feeling we&apos;re after. So we made it together: a page that&apos;s printed fresh every day, just for the
              kid reading it.
            </p>
            <p>
              The news is real, rewritten for your kid&apos;s age and checked against the original. There are no ads, and
              kids never need an account. Questions or ideas? Use the Help button, we read every message.
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/#sample" className="btn-primary">Try a free sample page</Link>
          <Link href="/faq" className="btn-secondary">Read the FAQ</Link>
        </div>
      </main>
    </>
  );
}
