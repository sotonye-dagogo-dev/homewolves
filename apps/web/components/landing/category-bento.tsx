import Link from 'next/link';
import { Home, Building2, Users, Mountain, Compass, PenTool, Package, Wrench } from 'lucide-react';

const categories = [
  { label: 'For Sale', icon: Home, category: 'sale', href: '/properties?category=sale' },
  { label: 'For Rent', icon: Building2, category: 'rent', href: '/properties?category=rent' },
  { label: 'Shortlet', icon: Users, category: 'shortlet', href: '/properties?category=shortlet' },
  { label: 'Land', icon: Mountain, category: 'land', href: '/properties?category=land' },
  { label: 'New Dev', icon: Compass, category: 'new-dev', href: '/properties?category=new_dev' },
  { label: 'Direct Brief', icon: PenTool, category: 'direct-brief', href: '/properties' },
];

const marketplaceLinks = [
  { label: 'Products', description: 'Building materials & accessories', icon: Package, href: '/products' },
  { label: 'Services', description: 'Valuation, legal, movers & more', icon: Wrench, href: '/services' },
];

export function CategoryBento() {
  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Property categories">
      <div className="max-w-[1120px] mx-auto">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-8 lg:mb-10">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.category}
                href={cat.href}
                className="bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-xl p-6 lg:p-8 flex items-center gap-5 shadow-card transition-transform duration-normal ease-out hover:-translate-y-1 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                data-category={cat.category}
                aria-label={`Browse ${cat.label.toLowerCase()} properties`}
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 grid place-items-center bg-primary rounded-md text-primary-foreground">
                  <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
                </div>
                <span className="font-body text-base lg:text-lg font-semibold text-foreground">
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>

        <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground leading-tight mt-10 mb-4">
          Marketplace
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
          {marketplaceLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-xl p-6 lg:p-8 flex items-center gap-5 shadow-card transition-transform duration-normal ease-out hover:-translate-y-1 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                aria-label={`Browse ${item.label.toLowerCase()}`}
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 grid place-items-center bg-accent rounded-md text-accent-foreground">
                  <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
                </div>
                <span>
                  <span className="block font-body text-base lg:text-lg font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="block font-body text-sm text-muted-foreground mt-0.5">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
