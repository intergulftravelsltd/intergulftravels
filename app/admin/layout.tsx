import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUser, getProfileLite } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthForm } from '@/components/auth/AuthForm';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/auth';
import { getStaffScope } from '@/lib/management/scope';
import { loadCompanyProfile } from '@/lib/management/company';
import { signOut } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · Admin · Inter Gulf Travels',
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  // Not signed in → show the staff login right here at /admin (no separate URL).
  if (!user) {
    const s = getDict(getLocale()).shell;
    return (
      <AuthShell
        eyebrow={s.staffEyebrow}
        title={s.staffTitle}
        subtitle={s.staffSubtitle}
        variant="staff"
      >
        <AuthForm portal />
      </AuthShell>
    );
  }

  // Resolve role: email allowlist OR profile role. Admins + accounting staff
  // (accountant / operator / staff) may use the management console.
  let isAdmin = isAdminEmail(user.email);
  let role = 'user';
  let fullName: string | null = null;
  let avatarUrl: string | null = null;

  try {
    const profile = await getProfileLite(user.id);

    if (profile?.role) role = profile.role;
    if (role === 'admin') isAdmin = true;
    fullName = profile?.full_name ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  } catch {
    // profiles unavailable — fall back to email allowlist result above
  }

  const STAFF = ['admin', 'accountant', 'operator', 'staff'];
  const isStaff = isAdmin || STAFF.includes(role);
  // Signed in but without staff access → they have nowhere in the console; send
  // them to the public site.
  if (!isStaff) redirect('/');

  // Branch this user is locked to (null = super admin, sees every branch).
  const { branch } = await getStaffScope();
  // The signed-in agency's letterhead — drives the sidebar brand and every
  // ledger / statement / receipt export (multi-tenant: each branch sees its own).
  const company = await loadCompanyProfile(branch);

  return (
    <AdminShell
      user={{ email: user.email ?? '', name: fullName, avatarUrl, role }}
      isAdmin={isAdmin}
      lockedBranch={branch}
      company={company}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}
