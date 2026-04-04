export const metadata = {
  title: "Data Processing Agreement — ClauseCheck",
};

export default function DPAPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        Data Processing Agreement
      </h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Last updated: 4 April 2026
      </p>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-blue-800 dark:text-blue-300">
          This DPA applies automatically when you use ClauseCheck to process
          personal data on behalf of your clients. By using the service, you
          agree to the terms below. If your organisation requires a countersigned
          copy, email{" "}
          <a
            href="mailto:clausecheckprivacy@gmail.com"
            className="font-medium underline underline-offset-2"
          >
            clausecheckprivacy@gmail.com
          </a>
          .
        </p>
      </div>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[var(--foreground)]">
        <section>
          <h2 className="text-lg font-semibold">1. Definitions</h2>
          <ul className="mt-3 space-y-2 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">&quot;Controller&quot;</strong>{" "}
              means you, the customer, who determines the purposes and means of
              processing personal data by uploading documents to ClauseCheck.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">&quot;Processor&quot;</strong>{" "}
              means ClauseCheck, which processes personal data on your behalf to
              deliver the service.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">&quot;Data Protection Laws&quot;</strong>{" "}
              means the UK GDPR, the EU GDPR, and the Data Protection Act 2018,
              as applicable.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">&quot;Personal Data&quot;</strong>,{" "}
              <strong className="text-[var(--foreground)]">&quot;Processing&quot;</strong>, and{" "}
              <strong className="text-[var(--foreground)]">&quot;Data Subject&quot;</strong>{" "}
              have the meanings given in the Data Protection Laws.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Scope and purpose</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            The Processor shall process Personal Data only to the extent
            necessary to provide the ClauseCheck service, specifically: parsing
            uploaded documents, generating AI-assisted analysis, storing project
            data, and producing deliverables as instructed by the Controller
            through the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            3. Processor obligations
          </h2>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-[var(--muted-foreground)]">
            <li>
              Process Personal Data only on documented instructions from the
              Controller (i.e. through your use of the platform features).
            </li>
            <li>
              Ensure that persons authorised to process the data have committed
              to confidentiality.
            </li>
            <li>
              Implement appropriate technical and organisational measures to
              ensure a level of security appropriate to the risk, including
              encryption in transit (TLS), access controls, and row-level
              security on stored data.
            </li>
            <li>
              Not engage another processor without prior written authorisation.
              The Controller authorises the sub-processors listed in section 5.
            </li>
            <li>
              Assist the Controller in responding to data subject requests
              (access, rectification, erasure, portability) through the
              platform&apos;s data export and account deletion features.
            </li>
            <li>
              Notify the Controller without undue delay (and in any event within
              72 hours) after becoming aware of a Personal Data breach.
            </li>
            <li>
              Delete all Personal Data upon termination of the service, unless
              retention is required by law. Account data is deleted within 30
              days of account closure.
            </li>
            <li>
              Make available to the Controller all information necessary to
              demonstrate compliance with these obligations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Controller obligations</h2>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-[var(--muted-foreground)]">
            <li>
              Ensure you have a lawful basis under Data Protection Laws for
              processing any Personal Data you upload.
            </li>
            <li>
              If you are a legal professional, ensure that uploading client
              documents complies with your professional conduct rules and
              client confidentiality obligations.
            </li>
            <li>
              Provide any required notices to and obtain any required consents
              from Data Subjects whose Personal Data you upload.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Sub-processors</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            The Controller authorises the Processor to engage the following
            sub-processors. The Processor shall notify the Controller of any
            intended changes to this list at least 14 days in advance.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
            <table className="w-full text-xs">
              <thead className="bg-[var(--muted)] text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Sub-processor</th>
                  <th className="px-4 py-2.5 font-medium">Purpose</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Safeguards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                <tr>
                  <td className="px-4 py-3 font-medium">Anthropic, PBC</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    AI analysis via Claude API
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">USA</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    SCCs; API data not used for training
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Supabase, Inc.</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    Database, auth, file storage
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">EU / USA</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    SCCs; SOC 2 Type II
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Vercel, Inc.</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    Hosting and CDN
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">USA</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    SCCs; SOC 2 Type II
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. International transfers</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Where Personal Data is transferred outside the UK or EEA, the
            Processor ensures appropriate safeguards are in place, including EU
            Standard Contractual Clauses (SCCs) and/or the UK International Data
            Transfer Agreement (IDTA) with each sub-processor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Data retention and deletion</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Personal Data is retained for as long as the Controller&apos;s account
            remains active. The Controller may delete individual projects at any
            time, or request full account deletion via the account settings page
            or by contacting{" "}
            <a
              href="mailto:clausecheckprivacy@gmail.com"
              className="underline underline-offset-2"
            >
              clausecheckprivacy@gmail.com
            </a>
            . All data is purged within 30 days of deletion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Audit rights</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            The Processor shall make available to the Controller, on reasonable
            request, information necessary to demonstrate compliance with this
            DPA. The Controller may conduct or commission an audit no more than
            once per year, with at least 30 days&apos; prior written notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Governing law</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            This DPA is governed by the laws of England and Wales and is subject
            to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>
      </div>
    </div>
  );
}
