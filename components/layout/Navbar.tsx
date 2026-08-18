'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Mail, Menu, Phone } from 'lucide-react';
import { navigation, contact, social, type NavItem } from '@/lib/site';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { SocialIcon } from '@/components/layout/SocialIcons';
import { LangToggle } from '@/components/layout/LangToggle';
import { Icon } from '@/components/ui/Icon';
import { useDictionary, useLocale } from '@/components/providers/LocaleProvider';
import { localizedPath, stripLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import nextDynamic from 'next/dynamic';

// The drawer (and its framer-motion dependency) loads only in the browser —
// it is never part of the desktop-critical first load.
const MobileMenu = nextDynamic(
  () => import('@/components/layout/MobileMenu').then((m) => m.MobileMenu),
  { ssr: false },
);

/** Map default nav hrefs → dictionary keys for translated top-level labels. */
const NAV_KEY: Record<string, keyof ReturnType<typeof useDictionary>['nav']> = {
  '/': 'home',
  '/hajj': 'hajj',
  '/umrah': 'umrah',
  '/services': 'services',
  '/branches': 'branches',
  '/gallery': 'gallery',
  '/blog': 'blog',
  '/about': 'about',
  '/contact': 'contact',
};

export function Navbar({ menu }: { menu?: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useDictionary();
  const locale = useLocale();
  const here = stripLocale(pathname || '/');

  // Use the admin-managed menu when present, otherwise the built-in default nav.
  const items = menu && menu.length ? menu : navigation;
  const navLabel = (item: NavItem) => {
    const key = NAV_KEY[item.href];
    return key ? t.nav[key] : item.label;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* utility bar */}
      <div className="hidden bg-brand-900 text-white/90 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-2 text-xs">
          <div className="flex items-center gap-6">
            <a href={`tel:${contact.phones[0].replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-gold-300">
              <Phone className="h-3.5 w-3.5" /> {contact.phones[0]}
            </a>
            <a href={`mailto:${contact.emails[0]}`} className="flex items-center gap-1.5 hover:text-gold-300">
              <Mail className="h-3.5 w-3.5" /> {contact.emails[0]}
            </a>
            <span className="text-white/55">{t.utility.hours}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gold-300/90">{t.utility.license}</span>
            <span className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-3">
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="text-white/70 transition hover:text-gold-300">
                  <SocialIcon name={s.icon as never} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-[60] w-full transition-all duration-300',
          scrolled
            ? 'glass border-b border-border shadow-soft'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
          <Logo href={localizedPath(locale, '/')} />

          <nav className="hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              const active = here === item.href || (item.href !== '/' && here.startsWith(item.href));
              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={localizedPath(locale, item.href)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.92rem] font-medium transition-colors',
                      active ? 'text-brand-700' : 'text-ink/80 hover:text-brand-700',
                    )}
                  >
                    {navLabel(item)}
                    {item.children && <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />}
                  </Link>

                  {item.children && (
                    <div className="invisible absolute left-1/2 top-full z-50 w-[20.5rem] -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-glow">
                        {item.children.map((child) => {
                          const tc = t.navChildren[child.href];
                          const childLabel = tc?.label ?? child.label;
                          const childDesc = tc?.description ?? child.description;
                          return (
                          <Link
                            key={child.href}
                            href={localizedPath(locale, child.href)}
                            className="group/item flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-brand-50 dark:hover:bg-brand-900/30"
                          >
                            {child.image ? (
                              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-1 shadow-soft ring-1 ring-border transition-transform duration-300 group-hover/item:scale-110">
                                <Image src={child.image} alt="" width={36} height={36} className="h-full w-full object-contain" />
                              </span>
                            ) : child.icon ? (
                              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white shadow-emerald transition-transform duration-300 group-hover/item:scale-110">
                                <Icon name={child.icon} className="h-[18px] w-[18px]" />
                              </span>
                            ) : null}
                            <span className="min-w-0">
                              <span className="block text-[0.92rem] font-semibold text-ink dark:text-white">{childLabel}</span>
                              {childDesc && (
                                <span className="mt-0.5 block text-xs text-ink-muted">{childDesc}</span>
                              )}
                            </span>
                          </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <LangToggle />
            <Button href={localizedPath(locale, '/estimate')} variant="gold" size="sm" className="hidden whitespace-nowrap shrink-0 sm:inline-flex">
              {t.cta.getEstimate}
            </Button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700 lg:hidden dark:bg-brand-900/40 dark:text-brand-200"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} items={items} locale={locale} navLabel={navLabel} />
    </>
  );
}
