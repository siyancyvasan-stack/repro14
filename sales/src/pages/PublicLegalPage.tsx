import React from 'react';
import { Link } from 'react-router-dom';

type LegalPageProps = { kind: 'privacy' | 'terms' };

const pageCopy = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains how Reproutes processes information for its field-sales workforce and web/mobile applications.',
  },
  terms: {
    title: 'Terms of Service',
    intro: 'These terms govern authorized use of Reproutes by sales representatives, managers, factory teams, and their organizations.',
  },
} as const;

export const PublicLegalPage: React.FC<LegalPageProps> = ({ kind }) => {
  const copy = pageCopy[kind];
  return (
    <main className="min-h-[100dvh] bg-slate-950 px-4 py-8 text-slate-200 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-10">
        <header className="border-b border-slate-800 pb-6">
          <Link to="/sales/login" className="text-sm font-bold text-cyan-400 hover:text-cyan-300">← Back to Reproutes Sales</Link>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Reproutes</p>
          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">{copy.intro}</p>
          <p className="mt-3 text-xs text-slate-500">Effective date: 24 November 2026</p>
        </header>

        {kind === 'privacy' ? <PrivacyContent /> : <TermsContent />}

        <footer className="mt-10 flex flex-wrap gap-4 border-t border-slate-800 pt-6 text-sm font-semibold">
          <Link to="/privacy-policy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
          <Link to="/terms-of-service" className="text-cyan-400 hover:underline">Terms of Service</Link>
          <Link to="/delete-account" className="text-cyan-400 hover:underline">Delete Account</Link>
        </footer>
      </article>
    </main>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-8">
    <h2 className="text-xl font-extrabold text-white">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-7 text-slate-300">{children}</div>
  </section>
);

const PrivacyContent = () => <div>
  <Section title="Information we collect"><p>We collect account details such as name, work email, employee code, phone number, role, and organization. When enabled by the user and organization, Reproutes collects precise GPS location, device status, attendance check-in/check-out location, route activity, shop visits, orders, and sync information.</p><p>GPS is used for active-shift attendance verification, route visibility, visit verification, safety alerts, and distance calculations. Reproutes does not use background location for advertising or unrelated profiling.</p></Section>
  <Section title="How we use information"><p>We use information to authenticate users, provide sales and manager workflows, synchronize offline actions, calculate attendance and route metrics, protect accounts, provide support, and meet legal or contractual obligations.</p></Section>
  <Section title="Sharing and security"><p>Information is shared with the user&apos;s authorized organization and service providers needed to host, email, secure, and operate Reproutes. We do not sell personal information. Access is role-scoped and protected with authentication, encrypted transport, session controls, and audit logging.</p></Section>
  <Section title="Retention"><p>Raw GPS location history is normally retained for up to 90 days, subject to the organization&apos;s configured retention policy. Account and operational records may be retained for employment, accounting, fraud prevention, dispute resolution, or legal obligations. When an account is deleted, direct profile identifiers are removed or anonymized, active sessions and credentials are revoked, raw GPS points are deleted, and de-identified attendance or transaction records may remain for up to 7 years where required by the organization&apos;s records policy or law.</p></Section>
  <Section title="Your choices"><p>You may request account deletion at <Link className="text-cyan-400 underline" to="/delete-account">/delete-account</Link>. You may also contact your organization&apos;s Reproutes administrator for access, correction, or retention questions. Location permission can be disabled in device settings, but attendance and route features may then be unavailable.</p></Section>
  <Section title="Contact"><p>For privacy questions, contact your organization&apos;s Reproutes administrator or email <a className="text-cyan-400 underline" href="mailto:privacy@reproutes.com">privacy@reproutes.com</a>.</p></Section>
</div>;

const TermsContent = () => <div>
  <Section title="Authorized use"><p>Reproutes is provided for legitimate organization-managed field sales, attendance, route, inventory, and factory operations. Users must keep credentials private, provide accurate information, and use only the roles and data assigned to them.</p></Section>
  <Section title="Location and attendance"><p>Where the organization enables GPS attendance, users will be shown the relevant permission request. Location tracking is intended to operate during an active work shift and may be used to verify attendance, visits, route distance, and safety status.</p></Section>
  <Section title="Prohibited conduct"><p>Do not bypass access controls, share accounts, falsify attendance or location, upload unlawful content, interfere with service availability, or access another person&apos;s data. Organizations are responsible for assigning appropriate roles and lawful instructions.</p></Section>
  <Section title="Availability and changes"><p>Features may change to maintain security, comply with law, or improve the service. We may suspend access for security, misuse, non-payment by the organization, or violation of these terms.</p></Section>
  <Section title="Account deletion"><p>Users can submit a verified deletion request at <Link className="text-cyan-400 underline" to="/delete-account">/delete-account</Link>. Deletion removes or anonymizes direct account information and revokes access; operational records that the organization must retain for legal, accounting, safety, or audit purposes may remain in de-identified form for the stated retention period.</p></Section>
  <Section title="Contact"><p>For service or account questions, contact your organization&apos;s Reproutes administrator.</p></Section>
</div>;
