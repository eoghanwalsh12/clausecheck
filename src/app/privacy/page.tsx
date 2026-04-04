export const metadata = {
  title: "Privacy Policy — ClauseCheck",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Last updated: 29 March 2026
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <h2 className="text-lg font-semibold">1. Who we are</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            ClauseCheck (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the data controller for personal data
            collected through this website and service. For questions about this policy
            or to exercise your data rights, contact us at{" "}
            <a href="mailto:clausecheckprivacy@gmail.com" className="underline underline-offset-2">
              clausecheckprivacy@gmail.com
            </a>
            .
          </p>
          <p className="mt-2 text-[var(--muted-foreground)]">
            If you are a professional user (e.g. a solicitor) uploading documents on
            behalf of clients, you are the data controller for your clients&apos; personal
            data. ClauseCheck acts as your data processor for that data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. What data we collect</h2>
          <ul className="mt-3 space-y-2 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Account data:</strong> your
              email address, password (hashed, never stored in plain text), and
              organisation name if provided.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Documents:</strong> files you
              upload (PDF or DOCX) and the text extracted from them, stored against your
              account.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Chat history:</strong> your
              messages and AI responses within each project, saved to allow you to
              return to prior work.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Deliverables:</strong> work
              product you generate and save within the platform.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Usage data:</strong> basic
              logs of actions taken within the platform (e.g. pages visited, features
              used) for service improvement.
            </li>
          </ul>
          <p className="mt-3 text-[var(--muted-foreground)]">
            We do not collect payment card data directly. Any payment processing is
            handled by a third-party provider (e.g. Stripe) under their own privacy
            policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Legal basis for processing</h2>
          <ul className="mt-3 space-y-2 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Contract performance:</strong>{" "}
              processing your account data and documents is necessary to provide the
              service you have signed up for.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Legitimate interests:</strong>{" "}
              usage analytics and service improvement, provided these do not override
              your rights.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Legal obligation:</strong>{" "}
              where we are required to retain or disclose data by law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Sub-processors</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            To deliver the service, we share data with the following sub-processors.
            Each is bound by data processing agreements and appropriate safeguards for
            international transfers (Standard Contractual Clauses where applicable).
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--muted)] text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sub-processor</th>
                  <th className="px-4 py-2.5 font-medium">Purpose</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="px-4 py-3 font-medium">Anthropic, PBC</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    AI analysis of document text via Claude API
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">USA</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Supabase, Inc.</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    Database, authentication, and file storage
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">EU / USA</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Vercel, Inc.</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    Hosting and content delivery
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">USA</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3">
            <p className="font-medium">AI model training — important notice</p>
            <p className="mt-1 text-[var(--muted-foreground)]">
              Anthropic&apos;s API Terms of Service state that inputs submitted to the API
              and outputs returned by the API are{" "}
              <strong>not used to train Anthropic&apos;s models</strong>. Document text and
              chat messages you submit through ClauseCheck are therefore not used to
              train Claude or any other AI model. For Anthropic&apos;s full data policy see{" "}
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                anthropic.com/legal/privacy
              </a>
              .
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. How long we keep your data</h2>
          <ul className="mt-3 space-y-2 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Account and project data</strong>{" "}
              is retained for as long as your account is active.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Uploaded files</strong> are
              retained until you delete the project or close your account.
            </li>
            <li>
              On account closure, your personal data and uploaded documents are deleted
              within 30 days, except where we are required to retain records by law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Your rights</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Under UK GDPR and EU GDPR you have the right to:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--muted-foreground)]">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate personal data</li>
            <li>Request erasure of your personal data (&quot;right to be forgotten&quot;)</li>
            <li>Restrict or object to processing</li>
            <li>Receive your data in a portable format</li>
            <li>
              Lodge a complaint with the ICO (UK) at{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                ico.org.uk
              </a>{" "}
              or with the relevant supervisory authority in your EU member state
            </li>
          </ul>
          <p className="mt-3 text-[var(--muted-foreground)]">
            To exercise any of these rights, email{" "}
            <a href="mailto:clausecheckprivacy@gmail.com" className="underline underline-offset-2">
              clausecheckprivacy@gmail.com
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Security</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            All data is transmitted over encrypted HTTPS connections. Uploaded files are
            stored in a private Supabase Storage bucket with row-level security — only
            the account that uploaded a file can access it. Passwords are hashed using
            bcrypt by Supabase Auth and are never stored in plain text.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Cookies</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            We use only strictly necessary cookies to maintain your authentication
            session. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Changes to this policy</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            We may update this policy from time to time. Material changes will be
            notified by email to registered users at least 14 days before they take
            effect.
          </p>
        </section>

      </div>
    </div>
  );
}
