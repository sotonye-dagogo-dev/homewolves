'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EmptyState } from '@/components/shared/empty-state';

export default function TransactionsPage() {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !user) return;
    const role = user.role;
    if (role === 'BUYER') {
      router.replace('/dashboard/client');
      return;
    }
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      router.replace('/dashboard/admin/payments');
      return;
    }
    if (role === 'AGENT' || role === 'DEVELOPER' || role === 'HOMEOWNER') {
      router.replace('/dashboard/agent/transactions');
      return;
    }
    router.replace('/dashboard');
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="skeleton h-4 w-40 rounded" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <EmptyState
        icon={FileText}
        title="Opening your transactions"
        description="We are taking you to the right workspace for your account role."
      />
    </div>
  );
}
