import { CareOfListPage } from '@/components/manage/affiliates/CareOfListPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Care of / Affiliates' };

/** Legacy combined list — the sidebar now links to the Hajj and Umrah lists. */
export default function CareOfPage() {
  return <CareOfListPage />;
}
