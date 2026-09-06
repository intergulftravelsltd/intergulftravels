import { CareOfListPage } from '@/components/manage/affiliates/CareOfListPage';
import { getLocale } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getLocale() === 'bn' ? 'কেয়ার অফ — হজ' : 'Care of — Hajj' };
}

export default function HajjCareOfPage() {
  return <CareOfListPage program="hajj" />;
}
