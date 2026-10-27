import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="shell">
      <SiteHeader
        trailing={
          <>
            <Link href="/login" className="btn btn--ghost">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn--primary">
              Create account
            </Link>
          </>
        }
      />

      <main className="shell__main">
        <div className="page">
          <section className="hero">
            <div>
              <p className="hero__kicker">Evidence over claims</p>
              <h1 className="display">Show the work. Keep the proof.</h1>
              <p className="lede">
                Zigba is a professional network for students and graduates who
                can demonstrate skill through projects — and for employers who
                are checked before they post a job.
              </p>
              <div className="hero__actions">
                <Link href="/signup" className="btn btn--primary">
                  Join as candidate or employer
                </Link>
                <Link href="/dashboard" className="btn btn--secondary">
                  Go to dashboard
                </Link>
              </div>
            </div>

            <ol className="ledger" aria-label="Evidence states">
              <li className="ledger__row">
                <span className="ledger__index">01</span>
                <div>
                  <p className="ledger__label">Self-reported</p>
                  <p className="ledger__note">You declared the skill. Nothing has been reviewed yet.</p>
                </div>
              </li>
              <li className="ledger__row">
                <span className="ledger__index">02</span>
                <div>
                  <p className="ledger__label">Evidence submitted</p>
                  <p className="ledger__note">A repository, demo, report, or file is attached.</p>
                </div>
              </li>
              <li className="ledger__row">
                <span className="ledger__index">03</span>
                <div>
                  <p className="ledger__label">Evidence reviewed</p>
                  <p className="ledger__note">The record states exactly what was examined, and what was not.</p>
                </div>
              </li>
              <li className="ledger__row">
                <span className="ledger__index">04</span>
                <div>
                  <p className="ledger__label">Independently confirmed</p>
                  <p className="ledger__note">An issuer, collaborator, or assessment supports a specific claim.</p>
                </div>
              </li>
            </ol>
          </section>

          <section className="section">
            <h2>Built for first proof, not first title</h2>
            <ul className="facts">
              <li>
                <strong>Beginners belong here</strong>
                <span>No job history required. Projects, coursework, and self-taught work count.</span>
              </li>
              <li>
                <strong>Precise language</strong>
                <span>A badge never means “expert.” It says what was checked, on which date, and the limit of that check.</span>
              </li>
              <li>
                <strong>Employers earn reach</strong>
                <span>Company checks come before unlimited listings. Candidates are never charged a fee to apply.</span>
              </li>
            </ul>
          </section>

          <section className="section">
            <h2>Two doors. Same ledger.</h2>
            <div className="split">
              <article className="panel">
                <h3>Candidates</h3>
                <p>
                  Build a profile, attach proof to skills, and apply with the work
                  itself. School email can show affiliation; personal email is
                  welcome — education stays self-reported until evidence supports it.
                </p>
              </article>
              <article className="panel">
                <h3>Employers</h3>
                <p>
                  Confirm a work mailbox, then add company details. Jobs stay
                  drafts until you approve them. Higher verification unlocks
                  more reach — a scammer gains little from a quick sign-up.
                </p>
              </article>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">© 2026 Zigba. Proof before reputation.</footer>
    </div>
  );
}
