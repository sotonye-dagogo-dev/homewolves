'use client';

import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { useCreateInspection } from '@/hooks/use-crm';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/shared/Toast';

interface ScheduleInspectionModalProps {
  listingId: string;
  listingTitle: string;
  open: boolean;
  onClose: () => void;
}

export function ScheduleInspectionModal({ listingId, listingTitle, open, onClose }: ScheduleInspectionModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const createInspection = useCreateInspection();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('Please select a date and time.');
      return;
    }

    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    try {
      await createInspection.mutateAsync({
        clientId: user?.id ?? '',
        listingId,
        scheduledAt,
        notes: notes || undefined,
      });
      toast.success('Inspection request sent! The agent will confirm shortly.');
      onClose();
      setDate('');
      setTime('');
      setNotes('');
    } catch {
      toast.error('Failed to schedule inspection. Please try again.');
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
              Schedule Inspection
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {listingTitle}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Preferred Date
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: '1px solid var(--color-border-default)' }}>
              <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text-primary)' }}
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Preferred Time
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: '1px solid var(--color-border-default)' }}>
              <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text-primary)' }}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requests or questions..."
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]"
              style={{
                background: 'var(--color-bg-canvas)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createInspection.isPending}
            className="w-full py-3 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            {createInspection.isPending ? 'Scheduling...' : 'Request Inspection'}
          </button>
        </form>
      </div>
    </div>
  );
}
