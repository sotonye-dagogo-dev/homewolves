'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EmptyState } from '@/components/shared/empty-state';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/auth?redirect=/dashboard/admin');
      return;
    }
    if (!isAdmin) router.replace('/dashboard');
  }, [hydrated, user, isAdmin, router]);

  if (!hydrated || !user || !isAdmin) {
    return (
      <div className="min-h-[50vh]">
        <EmptyState
          icon={ShieldAlert}
          title="Checking permissions"
          description="Admin tools are restricted to platform administrators."
        />
      </div>
    );
  }

  return <>{children}</>;
}
