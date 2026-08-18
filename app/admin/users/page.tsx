import { createAdminClient, getAuthUser, getProfileLite } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/adminsystem';
import { PageHeader } from '@/components/admin/ui';
import { StaffTable, type StaffRow } from '@/components/manage/StaffTable';
import { CreateStaff } from '@/components/manage/CreateStaff';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Staff & Roles' };

async function loadStaff(): Promise<StaffRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/users] load failed:', error.message);
      return [];
    }
    return (data ?? []).map((p: any) => ({
      id: p.id,
      email: p.email ?? '',
      full_name: p.full_name ?? null,
      phone: p.phone ?? null,
      role: p.role ?? 'user',
      created_at: p.created_at ?? null,
      locked: isAdminEmail(p.email),
    }));
  } catch (err) {
    console.error('[admin/users] unexpected error:', err);
    return [];
  }
}

async function resolveViewer(): Promise<{ isAdmin: boolean; userId: string | null }> {
  try {
    const user = await getAuthUser();
    if (!user) return { isAdmin: false, userId: null };
    if (isAdminEmail(user.email)) return { isAdmin: true, userId: user.id };
    const profile = await getProfileLite(user.id);
    return { isAdmin: profile?.role === 'admin', userId: user.id };
  } catch {
    return { isAdmin: false, userId: null };
  }
}

export default async function StaffPage() {
  const t = getDict(getLocale());
  const [rows, viewer] = await Promise.all([loadStaff(), resolveViewer()]);
  const { isAdmin, userId } = viewer;

  return (
    <>
      <PageHeader
        title={t.staffTitle}
        description={t.staffDesc}
      />

      {isAdmin && (
        <div className="mb-6">
          <CreateStaff />
        </div>
      )}

      <StaffTable rows={rows} canEdit={isAdmin} currentUserId={userId} />
    </>
  );
}
