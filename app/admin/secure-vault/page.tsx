import { redirect } from 'next/navigation';
import { createAdminClient, getAuthUser, getProfileLite } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import { decryptSecret } from '@/lib/vault-crypto';
import { SecureVault, type VaultCredential } from '@/components/admin/SecureVault';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vault' };

async function loadItems(): Promise<VaultCredential[]> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('vault_credentials')
      .select('*')
      .order('created_at', { ascending: false });
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      url: (r.url as string) ?? null,
      username: (r.username as string) ?? null,
      password: decryptSecret(r.password_enc as string),
      icon_url: (r.icon_url as string) ?? null,
      notes: (r.notes as string) ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function SecureVaultPage() {
  // Admin-only — resolve the same way the layout does.
  const user = await getAuthUser();

  let isAdmin = isAdminEmail(user?.email);
  if (!isAdmin && user) {
    const profile = await getProfileLite(user.id);
    if (profile?.role === 'admin') isAdmin = true;
  }
  if (!isAdmin) redirect('/admin');

  const items = await loadItems();
  return <SecureVault initial={items} />;
}
