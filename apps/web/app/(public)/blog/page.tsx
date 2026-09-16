'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchBlogPosts, fetchBlogCategories } from '@/lib/blog';
import { Home } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Market News': 'bg-blue-500/10 text-blue-400',
  'Buying Guide': 'bg-emerald-500/10 text-emerald-400',
  'Selling Tips': 'bg-amber-500/10 text-amber-400',
  'Investment': 'bg-purple-500/10 text-purple-400',
  'Lifestyle': 'bg-pink-500/10 text-pink-400',
  'Legal': 'bg-red-500/10 text-red-400',
  default: 'bg-white/10 text-white/60',
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['blog-posts', activeCategory, page],
    queryFn: () => fetchBlogPosts({
      category: activeCategory || undefined,
      page,
      limit: 12,
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: fetchBlogCategories,
  });

  const posts = postsData?.posts ?? [];
  const total = postsData?.total ?? 0;
  const totalPages = Math.ceil(total / 12);
  const allCategories = Array.isArray(categories) ? categories : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-canvas)' }}>
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            Homewolves Blog
          </h1>
          <p className="mt-3 text-lg" style={{ color: 'var(--color-text-muted)' }}>
            Insights, guides, and market news for African real estate
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none justify-center flex-wrap">
          <button
            onClick={() => { setActiveCategory(''); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
              !activeCategory ? 'bg-white/10 text-white border border-white/20' : 'text-white/50 hover:text-white/80 border border-transparent'
            }`}
          >
            All
          </button>
          {allCategories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                activeCategory === cat ? 'bg-white/10 text-white border border-white/20' : 'text-white/50 hover:text-white/80 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
                <div className="aspect-[16/9] skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-3 skeleton w-1/3" />
                  <div className="h-4 skeleton w-3/4" />
                  <div className="h-3 skeleton w-full" />
                  <div className="h-3 skeleton w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>No posts yet</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Check back soon for new articles</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any, i: number) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`group rounded-xl overflow-hidden transition-all hover:-translate-y-1 ${
                    i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''
                  }`}
                  style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-card)' }}
                >
                  <div className={`relative overflow-hidden ${i === 0 ? 'aspect-[2/1]' : 'aspect-[16/9]'}`}>
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
                        <Home className="w-8 h-8" />
                      </div>
                    )}
                    {post.categories?.[0] && (
                      <span className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-semibold rounded-full ${CATEGORY_COLORS[post.categories[0]] ?? CATEGORY_COLORS.default}`}>
                        {post.categories[0]}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                      {post.author && <span>&middot; {post.author.firstName} {post.author.lastName}</span>}
                    </div>
                    <h2 className="font-semibold line-clamp-2 group-hover:underline" style={{ color: 'var(--color-text-primary)' }}>
                      {post.title}
                    </h2>
                    <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {post.excerpt}
                    </p>
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-tertiary)' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                      page === i + 1 ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
