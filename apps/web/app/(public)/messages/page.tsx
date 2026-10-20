'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  Info,
  MessageCircle,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useConversations, useMessages, useMessaging } from '@/hooks/use-messaging';
import { createConversation, fetchConversation, markConversationRead } from '@/lib/messaging';
import { EmptyState } from '@/components/shared/empty-state';
import { HwButton } from '@/components/ui';
import { emitToast, errorMessage } from '@/lib/toast';
import { formatTime, fullName, initials, safeText, toArray } from '@/lib/format';

interface Participant {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  avatar?: string | null;
  phone?: string | null;
}

interface ConversationMessage {
  id: string;
  content?: string | null;
  senderId?: string | null;
  createdAt?: string | null;
  readAt?: string | null;
}

interface Conversation {
  id: string;
  participantIds?: string[];
  participants?: Participant[];
  propertyId?: string | null;
  messages?: ConversationMessage[];
}

interface Message {
  id: string;
  conversationId?: string;
  content?: string | null;
  senderId?: string | null;
  type?: string | null;
  mediaUrl?: string | null;
  createdAt?: string | null;
  readAt?: string | null;
}

export default function MessagesPage() {
  const { user, accessToken, hydrated } = useAuth();
  const router = useRouter();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: conversations,
    isLoading: convosLoading,
    isError: convosError,
    refetch: refetchConversations,
  } = useConversations();
  const {
    data: messages,
    isLoading: msgsLoading,
    isError: msgsError,
  } = useMessages(activeConvoId ?? '');
  const { sendMessage, markRead } = useMessaging(activeConvoId ?? undefined);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) router.replace('/auth?redirect=/messages');
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (!activeConvoId) {
      setActiveConvo(null);
      return;
    }
    markConversationRead(activeConvoId).catch(() => {});
    markRead();
    fetchConversation(activeConvoId)
      .then((data) => setActiveConvo(data as Conversation))
      .catch(() => setActiveConvo(null));
  }, [activeConvoId, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const conversationList = useMemo(() => toArray<Conversation>(conversations), [conversations]);
  const messageList = useMemo(() => toArray<Message>(messages), [messages]);

  const otherParticipant = useCallback(
    (conversation: Conversation | null): Participant | null => {
      if (!conversation) return null;
      const profiles = toArray<Participant>(conversation.participants);
      const other = profiles.find((p) => p.id !== user?.id);
      if (other) return other;
      const otherId = conversation.participantIds?.find((id) => id !== user?.id);
      return otherId ? { id: otherId } : null;
    },
    [user?.id],
  );

  const participantName = useCallback(
    (conversation: Conversation | null) => {
      const other = otherParticipant(conversation);
      if (other) return fullName(other.firstName, other.lastName, 'Conversation');
      return 'Conversation';
    },
    [otherParticipant],
  );

  const participantInitials = useCallback(
    (conversation: Conversation | null) => {
      const other = otherParticipant(conversation);
      if (other) return initials(other.firstName, other.lastName, '?');
      return '?';
    },
    [otherParticipant],
  );

  const filteredConvos = conversationList.filter((convo) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const name = participantName(convo).toLowerCase();
    const last = convo.messages?.[0]?.content?.toLowerCase() ?? '';
    return name.includes(query) || last.includes(query);
  });

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConvoId(id);
    setShowMobileChat(true);
    setShowInfo(false);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMobileChat(false);
    setShowInfo(false);
  }, []);

  const handleSend = useCallback(async () => {
    const content = messageInput.trim();
    if (!content || !activeConvoId || sending) return;
    setSending(true);
    setMessageInput('');
    try {
      await sendMessage(content);
    } catch (error) {
      setMessageInput(content);
      emitToast(errorMessage(error, 'Message could not be sent. Please retry.'), 'error');
    } finally {
      setSending(false);
    }
  }, [activeConvoId, messageInput, sendMessage, sending]);

  const handleSendImage = useCallback(
    async (url: string) => {
      if (!activeConvoId) return;
      try {
        await sendMessage(url, 'image', url);
        setShowAttach(false);
        emitToast('Image shared', 'success');
      } catch (error) {
        emitToast(errorMessage(error, 'Could not share the image.'), 'error');
      }
    },
    [activeConvoId, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  if (!hydrated || !accessToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {hydrated ? 'Redirecting to sign in…' : 'Loading messages…'}
        </p>
      </div>
    );
  }

  const currentOther = otherParticipant(activeConvo);
  const callHref = currentOther?.phone ? `tel:${currentOther.phone}` : null;

  return (
    <div
      className="mx-auto flex h-[calc(100dvh-3.5rem-96px)] w-full max-w-[1280px] flex-col lg:h-[calc(100dvh-4rem)]"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Mobile top bar */}
      <header
        className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:hidden"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <button
          onClick={handleBackToList}
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: 'var(--color-bg-glass)', color: 'var(--color-text-secondary)' }}
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Messages
        </h1>
        <button
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          aria-label="New conversation"
          onClick={() => setShowCompose(true)}
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Conversation list */}
        <aside
          className={`min-h-0 flex-col border-r md:flex md:w-[360px] md:shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
          style={{
            borderColor: 'var(--color-border-default)',
            background: 'var(--color-bg-elevated)',
          }}
          aria-label="Conversations"
        >
          <div
            className="hidden shrink-0 items-center justify-between border-b px-4 py-4 md:flex"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Messages
            </h2>
            <button
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
              aria-label="New conversation"
              onClick={() => setShowCompose(true)}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div
            className="mx-4 my-3 flex shrink-0 items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Search className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {convosLoading && (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="skeleton h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-24 rounded" />
                      <div className="skeleton h-2 w-40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!convosLoading && convosError && (
              <EmptyState
                icon={MessageCircle}
                title="Could not load conversations"
                description="Check your connection and try again."
                actionLabel="Retry"
                onAction={() => void refetchConversations()}
                compact
              />
            )}

            {!convosLoading && !convosError && filteredConvos.length === 0 && (
              <EmptyState
                icon={MessageCircle}
                title={searchQuery ? 'No matching conversations' : 'No conversations yet'}
                description={
                  searchQuery
                    ? 'Try a different name or message.'
                    : 'Start a conversation from a property listing or with a user ID.'
                }
                actionLabel={searchQuery ? undefined : 'New conversation'}
                onAction={searchQuery ? undefined : () => setShowCompose(true)}
                compact
              />
            )}

            {filteredConvos.map((convo) => {
              const lastMsg = convo.messages?.[0];
              const isUnread = Boolean(
                lastMsg && lastMsg.senderId !== user?.id && !lastMsg.readAt,
              );
              return (
                <button
                  key={convo.id}
                  onClick={() => handleSelectConversation(convo.id)}
                  className="flex w-full items-start gap-3 border-b px-4 py-4 text-left transition-colors"
                  style={{
                    borderColor: 'var(--color-border-subtle)',
                    background:
                      activeConvoId === convo.id ? 'var(--color-bg-glass)' : 'transparent',
                    borderLeft:
                      activeConvoId === convo.id
                        ? '3px solid var(--color-brand-accent)'
                        : '3px solid transparent',
                  }}
                >
                  <div
                    className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold"
                    style={{
                      background: 'var(--color-brand-primary)',
                      color: 'var(--color-text-inverse)',
                    }}
                  >
                    {participantInitials(convo)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between">
                      <span
                        className="truncate text-sm font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {participantName(convo)}
                      </span>
                      <span
                        className="ml-2 shrink-0 text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {lastMsg?.createdAt ? formatTime(lastMsg.createdAt, '') : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: 'var(--color-brand-accent)' }}
                        />
                      )}
                      <span
                        className="truncate text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {lastMsg?.content ?? 'No messages yet'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat pane */}
        <section
          className={`min-h-0 min-w-0 flex-1 flex-col ${showMobileChat ? 'flex' : 'hidden md:flex'}`}
          style={{ background: 'var(--color-bg-base)' }}
        >
          {activeConvoId ? (
            <>
              <div
                className="flex shrink-0 items-center gap-3 px-4 py-3"
                style={{
                  background: 'var(--color-bg-glass)',
                  backdropFilter: 'var(--glass-blur)',
                  borderBottom: '1px solid var(--color-border-glass)',
                }}
              >
                <button
                  onClick={handleBackToList}
                  className="grid h-10 w-10 place-items-center rounded-full md:hidden"
                  style={{
                    background: 'var(--color-bg-glass)',
                    color: 'var(--color-text-secondary)',
                  }}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold"
                  style={{
                    background: 'var(--color-brand-primary)',
                    color: 'var(--color-text-inverse)',
                  }}
                >
                  {participantInitials(activeConvo)}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-sm font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {participantName(activeConvo)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {safeText(currentOther?.role, 'Member')}
                    {activeConvo?.propertyId ? ' · Property enquiry' : ''}
                  </div>
                </div>
                <div className="flex gap-1">
                  <a
                    href={callHref ?? '#'}
                    onClick={(e) => {
                      if (!callHref) {
                        e.preventDefault();
                        emitToast('This contact has no phone number on file.', 'info');
                      }
                    }}
                    className="grid h-10 w-10 place-items-center rounded-full"
                    style={{ color: 'var(--color-text-secondary)' }}
                    aria-label="Call contact"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => setShowInfo((v) => !v)}
                    className="grid h-10 w-10 place-items-center rounded-full"
                    style={{ color: 'var(--color-text-secondary)' }}
                    aria-label="Conversation details"
                    aria-expanded={showInfo}
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {showInfo && (
                <div
                  className="shrink-0 border-b px-4 py-3 text-sm"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <span>
                      Contact: <strong>{participantName(activeConvo)}</strong>
                    </span>
                    {currentOther?.phone ? (
                      <a href={`tel:${currentOther.phone}`} style={{ color: 'var(--color-brand-accent)' }}>
                        {currentOther.phone}
                      </a>
                    ) : null}
                    {activeConvo?.propertyId ? (
                      <Link
                        href={`/properties/${activeConvo.propertyId}`}
                        style={{ color: 'var(--color-brand-accent)' }}
                      >
                        View related property
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}

              <div
                className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
                role="log"
                aria-label="Messages"
                aria-live="polite"
                style={{ scrollbarWidth: 'thin' }}
              >
                {msgsLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className="skeleton h-10 w-32 rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}

                {!msgsLoading && msgsError && (
                  <EmptyState
                    icon={MessageCircle}
                    title="Could not load messages"
                    description="Please check your connection and reopen this conversation."
                    compact
                  />
                )}

                {!msgsLoading && !msgsError && messageList.length === 0 && (
                  <EmptyState
                    icon={MessageCircle}
                    title="No messages yet"
                    description="Say hello to start the conversation."
                    compact
                  />
                )}

                {messageList.map((msg, idx) => {
                  const isSelf = msg.senderId === user?.id;
                  const prev = idx > 0 ? messageList[idx - 1] : null;
                  const showDateDivider =
                    idx === 0 ||
                    new Date(msg.createdAt ?? 0).toDateString() !==
                      new Date(prev?.createdAt ?? 0).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDateDivider && msg.createdAt ? (
                        <div
                          className="relative my-4 text-center text-xs font-semibold"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <span className="px-4" style={{ background: 'var(--color-bg-base)' }}>
                            {new Date(msg.createdAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      ) : null}
                      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="relative max-w-[80%] px-4 py-3 text-sm shadow-sm"
                          style={{
                            background: isSelf
                              ? 'var(--color-brand-accent)'
                              : 'var(--color-bg-glass)',
                            color: isSelf
                              ? 'var(--color-text-inverse)'
                              : 'var(--color-text-primary)',
                            borderRadius: isSelf
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            border: isSelf ? 'none' : '1px solid var(--color-border-glass)',
                          }}
                        >
                          {msg.type === 'image' && msg.mediaUrl ? (
                            <div className="mb-1 max-w-[240px] overflow-hidden rounded-lg">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={msg.mediaUrl}
                                alt="Shared attachment"
                                className="w-full"
                                loading="lazy"
                              />
                            </div>
                          ) : null}
                          <div className="whitespace-pre-wrap break-words">
                            {safeText(msg.content, '')}
                          </div>
                          <span
                            className="mt-1 flex items-center justify-end gap-1 text-[11px]"
                            style={{
                              color: isSelf
                                ? 'rgba(255,255,255,0.75)'
                                : 'var(--color-text-muted)',
                            }}
                          >
                            {msg.createdAt ? formatTime(msg.createdAt, '') : ''}
                            {isSelf ? (
                              msg.readAt ? (
                                <CheckCheck className="h-3.5 w-3.5" aria-label="Read" />
                              ) : (
                                <Check className="h-3.5 w-3.5" aria-label="Sent" />
                              )
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div
                className="flex shrink-0 items-center gap-2 px-4 py-3"
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                <button
                  onClick={() => setShowAttach(true)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="Attach image"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-w-0 flex-1 rounded-full px-4 py-3 text-sm outline-none"
                  style={{
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  aria-label="Message"
                />
                <button
                  onClick={() => void handleSend()}
                  disabled={!messageInput.trim() || sending}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-sm disabled:opacity-50"
                  style={{
                    background: 'var(--color-brand-accent)',
                    color: 'var(--color-text-inverse)',
                  }}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={MessageCircle}
                title="Select a conversation"
                description="Choose a conversation from the list or start a new one."
                actionLabel="New conversation"
                onAction={() => setShowCompose(true)}
              />
            </div>
          )}
        </section>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onCreated={(id) => {
            setShowCompose(false);
            setActiveConvoId(id);
            setShowMobileChat(true);
            void refetchConversations();
          }}
        />
      )}

      {showAttach && (
        <AttachModal onClose={() => setShowAttach(false)} onSend={handleSendImage} />
      )}
    </div>
  );
}

function ComposeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [participantId, setParticipantId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = participantId.trim();
    if (!id) {
      setError('Enter the user ID you want to message.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const conversation = await createConversation(
        [id],
        propertyId.trim() || undefined,
      );
      const newId = (conversation as { id?: string })?.id;
      if (!newId) throw new Error('Conversation could not be created.');
      emitToast('Conversation created', 'success');
      onCreated(newId);
    } catch (err) {
      setError(errorMessage(err, 'Could not start this conversation.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="New conversation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="compose-user" className="mb-1 block text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Recipient user ID
          </label>
          <input
            id="compose-user"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="e.g. seed-user-agent-0001"
            className="w-full rounded-md px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="compose-property" className="mb-1 block text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Property ID <span className="font-normal">(optional)</span>
          </label>
          <input
            id="compose-property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="Attach a listing to this conversation"
            className="w-full rounded-md px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Tip: open a property listing and choose “Message agent” to start with context.
        </p>
        {error ? (
          <p role="alert" className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <HwButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </HwButton>
          <HwButton type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Starting…' : 'Start conversation'}
          </HwButton>
        </div>
      </form>
    </ModalShell>
  );
}

function AttachModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = new URL(url.trim());
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('Only http(s) image URLs are supported.');
    } catch {
      setError('Enter a valid image URL (https://…).');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSend(url.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Share an image" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="attach-url" className="mb-1 block text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Image URL
          </label>
          <input
            id="attach-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
            autoFocus
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <HwButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </HwButton>
          <HwButton type="submit" variant="primary" disabled={submitting}>
            <Paperclip className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Share image'}
          </HwButton>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-xl p-6 shadow-xl"
        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ color: 'var(--color-text-muted)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
