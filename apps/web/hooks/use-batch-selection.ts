'use client';

import { useState, useCallback, useMemo } from 'react';

export interface BatchSelectionReturn {
  selectedIds: Set<string>;
  isAllSelected: (allIds: string[]) => boolean;
  isPartial: (allIds: string[]) => boolean;
  toggle: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  invertSelect: (allIds: string[]) => void;
  undo: () => void;
  clear: () => void;
  setSelected: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  count: number;
}

export function useBatchSelection(): BatchSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Set<string>[]>([]);

  const pushHistory = useCallback((prev: Set<string>) => {
    setHistory((h) => [...h.slice(-19), prev]);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pushHistory(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [pushHistory]);

  const selectAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      pushHistory(prev);
      return new Set(allIds);
    });
  }, [pushHistory]);

  const invertSelect = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      pushHistory(prev);
      const next = new Set<string>();
      for (const id of allIds) {
        if (!prev.has(id)) next.add(id);
      }
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    const lastState = history[history.length - 1];
    if (lastState) {
      setSelectedIds(lastState);
      setHistory((h) => h.slice(0, -1));
    }
  }, [history]);

  const clear = useCallback(() => {
    setSelectedIds((prev) => {
      pushHistory(prev);
      return new Set();
    });
  }, [pushHistory]);

  const setSelected = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      pushHistory(prev);
      return new Set(ids);
    });
  }, [pushHistory]);

  const isAllSelected = useCallback((allIds: string[]) => {
    return allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  }, [selectedIds]);

  const isPartial = useCallback((allIds: string[]) => {
    const count = allIds.filter((id) => selectedIds.has(id)).length;
    return count > 0 && count < allIds.length;
  }, [selectedIds]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const count = selectedIds.size;

  return useMemo(() => ({
    selectedIds,
    isAllSelected,
    isPartial,
    toggle,
    selectAll,
    invertSelect,
    undo,
    clear,
    setSelected,
    isSelected,
    count,
  }), [selectedIds, isAllSelected, isPartial, toggle, selectAll, invertSelect, undo, clear, setSelected, isSelected, count]);
}
