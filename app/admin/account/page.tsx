import { createClient, getAuthUser } from '@/lib/supabase/server';
import { PageHeader } from '@/components/manage/ui';
import { AccountSettings } from '@/components/admin/AccountSettings';
import { getLocale } from '@/lib/i18n-server';
import { getDict } from '@/lib/dictionaries/areas/adminshell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Account' };

export default async function AccountPage() {
  const supabase = createClient();
  const user = await getAuthUser();

  let fullName = '';
  let avatarUrl: string | null = null;
  let phone = '';
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, phone')
      .eq('id', user.id)
      .maybeSingle();
    fullName = data?.full_name ?? '';
    avatarUrl = data?.avatar_url ?? null;
    phone = data?.phone ?? '';
  }
  const meta = (user?.user_metadata as { address?: unknown } | undefined) ?? {};
  const address = typeof meta.address === 'string' ? meta.address : '';

  const t = getDict(getLocale()).account;

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <AccountSettings
        initial={{ email: user?.email ?? '', full_name: fullName, avatar_url: avatarUrl, phone, address }}
      />
    </>
  );
}
