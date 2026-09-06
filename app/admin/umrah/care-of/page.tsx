import { CareOfListPage } from '@/components/manage/affiliates/CareOfListPage';
import { getLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'কেয়ার অফ — উমরাহ' : 'Care of — Umrah' };
}

export default function UmrahCareOfPage() {
  return <CareOfListPage program="umrah" />;
}
