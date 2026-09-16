'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchBlogPost } from '@/lib/blog';
import { HwBadge } from '@/components/ui';
import { FileText } from 'lucide-react';
import Image from 'next/image';
import DOMPurify from 'dompurify';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchBlogPost(slug),
    enabled: !!slug,
  });

  const sanitizedContent = useMemo(
    () => (post?.content ? DOMPurify.sanitize(post.content) : ''),
    [post?.content],
  );

  const blogJsonLd = useMemo(() => {
    if (!post) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      image: post.coverImage,
      author: post.author
        ? { '@type': 'Person', name: `${post.author.firstName} ${post.author.lastName}` }
        : { '@type': 'Organization', name: 'Homewolves' },
      publisher: { '@type': 'Organization', name: 'Homewolves' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.homewolves.com'}/blog/${slug}`,
      },
    };
  }, [post, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg-canvas)' }}>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="space-y-4">
            <div className="h-4 skeleton w-1/3" />
            <div className="h-8 skeleton w-3/4" />
            <div className="h-4 skeleton w-1/2" />
            <div className="aspect-video skeleton rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-3 skeleton w-full" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-canvas)' }}>
        <div className="text-center">
          <div className="flex justify-center mb-4" style={{ color: 'var(--color-text-muted)' }}><FileText className="w-10 h-10" /></div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Post not found</h1>
          <Link href="/blog" className="text-sm font-medium" style={{ color: 'var(--color-brand-accent)' }}>&larr; Back to blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-canvas)' }}>
      {blogJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      )}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm mb-8 hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
          &larr; Back to Blog
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.categories?.map((cat: string) => (
            <HwBadge key={cat} className="bg-white/10 text-white/60">{cat}</HwBadge>
          ))}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {post.author && (
            <span>By {post.author.firstName} {post.author.lastName}</span>
          )}
          {post.publishedAt && (
            <>
              <span>&middot;</span>
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </>
          )}
          {post.tags?.length > 0 && (
            <>
              <span>&middot;</span>
              <span>{post.tags.map((t: string) => `#${t}`).join(', ')}</span>
            </>
          )}
        </div>

        {post.coverImage && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-10">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="(min-width: 768px) 768px, 100vw" />
          </div>
        )}

        <article
          className="prose prose-invert max-w-none"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <p className="text-lg leading-relaxed mb-6 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {post.excerpt}
          </p>
          <div className="leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>

        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: 'var(--color-brand-accent)' }}>
            &larr; View all articles
          </Link>
        </div>
      </div>
    </div>
  );
}
