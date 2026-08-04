'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Images,
  GalleryHorizontalEnd,
  Inbox,
  Calculator,
  Menu as MenuIcon,
  PanelsTopLeft,
  Settings,
  Users,
  Users2,
  UserCog,
  ExternalLink,
  LogOut,
  X,
  Wallet,
  NotebookPen,
  Receipt,
  Landmark,
  Banknote,
  HandCoins,
  ScrollText,
  ArrowLeftRight,
  Package,
  Moon,
  BarChart3,
  History,
  ChevronDown,
  Video,
  Handshake,
  KeyRound,
  Contact,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { ConfirmHost } from '@/components/admin/confirm';
import { LangToggle } from '@/components/layout/LangToggle';
import { BranchScopeProvider } from '@/components/providers/BranchScope';
import { useLocale } from '@/components/providers/LocaleProvider';
import { getDict } from '@/lib/dictionaries/areas/adminshell';
import { localizedPath, stripLocale, type Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type AdminDict = ReturnType<typeof getDict>;
type NavLink = { labelKey: keyof AdminDict['nav']; href: string; icon: LucideIcon };
type NavGroup = { groupKey: keyof AdminDict['groups']; items: NavLink[]; adminOnly?: boolean };

const NAV: NavGroup[] = [
  {
    groupKey: 'overview',
    items: [{ labelKey: 'dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    groupKey: 'accounting',
    items: [
      { labelKey: 'accountsHome', href: '/admin/accounts', icon: Wallet },
      { labelKey: 'dailyEntry', href: '/admin/accounts/entry', icon: NotebookPen },
      { labelKey: 'vouchers', href: '/admin/accounts/vouchers', icon: Receipt },
      { labelKey: 'accountHeads', href: '/admin/accounts/heads', icon: Landmark },
      { labelKey: 'cashBank', href: '/admin/accounts/cash-bank', icon: Banknote },
      { labelKey: 'cashBook', href: '/admin/accounts/cash-book', icon: BookOpen },
      { labelKey: 'customerDues', href: '/admin/accounts/due', icon: HandCoins },
      { labelKey: 'expenses', href: '/admin/accounts/expenses', icon: ScrollText },
      { labelKey: 'loans', href: '/admin/accounts/loans', icon: ArrowLeftRight },
      { labelKey: 'receipts', href: '/admin/receipts', icon: Receipt },
    ],
  },
  {
    groupKey: 'hajj',
    items: [
      { labelKey: 'hajjPilgrims', href: '/admin/hajj', icon: Users },
      { labelKey: 'hajjPackages', href: '/admin/hajj/packages', icon: Package },
    ],
  },
  {
    groupKey: 'umrah',
    items: [
      { labelKey: 'umrahPassengers', href: '/admin/umrah', icon: Moon },
      { labelKey: 'umrahPackages', href: '/admin/umrah/packages', icon: Package },
    ],
  },
  {
    groupKey: 'careOf',
    items: [{ labelKey: 'careOfList', href: '/admin/care-of', icon: Contact }],
  },
  {
    groupKey: 'reports',
    items: [{ labelKey: 'reportsExport', href: '/admin/reports', icon: BarChart3 }],
  },
  {
    groupKey: 'website',
    adminOnly: true,
    items: [
      { labelKey: 'sitePackages', href: '/admin/packages', icon: Package },
      { labelKey: 'blogPosts', href: '/admin/posts', icon: FileText },
      { labelKey: 'mediaLibrary', href: '/admin/media', icon: Images },
      { labelKey: 'gallery', href: '/admin/gallery', icon: GalleryHorizontalEnd },
      { labelKey: 'videos', href: '/admin/videos', icon: Video },
      { labelKey: 'affiliations', href: '/admin/affiliations', icon: Handshake },
      { labelKey: 'contactRequests', href: '/admin/contacts', icon: Inbox },
      { labelKey: 'estimateRequests', href: '/admin/estimates', icon: Calculator },
    ],
  },
  {
    groupKey: 'system',
    adminOnly: true,
    items: [
      { labelKey: 'navigation', href: '/admin/menus', icon: MenuIcon },
      { labelKey: 'footer', href: '/admin/footer', icon: PanelsTopLeft },
      { labelKey: 'siteSettings', href: '/admin/settings', icon: Settings },
      { labelKey: 'vault', href: '/admin/secure-vault', icon: KeyRound },
      { labelKey: 'staffRoles', href: '/admin/users', icon: Users2 },
      { labelKey: 'activityLog', href: '/admin/activity', icon: History },
    ],
  },
];

export function AdminShell({
  user,
  isAdmin,
  lockedBranch = null,
  signOutAction,
  children,
}: {
  user: { email: string; name: string | null; avatarUrl: string | null; role?: string };
  isAdmin: boolean;
  lockedBranch?: string | null;
  signOutAction: () => void;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = getDict(locale);

  return (
    <div className="min-h-screen bg-sand-soft text-ink">
      <ConfirmHost />
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-brand-900 text-white lg:flex">
        <SidebarContent pathname={pathname} isAdmin={isAdmin} locale={locale} />
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label={t.closeNavigation}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[82%] flex-col bg-brand-900 text-white shadow-2xl">
            <button
              aria-label={t.closeNavigation}
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent pathname={pathname} isAdmin={isAdmin} locale={locale} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* ---------- Main column ---------- */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <button
            aria-label={t.openNavigation}
            onClick={() => setDrawerOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-ink-muted transition hover:bg-muted lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="hidden text-sm font-medium text-ink-muted sm:block">
            {t.adminConsole}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <Link
              href={localizedPath(locale, '/')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-ink-muted transition hover:border-brand-600/40 hover:text-brand-700"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{t.viewSite}</span>
            </Link>

            <Link
              href={localizedPath(locale, '/admin/account')}
              title={t.myAccountTitle}
              className="hidden items-center gap-2.5 border-l border-border pl-3 transition hover:opacity-80 sm:flex"
            >
              <Avatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
              <div className="leading-tight">
                <p className="max-w-[12rem] truncate text-sm font-semibold text-ink">
                  {user.name || t.administrator}
                </p>
                <p className="max-w-[12rem] truncate text-xs text-ink-muted">{user.email}</p>
              </div>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t.signOut}</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <BranchScopeProvider branch={lockedBranch}>{children}</BranchScopeProvider>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  isAdmin,
  locale,
  onNavigate,
}: {
  pathname: string;
  isAdmin: boolean;
  locale: Locale;
  onNavigate?: () => void;
}) {
  const t = getDict(locale);
  const visibleGroups = NAV.filter((section) => !section.adminOnly || isAdmin);
  // Only the single best (longest) matching link is active, so e.g.
  // /admin/hajj/packages activates "Hajj Packages" but NOT "Hajj Pilgrims".
  // Strip the /en locale prefix so matching stays against the unprefixed hrefs.
  const activeHref = bestMatchHref(
    stripLocale(pathname),
    visibleGroups.flatMap((g) => g.items.map((i) => i.href)),
  );
  const accountActive = stripLocale(pathname) === '/admin/account';
  const groupOf = () => visibleGroups.find((g) => g.items.some((i) => i.href === activeHref))?.groupKey;
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const g = groupOf();
    return g ? [g] : ['overview'];
  });
  useEffect(() => {
    const g = groupOf();
    if (g) setOpenGroups((prev) => (prev.includes(g) ? prev : [...prev, g]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const toggle = (name: string) =>
    setOpenGroups((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <LogoMark className="h-9 w-9" />
        <div className="leading-none">
          <p className="font-display text-lg font-semibold tracking-tight">Inter Gulf</p>
          <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-gold-300">
            {t.adminPanel}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {visibleGroups.map((section) => {
          const isOpen = openGroups.includes(section.groupKey);
          const hasActive = section.items.some((i) => i.href === activeHref);
          return (
            <div key={section.groupKey}>
              <button
                type="button"
                onClick={() => toggle(section.groupKey)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 font-semibold transition hover:bg-white/5',
                  locale === 'bn'
                    ? 'text-[0.95rem] tracking-wide'
                    : 'text-[0.65rem] uppercase tracking-[0.22em]',
                )}
              >
                <span className={cn(hasActive ? 'text-gold-300' : 'text-white/70')}>{t.groups[section.groupKey]}</span>
                <ChevronDown
                  className={cn('h-3.5 w-3.5 text-white/40 transition-transform', isOpen && 'rotate-180')}
                />
              </button>
              {isOpen && (
                <ul className="space-y-1 pb-2 pt-0.5">
                  {section.items.map((item) => {
                    const active = item.href === activeHref;
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={localizedPath(locale, item.href)}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                            active
                              ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_theme(colors.gold.400)]'
                              : 'text-white/65 hover:bg-white/5 hover:text-white',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-[18px] w-[18px] shrink-0 transition',
                              active ? 'text-gold-300' : 'text-white/55 group-hover:text-white',
                            )}
                          />
                          {t.nav[item.labelKey]}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* My Account — pinned to the very bottom, above the footer. */}
      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href={localizedPath(locale, '/admin/account')}
          onClick={onNavigate}
          aria-current={accountActive ? 'page' : undefined}
          className={cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
            accountActive
              ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_theme(colors.gold.400)]'
              : 'text-white/65 hover:bg-white/5 hover:text-white',
          )}
        >
          <UserCog
            className={cn(
              'h-[18px] w-[18px] shrink-0 transition',
              accountActive ? 'text-gold-300' : 'text-white/55 group-hover:text-white',
            )}
          />
          {t.nav.myAccount}
        </Link>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[0.7rem] leading-relaxed text-white/40">
          {t.footerTagline}
          <br />
          {t.footerLicense}
        </p>
      </div>
    </>
  );
}

function Avatar({
  name,
  email,
  avatarUrl,
}: {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}) {
  const initials = (name || email || 'A')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-600/20"
      />
    );
  }

  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
      {initials || 'A'}
    </span>
  );
}

/** Return the longest nav href that the current path matches, or null. */
function bestMatchHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches =
      href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
