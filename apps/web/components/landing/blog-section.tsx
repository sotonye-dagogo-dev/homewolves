'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { fetchBlogPosts } from '@/lib/blog';
import { ArrowRight, FileText } from 'lucide-react';

export function BlogSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts', 'landing'],
    queryFn: () => fetchBlogPosts({ limit: 3, published: 'true' } as any),
    staleTime: 60_000,
  });

  const posts: any[] = data?.posts ?? [];

  if (isLoading) {
    return (
      <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Blog highlights">
        <div className="max-w-[1120px] mx-auto">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-8 lg:mb-10">From Our Blog</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] animate-pulse">
                <div className="aspect-video bg-[var(--color-border-subtle)]" />
                <div className="p-5 space-y-2">
                  <div className="h-3 w-20 bg-[var(--color-border-subtle)] rounded" />
                  <div className="h-5 w-3/4 bg-[var(--color-border-subtle)] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Blog highlights">
        <div className="max-w-[1120px] mx-auto">
          <div className="flex items-center justify-between mb-8 lg:mb-10">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight">From Our Blog</h2>
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="rounded-xl border border-dashed border-[var(--color-border-default)] p-10 text-center bg-[var(--color-bg-elevated)]">
            <div className="flex justify-center mb-2 text-muted-foreground"><FileText className="w-8 h-8" /></div>
            <p className="text-sm text-[var(--color-text-secondary)]">No articles published yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Blog highlights">
      <div className="max-w-[1120px] mx-auto">
        <div className="flex items-center justify-between mb-8 lg:mb-10">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight">From Our Blog</h2>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post: any) => (
            <Link
              key={post.id ?? post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-card hover:shadow-hover hover:-translate-y-0.5 transition-all"
            >
              <div className="relative aspect-video overflow-hidden bg-[var(--color-border-subtle)]">
                {post.coverImage ? (
                  <Image src={post.coverImage} alt={post.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground"><FileText className="w-8 h-8" /></div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                {post.categories?.[0] && (
                  <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{post.categories[0]}</div>
                )}
                <h3 className="text-base font-semibold text-foreground leading-snug group-hover:underline line-clamp-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-2 flex-1">{post.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
