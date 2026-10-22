import { Container } from '@/components/ui/Container';

/** Skeleton shown while the blog listing streams in. Mirrors the real layout. */
export default function BlogLoading() {
  return (
    <>
      {/* Hero placeholder */}
      <section className="relative isolate overflow-hidden bg-brand-900 pb-24 pt-14 sm:pt-16">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(110%_110%_at_20%_0%,#0e7c5a_0%,#074a37_45%,#06402b_75%,#04261c_100%)]" />
        </div>
        <Container>
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 max-w-3xl space-y-4">
            <div className="h-7 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-white/10" />
            <div className="h-12 w-2/3 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/10" />
          </div>
        </Container>
      </section>

      {/* Featured placeholder */}
      <section className="relative pt-16 sm:pt-20">
        <Container>
          <div className="grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft lg:grid-cols-2">
            <div className="min-h-[16rem] animate-pulse bg-muted" />
            <div className="space-y-4 p-7 sm:p-10">
              <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-8 w-3/4 animate-pulse rounded-xl bg-muted" />
              <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </Container>
      </section>

      {/* Tabs + grid placeholder */}
      <section className="relative py-16 sm:py-20">
        <Container>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-11 w-32 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
          <div className="mx-auto mb-10 h-12 max-w-md animate-pulse rounded-full bg-muted" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                <div className="aspect-[16/10] animate-pulse bg-muted" />
                <div className="space-y-3 p-6">
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
