'use client';
import { getApiBase } from '@/lib/api-base';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useTransaction,
  useAdvanceTransaction,
  useRejectTransaction,
  useCancelTransaction,
  useAddPayment,
} from '@/hooks/use-transactions';
import {
  useTransactionDocuments,
  useUploadDocument,
  useDeleteDocument,
  useGetDocumentUploadUrl,
} from '@/hooks/use-documents';
import {
  useTransactionSignatures,
  useCreateSignatureRequest,
} from '@/hooks/use-signatures';
import { useEntityAudit } from '@/hooks/use-audit';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { HwButton, HwBadge, HwInput } from '@/components/ui';

function getTxApi() { return `${getApiBase()}/transactions`; }

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem('hw-auth');
  if (!raw) return {};
  try {
    const { state } = JSON.parse(raw);
    if (!state.accessToken) return {};
    return { Authorization: `Bearer ${state.accessToken}` };
  } catch {
    return {};
  }
}

const STEP_LABELS = [
  'Inspection Scheduled',
  'Inspection Completed',
  'Documents Received',
  'Due Diligence',
  'Contract Signed',
  'Payment Submitted',
  'Admin Approval',
  'Completed',
];

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: tx, isLoading } = useTransaction(id);
  const { data: docs } = useTransactionDocuments(id);
  const { data: signatures } = useTransactionSignatures(id);
  const { data: auditEvents } = useEntityAudit('Transaction', id);
  const advance = useAdvanceTransaction();
  const reject = useRejectTransaction();
  const cancel = useCancelTransaction();
  const addPayment = useAddPayment();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const getUploadUrl = useGetDocumentUploadUrl();
  const createSignature = useCreateSignatureRequest();

  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();
  const [showReject, setShowReject] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [evidencePaymentId, setEvidencePaymentId] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [signDocumentId, setSignDocumentId] = useState<string | undefined>();
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const uploadEvidenceMutation = useMutation({
    mutationFn: async ({ paymentId, url }: { paymentId: string; url: string }) => {
      const r = await fetch(`${getTxApi()}/payments/${paymentId}/evidence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ evidenceUrl: url }),
      });
      if (!r.ok) throw new Error('Failed to attach evidence');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transaction', id] });
      setEvidencePaymentId(null);
      setEvidenceUrl('');
    },
  });

  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    const ext = uploadFile.name.split('.').pop() ?? 'file';
    const filename = `${id}/${Date.now()}_${uploadName.replace(/\s+/g, '_')}.${ext}`;
    const urlData = await getUploadUrl.mutateAsync({ filename, contentType: uploadFile.type });
    await fetch(urlData.uploadUrl, { method: 'PUT', body: uploadFile });
    await uploadDoc.mutateAsync({
      transactionId: id,
      name: uploadName,
      type: ext,
      url: urlData.publicUrl,
      size: uploadFile.size,
    });
    setUploadName('');
    setUploadFile(null);
    setShowUploadZone(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-bg-glass)' }} />
        ))}
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="p-12 text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Transaction not found</p>
        <HwButton variant="ghost" onClick={() => router.back()} className="mt-4">Go back</HwButton>
      </div>
    );
  }

  const steps: any[] = tx.stepsJson ?? [];
  const isActive = tx.status === 'INITIATED' || tx.status === 'IN_PROGRESS';
  const activeStep = tx.currentStep;
  const auditList: any[] = Array.isArray(auditEvents) ? auditEvents : (auditEvents as any)?.events ?? [];

  const handleAdvance = async () => { await advance.mutateAsync({ id }); };
  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await reject.mutateAsync({ id, reason: rejectReason });
    setShowReject(false);
    setRejectReason('');
  };
  const handleCancel = async () => { if (confirm('Cancel this transaction?')) await cancel.mutateAsync(id); };
  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addPayment.mutateAsync({
      transactionId: id,
      amount: parseFloat(fd.get('amount') as string),
      type: fd.get('type') as any,
      evidenceUrl: (fd.get('evidenceUrl') as string) || undefined,
    });
    setShowPayment(false);
  };

  const handleSendSignature = async () => {
    await createSignature.mutateAsync({
      transactionId: id,
      documentId: signDocumentId,
      signerId: tx.buyerId,
      signerEmail: tx.buyer?.email ?? '',
      signerName: `${tx.buyer?.firstName ?? ''} ${tx.buyer?.lastName ?? ''}`.trim(),
    });
    setSignDocumentId(undefined);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 px-4 py-4 md:py-6">
        <button onClick={() => router.back()} className="w-11 h-11 flex items-center justify-center rounded-full shrink-0 transition-all" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }}>
          <span style={{ color: 'var(--color-text-primary)' }}>←</span>
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>Deal Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-0.5 rounded-full"
              style={{
                background: tx.status === 'COMPLETED' ? 'var(--color-success-bg)' :
                  tx.status === 'IN_PROGRESS' ? 'var(--color-warning-bg)' :
                  tx.status === 'REJECTED' ? 'var(--color-error-bg)' : 'var(--color-bg-base)',
                color: tx.status === 'COMPLETED' ? 'var(--color-status-active)' :
                  tx.status === 'IN_PROGRESS' ? 'var(--color-status-pending)' :
                  tx.status === 'REJECTED' ? 'var(--color-status-rejected)' : 'var(--color-text-muted)',
              }}
            >
              {tx.status}
            </span>
            {activeStep > 0 && activeStep <= 8 && (
              <span className="text-xs font-semibold px-3 py-0.5 rounded-full"
                style={{
                  background: activeStep >= 8 ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                  color: activeStep >= 8 ? 'var(--color-status-active)' : 'var(--color-status-pending)',
                }}
              >
                {activeStep >= 8 ? 'Completed' : `Step ${activeStep + 1}: ${STEP_LABELS[activeStep] ?? ''}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden px-4 pb-2 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {steps.map((step: any, i: number) => {
            const isDone = i < activeStep || step.status === 'completed';
            const isCur = i === activeStep && isActive;
            return (
              <div key={step.id} className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
                  style={{
                    color: isCur ? 'var(--color-text-inverse)' : isDone ? 'var(--color-status-active)' : 'var(--color-text-muted)',
                    background: isCur ? 'var(--color-brand-accent)' : isDone ? 'var(--color-success-bg)' : 'var(--color-bg-elevated)',
                    border: isCur || isDone ? 'none' : '1px solid var(--color-border-default)',
                  }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: isCur ? 'rgba(255,255,255,0.25)' : isDone ? 'var(--color-success)' : 'transparent',
                      color: 'var(--color-text-inverse)',
                    }}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  {step.label}
                </div>
                {i < steps.length - 1 && <span style={{ color: 'var(--color-border-default)' }} className="text-xs">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-col md:flex-row gap-0 px-4">
        {/* Vertical Stepper - Desktop */}
        <aside className="hidden md:block w-[280px] shrink-0" style={{ padding: 'var(--space-4)' }}>
          <div className="sticky top-20" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)', borderRadius: 'var(--radius-xl)' }}>
            <div className="p-2">
              {steps.map((step: any, i: number) => {
                const isDone = i < activeStep || step.status === 'completed';
                const isCur = i === activeStep && isActive;
                const isRej = step.status === 'rejected';

                return (
                  <div key={step.id}>
                    <div className={`flex gap-3 items-start p-3 rounded-lg cursor-pointer transition-all ${
                      isCur ? '' : isDone ? '' : isRej ? '' : ''
                    }`} style={{
                      background: isCur ? 'var(--color-bg-elevated)' : 'transparent',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-full)', display: 'grid', placeItems: 'center',
                        fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', fontWeight: 'var(--font-semibold)',
                        border: '2px solid',
                        borderColor: isDone ? 'var(--color-status-active)' : isCur ? 'var(--color-status-pending)' : isRej ? 'var(--color-status-rejected)' : 'var(--color-border-default)',
                        background: isDone ? 'var(--color-status-active)' : isCur ? 'var(--color-status-pending)' : isRej ? 'var(--color-status-rejected)' : 'transparent',
                        color: isDone || isCur || isRej ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                      }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{
                          color: isDone ? 'var(--color-status-active)' : isCur ? 'var(--color-status-pending)' : isRej ? 'var(--color-status-rejected)' : 'var(--color-text-muted)',
                        }}>
                          {step.label}
                        </div>
                        {isDone && step.completedAt && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(step.completedAt).toLocaleDateString()}
                          </div>
                        )}
                        {isCur && <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-status-pending)' }}>In progress</div>}
                        {step.completedBy && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>by {step.completedBy.name}</div>
                        )}
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <div style={{
                        width: 2, height: 20, marginLeft: 17,
                        background: isDone ? 'var(--color-status-active)' : isCur ? 'var(--color-status-pending)' : 'var(--color-border-default)',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 md:pl-6 pb-6">
          {/* Step Content */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 className="text-xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>
              {STEP_LABELS[activeStep] ?? 'Transaction'}
            </h2>
            <p className="text-sm mt-1 mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {activeStep === 0 && 'Schedule and confirm property inspection'}
              {activeStep === 1 && 'Mark inspection as completed'}
              {activeStep === 2 && 'Upload and manage transaction documents'}
              {activeStep === 3 && 'Review documents and due diligence checklist'}
              {activeStep === 4 && 'Send contract for e-signature'}
              {activeStep === 5 && 'Payment details and evidence submission'}
              {activeStep === 6 && 'Admin review and approval pending'}
              {activeStep >= 7 && 'Transaction completed successfully'}
            </p>

            {/* Documents Upload Zone (step 2-3) */}
            {(activeStep === 2 || activeStep === 3) && (
              <div>
                {showUploadZone ? (
                  <div className="mb-6 p-6 rounded-xl text-center transition-all" style={{ border: '2px dashed var(--color-border-strong)', background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }}>
                    <div className="text-4xl mb-3 opacity-70">📄</div>
                    <div className="text-md font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Upload Document</div>
                    <div className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>PDF, images, or office documents</div>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="mb-3 text-sm w-full"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Document name"
                      className="w-full mb-3 px-3 py-2 text-sm rounded-lg border"
                      style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                    />
                    <div className="flex gap-3 justify-center">
                      <HwButton variant="ghost" onClick={() => { setShowUploadZone(false); setUploadFile(null); setUploadName(''); }}>
                        Cancel
                      </HwButton>
                      <HwButton variant="primary" onClick={handleUploadDocument} disabled={!uploadFile || !uploadName.trim() || getUploadUrl.isPending}>
                        {getUploadUrl.isPending ? 'Uploading...' : 'Upload'}
                      </HwButton>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowUploadZone(true)}
                    className="w-full mb-6 p-8 rounded-xl text-center cursor-pointer transition-all hover:border-brand-secondary"
                    style={{ border: '2px dashed var(--color-border-strong)', background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }}
                  >
                    <div className="text-4xl mb-3 opacity-70">📄</div>
                    <div className="text-md font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upload Document</div>
                    <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Tap or click to upload files</div>
                  </button>
                )}

                {docs && docs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Uploaded Documents</h3>
                    {docs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}>
                        <span className="text-2xl shrink-0">
                          {doc.type === 'pdf' ? '📄' : doc.type?.match(/png|jpg|jpeg|gif|webp/i) ? '🖼️' : '📎'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{doc.name}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                            {doc.virusScanStatus === 'clean' && <span className="ml-2 text-emerald-600">✓ Verified</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewDoc(doc)} className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-secondary)' }}>View</button>
                          <button onClick={() => deleteDoc.mutate(doc.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contract Signing (step 4) */}
            {activeStep === 4 && (
              <div>
                <div className="space-y-3">
                  {docs && docs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Documents to sign</h3>
                      {docs.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border mb-2" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <div>
                              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{doc.name}</div>
                              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{doc.signedUrl ? '✓ Signed' : 'Pending signature'}</div>
                            </div>
                          </div>
                          {doc.signedUrl ? (
                            <HwBadge className="bg-emerald-100 text-emerald-700">Signed</HwBadge>
                          ) : (
                            <HwButton variant="primary" size="sm" onClick={() => setSignDocumentId(doc.id)}>
                              Sign Document
                            </HwButton>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <HwButton
                      variant="primary"
                      onClick={handleSendSignature}
                      disabled={createSignature.isPending}
                    >
                      {createSignature.isPending ? 'Sending...' : 'Send for Signature'}
                    </HwButton>
                  </div>
                </div>
              </div>
            )}

            {/* Payment (step 5) */}
            {activeStep === 5 && (
              <div>
                {tx.payments && tx.payments.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-base)' }}>
                      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Property Price</div>
                      <div className="text-lg font-display font-bold" style={{ color: 'var(--color-text-accent)' }}>
                        ₦{tx.listing?.price ? Number(tx.listing.price).toLocaleString() : '—'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--color-bg-base)' }}>
                      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Deposit Paid</div>
                      <div className="text-lg font-display font-bold" style={{ color: 'var(--color-text-accent)' }}>
                        ₦{tx.payments.filter((p: any) => p.status === 'confirmed').reduce((s: number, p: any) => s + Number(p.amount), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {tx.payments?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.type}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.currency} {Number(p.amount).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.evidenceUrl ? (
                          <a href={p.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-600 hover:underline">📎 Evidence</a>
                        ) : p.status === 'pending' && (
                          <button onClick={() => { setEvidencePaymentId(p.id); setEvidenceUrl(''); }} className="text-xs text-gray-400 hover:text-gray-600">+ Attach</button>
                        )}
                        <HwBadge className={p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {p.status}
                        </HwBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion (step 7+) */}
            {activeStep >= 7 && (
              <div className="completion-celebration" style={{ textAlign: 'center', padding: 'var(--space-10) var(--space-4)' }}>
                <div className="celebration-icon" style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'var(--color-success-bg)', color: 'var(--color-success)', display: 'grid', placeItems: 'center', margin: '0 auto var(--space-4)', fontSize: 36, animation: 'celebrate-pulse 1.5s ease-spring infinite alternate' }}>
                  🎉
                </div>
                <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>Transaction Complete</h2>
                <p className="text-sm mt-2 mb-6" style={{ color: 'var(--color-text-secondary)' }}>All steps have been completed successfully.</p>
                <div className="complete-steps-summary" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
                  {steps.map((s: any) => (
                    <span key={s.id} className="complete-step-chip" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-status-active)' }}>
                      ✓ {s.label}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 'var(--space-6)' }}>
                  <HwButton variant="primary">View Completion Summary</HwButton>
                </div>
              </div>
            )}

            {/* Actions */}
            {isActive && (
              <div className="flex gap-3 flex-wrap mt-6">
                <HwButton variant="primary" onClick={handleAdvance} disabled={advance.isPending}>
                  {advance.isPending ? 'Advancing...' : 'Advance to Next Step'}
                </HwButton>
                <HwButton variant="outline" onClick={() => setShowPayment(true)}>Add Payment</HwButton>
                <HwButton variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setShowReject(true)}>Reject</HwButton>
                <HwButton variant="ghost" className="text-gray-400 hover:text-gray-600" onClick={handleCancel}>Cancel</HwButton>
              </div>
            )}
          </div>

          {/* Payments List */}
          {tx.payments && tx.payments.length > 0 && activeStep !== 5 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Payments</h3>
              <div className="space-y-2">
                {tx.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', borderColor: 'var(--color-border-glass)' }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.type}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{p.currency} {Number(p.amount).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.evidenceUrl && <a href={p.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-amber-600 hover:underline">📎</a>}
                      <HwBadge className={p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>{p.status}</HwBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          {signatures && signatures.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Signatures</h3>
              <div className="space-y-2">
                {signatures.map((sig: any) => (
                  <div key={sig.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--color-bg-glass)', borderColor: 'var(--color-border-glass)' }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{sig.signerName}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sig.signerEmail}</div>
                    </div>
                    <HwBadge className={sig.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                      {sig.status}
                    </HwBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents List */}
          {docs && docs.length > 0 && activeStep !== 2 && activeStep !== 3 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Documents</h3>
              <div className="space-y-2">
                {docs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: 'var(--color-bg-glass)', borderColor: 'var(--color-border-glass)' }}>
                    <span className="text-xl">{doc.type === 'pdf' ? '📄' : '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{doc.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {doc.signedUrl && <span className="text-emerald-600 mr-2">✓ Signed</span>}
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                      </div>
                    </div>
                    <button onClick={() => setPreviewDoc(doc)} className="px-3 py-1 text-xs font-semibold rounded-full" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-brand-secondary)' }}>Preview</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Trail Panel */}
      <div className="max-w-5xl mx-auto mt-4 px-4">
        <button
          onClick={() => setShowAuditPanel(!showAuditPanel)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-lg transition-all"
          style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)', border: '1px solid var(--color-border-glass)' }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            📋 Audit Trail ({auditList.length} events)
          </span>
          <span className="text-sm transition-transform" style={{ transform: showAuditPanel ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>
        {showAuditPanel && (
          <div className="mt-2 p-4 rounded-lg overflow-x-auto" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--color-border-glass)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Timestamp</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Actor</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Action</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}>Device</th>
                </tr>
              </thead>
              <tbody>
                {auditList.map((event: any) => (
                  <tr key={event.id} className="hover:bg-black/5">
                    <td className="px-3 py-2 text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                    </td>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>{event.actorName}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>{event.action}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {event.deviceInfo?.browser ?? event.ipAddress ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowReject(false)}>
          <div className="w-full max-w-md p-6 space-y-4 rounded-xl" style={{ background: 'var(--color-bg-elevated)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Reject Transaction</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full rounded-lg px-3 py-2 text-sm h-24 resize-none border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
            <div className="flex gap-3 justify-end">
              <HwButton variant="ghost" onClick={() => setShowReject(false)}>Cancel</HwButton>
              <HwButton variant="primary" className="bg-red-500 hover:bg-red-600" onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending}>Reject</HwButton>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPayment(false)}>
          <div className="w-full max-w-md p-6 space-y-4 rounded-xl" style={{ background: 'var(--color-bg-elevated)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Add Payment</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="text-sm block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Amount</label>
                <HwInput name="amount" type="number" step="0.01" required placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Type</label>
                <select name="type" required className="w-full rounded-lg px-3 py-2 text-sm border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}>
                  <option value="deposit">Deposit</option>
                  <option value="installment">Installment</option>
                  <option value="commission">Commission</option>
                  <option value="final">Final Payment</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Evidence URL (optional)</label>
                <HwInput name="evidenceUrl" placeholder="https://..." />
              </div>
              <div className="flex gap-3 justify-end">
                <HwButton type="button" variant="ghost" onClick={() => setShowPayment(false)}>Cancel</HwButton>
                <HwButton type="submit" variant="primary" disabled={addPayment.isPending}>
                  {addPayment.isPending ? 'Adding...' : 'Add Payment'}
                </HwButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {evidencePaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setEvidencePaymentId(null); setEvidenceUrl(''); }}>
          <div className="w-full max-w-md p-6 space-y-4 rounded-xl" style={{ background: 'var(--color-bg-elevated)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Attach Evidence</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Paste the URL of the payment evidence</p>
            <HwInput value={evidenceUrl} onChange={(e: any) => setEvidenceUrl(e.target.value)} placeholder="https://storage.homewolves.africa/payments/..." />
            <div className="flex gap-3 justify-end">
              <HwButton variant="ghost" onClick={() => { setEvidencePaymentId(null); setEvidenceUrl(''); }}>Cancel</HwButton>
              <HwButton variant="primary" onClick={() => uploadEvidenceMutation.mutate({ paymentId: evidencePaymentId, url: evidenceUrl })} disabled={!evidenceUrl.trim() || uploadEvidenceMutation.isPending}>
                {uploadEvidenceMutation.isPending ? 'Uploading...' : 'Attach'}
              </HwButton>
            </div>
          </div>
        </div>
      )}

      {signDocumentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSignDocumentId(undefined)}>
          <div className="w-full max-w-2xl p-6 space-y-4 rounded-xl" style={{ background: 'var(--color-bg-elevated)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sign Document (DocuSeal)</h2>
              <button onClick={() => setSignDocumentId(undefined)} className="text-2xl" style={{ color: 'var(--color-text-muted)' }}>×</button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              The signing interface will be embedded here. Signers will receive an email with a secure link.
            </p>
            <div className="w-full h-80 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-base)' }}>
              <div className="text-center">
                <div className="text-4xl mb-3">✍️</div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>DocuSeal Signing Widget</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Signature request will be sent to the buyer via email</p>
                <div className="mt-4 flex gap-3 justify-center">
                  <HwButton variant="primary" onClick={handleSendSignature} disabled={createSignature.isPending}>
                    {createSignature.isPending ? 'Sending...' : 'Send Signature Request'}
                  </HwButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto p-6 rounded-xl" style={{ background: 'var(--color-bg-elevated)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-2xl" style={{ color: 'var(--color-text-muted)' }}>×</button>
            </div>
            {previewDoc.signedUrl && (
              <div className="mb-4 px-4 py-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--color-success-bg)' }}>
                <span style={{ color: 'var(--color-success)' }}>✓ Signed electronically</span>
              </div>
            )}
            {previewDoc.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewDoc.url} alt={previewDoc.name} className="w-full rounded-lg" />
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Preview not available.</p>
                <a href={previewDoc.url} target="_blank" rel="noreferrer" className="inline-block mt-4 px-6 py-2 text-sm font-semibold rounded-full" style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}>Download &rarr;</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
