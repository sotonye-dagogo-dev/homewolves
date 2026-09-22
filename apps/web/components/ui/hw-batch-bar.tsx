'use client';

import { CheckSquare, Square, MinusSquare, Undo2, X } from 'lucide-react';
import { HwButton } from '@/components/ui';

export interface BatchAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'cta';
  className?: string;
}

interface HwBatchBarProps {
  selectedCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onInvertSelect: () => void;
  onUndo: () => void;
  onClear: () => void;
  actions?: BatchAction[];
  selectedIds: string[];
}

export function HwBatchBar({
  selectedCount,
  isAllSelected,
  onSelectAll,
  onInvertSelect,
  onUndo,
  onClear,
  actions = [],
  selectedIds,
}: HwBatchBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          <span className="w-7 h-7 rounded-full bg-[var(--color-brand-accent)] text-white text-xs font-bold grid place-items-center">
            {selectedCount}
          </span>
          <span className="hidden sm:inline">selected</span>
        </div>

        <div className="h-5 w-px bg-[var(--color-border-subtle)]" />

        <div className="flex items-center gap-1">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass)] transition-colors"
            title="Select all"
          >
            {isAllSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">All</span>
          </button>

          <button
            onClick={onInvertSelect}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass)] transition-colors"
            title="Invert selection"
          >
            <MinusSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Invert</span>
          </button>

          <button
            onClick={onUndo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass)] transition-colors"
            title="Undo last selection"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Undo</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear</span>
          </button>
        </div>

        {actions.length > 0 && (
          <>
            <div className="h-5 w-px bg-[var(--color-border-subtle)]" />
            <div className="flex items-center gap-1">
              {actions.map((action, i) => (
                <HwButton
                  key={i}
                  variant={action.variant ?? 'secondary'}
                  size="sm"
                  onClick={() => action.onClick(selectedIds)}
                  className="text-xs"
                >
                  {action.icon}
                  <span className="hidden lg:inline">{action.label}</span>
                </HwButton>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
