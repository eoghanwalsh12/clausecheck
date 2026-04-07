export const metadata = {
  title: "Terms of Service — ClauseCheck",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Last updated: 29 March 2026
      </p>

      <div className="mt-6 rounded-lg border border-[var(--warning)]/25 bg-[var(--warning)]/6 px-4 py-3 text-sm">
        <p className="font-semibold text-[var(--warning)]">
          ClauseCheck is not a law firm and does not provide legal advice.
        </p>
        <p className="mt-1 text-[var(--muted-foreground)]">
          The AI-generated analysis and output produced by this service is for
          informational purposes only. It does not constitute legal advice, does not
          create a solicitor-client relationship, and should not be relied upon as a
          substitute for advice from a qualified legal professional.
        </p>
      </div>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[var(--foreground)]">

        <section>
          <h2 className="text-lg font-semibold">1. Acceptance of terms</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            By creating an account or using ClauseCheck, you agree to these Terms of
            Service and our Privacy Policy. If you are using ClauseCheck on behalf of
            an organisation, you confirm you have authority to bind that organisation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Description of service</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            ClauseCheck provides an AI-assisted document analysis platform that allows
            users to upload legal documents, receive AI-generated analysis, and create
            work product based on that analysis. The service uses large language models
            (currently Anthropic Claude) to process and interpret document content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Not legal advice</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            ClauseCheck is a technology tool, not a regulated legal services provider.
            Nothing produced by this service constitutes legal advice within the meaning
            of the Legal Services Act 2007 or equivalent legislation. In particular:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--muted-foreground)]">
            <li>
              AI-generated analysis may contain errors, omissions, or
              mischaracterisations of the law.
            </li>
            <li>
              The service has no knowledge of your specific circumstances beyond what
              is contained in the uploaded document.
            </li>
            <li>
              The law may have changed since the AI model&apos;s training data was compiled.
            </li>
            <li>
              Jurisdiction-specific rules, local practice, and case law may not be
              reflected in the output.
            </li>
          </ul>
          <p className="mt-3 text-[var(--muted-foreground)]">
            <strong className="text-[var(--foreground)]">Professional users</strong>{" "}
            (including solicitors, barristers, and other legal professionals) are
            solely responsible for verifying the accuracy of any AI-generated output
            before relying on it or providing it to clients. Use of this service does
            not discharge any professional duty of care.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Your responsibilities</h2>
          <ul className="mt-3 space-y-2 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Authorisation:</strong> you
              must have the right to upload any document you submit. Do not upload
              documents that you are not authorised to share with a third-party
              processor.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Confidentiality:</strong> if
              you are a legal professional, you are responsible for ensuring that
              uploading client documents complies with your professional conduct rules
              and any applicable confidentiality obligations.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Accuracy:</strong> you are
              responsible for verifying any output before acting on it or sharing it
              with others.
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Acceptable use:</strong> you
              must not use ClauseCheck for any unlawful purpose, to process documents
              you have no right to access, or to attempt to circumvent the security of
              the service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Limitation of liability</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            To the maximum extent permitted by law, ClauseCheck and its officers,
            employees, and affiliates shall not be liable for:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[var(--muted-foreground)]">
            <li>
              Any loss or damage arising from reliance on AI-generated analysis or
              output.
            </li>
            <li>
              Any indirect, consequential, incidental, or special loss, including loss
              of profit, loss of contract, or loss of data.
            </li>
            <li>
              Any claim brought by a third party (including your clients) arising from
              your use of this service.
            </li>
          </ul>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Our total aggregate liability to you for any claim arising out of or in
            connection with these terms shall not exceed the total fees paid by you in
            the three months preceding the claim.
          </p>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Nothing in these terms limits our liability for fraud, fraudulent
            misrepresentation, death or personal injury caused by our negligence, or
            any other liability that cannot be excluded by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Intellectual property</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            You retain all rights in the documents you upload. You grant ClauseCheck a
            limited licence to process those documents solely for the purpose of
            delivering the service to you.
          </p>
          <p className="mt-3 text-[var(--muted-foreground)]">
            AI-generated output is provided to you for your use. We make no claim of
            ownership over deliverables you create using the service. You are
            responsible for verifying that any output does not infringe third-party
            rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Subscription and payment</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            Free tier access is provided without charge subject to the usage limits
            stated on our pricing page. Paid subscriptions are billed monthly in
            advance. You may cancel at any time; cancellation takes effect at the end
            of the current billing period with no refund of the remaining period.
          </p>
          <p className="mt-3 text-[var(--muted-foreground)]">
            We reserve the right to change pricing with 30 days&apos; notice to existing
            subscribers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Termination</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            You may close your account at any time. We may suspend or terminate your
            account if you breach these terms, with notice where reasonably practicable.
            On termination, your data will be deleted in accordance with our Privacy
            Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Governing law</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            These terms are governed by the laws of England and Wales. Any dispute
            shall be subject to the exclusive jurisdiction of the courts of England and
            Wales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. Changes to these terms</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            We may update these terms. Material changes will be notified by email to
            registered users at least 14 days before they take effect. Continued use
            of the service after that date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Contact</h2>
          <p className="mt-3 text-[var(--muted-foreground)]">
            For any questions about these terms, contact us at{" "}
            <a
              href="mailto:clausecheckprivacy@gmail.com"
              className="underline underline-offset-2"
            >
              clausecheckprivacy@gmail.com
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
}
