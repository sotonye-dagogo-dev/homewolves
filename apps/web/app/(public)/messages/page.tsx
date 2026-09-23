'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useConversations, useMessages, useMessaging } from '@/hooks/use-messaging';
import { fetchConversation, markConversationRead } from '@/lib/messaging';
import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convosLoading } = useConversations();
  const { data: messages, isLoading: msgsLoading } = useMessages(activeConvoId ?? '');
  const { sendMessage, markRead } = useMessaging(activeConvoId ?? undefined);

  const [activeConvo, setActiveConvo] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) router.replace('/auth');
  }, [accessToken, router]);

  useEffect(() => {
    if (activeConvoId) {
      markConversationRead(activeConvoId);
      markRead();
      fetchConversation(activeConvoId).then(setActiveConvo);
    }
  }, [activeConvoId, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConvoId(id);
    setShowMobileChat(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMobileChat(false);
  }, []);

  const handleSend = useCallback(() => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput.trim());
    setMessageInput('');
  }, [messageInput, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const filteredConvos = (Array.isArray(conversations) ? conversations : []).filter((c: any) =>
    c?.messages?.[0]?.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const otherParticipantName = (conversation: any) => {
    const otherId = conversation?.participantIds?.find((id: string) => id !== user?.id);
    return otherId ? `User ${otherId.slice(0, 6)}` : 'Unknown';
  };

  const otherParticipantInitials = (conversation: any) => {
    return otherParticipantName(conversation).slice(0, 2).toUpperCase();
  };

  return (
    <div
      className="flex flex-col h-screen max-w-[1280px] mx-auto"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Mobile top bar */}
      <header
        className="flex md:hidden items-center justify-between px-4 py-3 shrink-0"
        style={{
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border-subtle)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
      >
        <button
          onClick={handleBackToList}
          className="w-10 h-10 grid place-items-center rounded-full"
          style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }}
          aria-label="Back"
        >
          &#8592;
        </button>
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-brand-primary)' }}>
          Messages
        </h1>
        <button
          className="w-10 h-10 grid place-items-center rounded-full"
          style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          aria-label="New chat"
        >
          +
        </button>
      </header>

      {/* Desktop two-pane layout */}
      <div className="flex flex-1 h-full md:flex-row flex-col">
        {/* ─── Conversation List Pane (left, 360px) ─── */}
        <aside
          className={`flex flex-col shrink-0 md:flex ${showMobileChat ? 'hidden md:flex' : 'flex'}`}
          style={{ width: '100%', maxWidth: '100%', borderRight: '1px solid var(--color-border-default)', background: 'var(--color-bg-elevated)' }}
        >
          {/* Desktop: full width on mobile, 360px on desktop */}
          <div className="flex flex-col h-full md:w-[360px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 shrink-0 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="hidden md:flex items-center gap-2">
                <button onClick={handleBackToList} className="w-10 h-10 grid place-items-center rounded-full" style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }} aria-label="Back">
                  &#8592;
                </button>
              </div>
              <h2 className="hidden md:block text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-brand-primary)' }}>
                Messages
              </h2>
              <button
                className="w-10 h-10 grid place-items-center rounded-full"
                style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                aria-label="Compose"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            {/* Search */}
            <div className="mx-4 my-3 flex items-center gap-2 px-4 py-2 rounded-full shrink-0" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {convosLoading && (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 skeleton rounded" />
                        <div className="h-2 w-40 skeleton rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!convosLoading && filteredConvos.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No conversations yet</p>
              )}
              {filteredConvos.map((convo: any) => {
                const lastMsg = convo.messages?.[0];
                const isUnread = lastMsg && lastMsg.senderId !== user?.id && !lastMsg.readAt;
                return (
                  <div
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo.id)}
                    className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors border-b ${activeConvoId === convo.id ? 'bg-opacity-50' : ''}`}
                    style={{
                      borderColor: 'var(--color-border-subtle)',
                      background: activeConvoId === convo.id ? 'var(--color-bg-glass)' : 'transparent',
                      borderLeft: activeConvoId === convo.id ? '3px solid var(--color-brand-accent)' : '3px solid transparent',
                    }}
                  >
                    <div className="w-12 h-12 rounded-full grid place-items-center text-sm font-bold shrink-0 relative" style={{ background: 'var(--color-brand-primary)', color: 'var(--color-text-inverse)' }}>
                      {otherParticipantInitials(convo)}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: 'var(--color-success)', borderColor: 'var(--color-bg-elevated)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {otherParticipantName(convo)}
                        </span>
                        <span className="text-xs shrink-0 ml-2" style={{ color: 'var(--color-text-muted)' }}>
                          {lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUnread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--color-brand-accent)' }} />}
                        <span className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                          {lastMsg?.content ?? 'No messages yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ─── Chat Pane (right) ─── */}
        <section
          className={`flex-1 flex flex-col min-w-0 ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}
          style={{ background: 'var(--color-bg-base)' }}
        >
          {activeConvoId ? (
            <>
              {/* Chat header */}
              <div
                className="flex items-center gap-3 px-4 py-3 shrink-0"
                style={{
                  background: 'var(--color-bg-glass)',
                  backdropFilter: 'var(--glass-blur)',
                  borderBottom: '1px solid var(--color-border-glass)',
                }}
              >
                <button
                  onClick={handleBackToList}
                  className="md:hidden w-10 h-10 grid place-items-center rounded-full"
                  style={{ background: 'var(--color-bg-glass)', backdropFilter: 'var(--glass-blur-subtle)' }}
                  aria-label="Back to list"
                >
                  &#8592;
                </button>
                {activeConvo?.propertyId ? (
                  <>
                    <div className="w-12 h-9 rounded-lg shrink-0" style={{ background: 'var(--color-border-subtle)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {activeConvo?.propertyId ? `Property ${activeConvo.propertyId.slice(0, 8)}` : 'Conversation'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-accent)' }}>
                        {otherParticipantName(activeConvo)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {otherParticipantName(activeConvo)}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Chat with agent
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="w-10 h-10 grid place-items-center rounded-full text-lg transition-colors" style={{ color: 'var(--color-text-secondary)' }} aria-label="Call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </button>
                  <button className="w-10 h-10 grid place-items-center rounded-full text-lg transition-colors" style={{ color: 'var(--color-text-secondary)' }} aria-label="Info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" role="log" aria-label="Messages" aria-live="polite" style={{ scrollbarWidth: 'thin' }}>
                {msgsLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className="h-10 w-32 skeleton rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}
                {!msgsLoading && messages?.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No messages yet. Start the conversation!</p>
                )}
                {messages?.map((msg: any, idx: number) => {
                  const isSelf = msg.senderId === user?.id;
                  const prev: any = idx > 0 ? messages[idx - 1] : null;
                  const showDateDivider =
                    idx === 0 ||
                    new Date(msg.createdAt).toDateString() !== new Date(prev?.createdAt ?? 0).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDateDivider && (
                        <div className="text-center my-4 text-xs font-semibold relative" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="px-4" style={{ background: 'var(--color-bg-base)' }}>
                            {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="relative px-4 py-3 max-w-[80%] text-sm shadow-xs"
                          style={{
                            background: isSelf ? 'var(--color-brand-accent)' : 'var(--color-bg-glass)',
                            color: isSelf ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                            borderRadius: isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            backdropFilter: isSelf ? 'none' : 'var(--glass-blur-subtle)',
                            border: isSelf ? 'none' : '1px solid var(--color-border-glass)',
                          }}
                        >
                          {msg.type === 'image' && msg.mediaUrl && (
                            <div className="max-w-[240px] rounded-lg overflow-hidden mb-1">
                              <img src={msg.mediaUrl} alt="Shared image" className="w-full" loading="lazy" />
                            </div>
                          )}
                          <div>{msg.content}</div>
                          <span
                            className="block text-xs mt-1"
                            style={{ color: isSelf ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', opacity: 0.7 }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            {isSelf && (
                              <span className="ml-1">{msg.readAt ? '✓✓' : '✓'}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input row */}
              <div
                className="flex items-center gap-2 px-4 py-3 shrink-0"
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                }}
              >
                <button className="w-11 h-11 grid place-items-center rounded-full shrink-0 transition-colors" style={{ color: 'var(--color-text-muted)' }} aria-label="Attach file">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <button className="w-11 h-11 grid place-items-center rounded-full shrink-0 transition-colors" style={{ color: 'var(--color-text-muted)' }} aria-label="Attach image">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-3 rounded-full text-sm outline-none"
                  style={{
                    background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  onClick={handleSend}
                  className="w-11 h-11 grid place-items-center rounded-full shrink-0 shadow-sm"
                  style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
                  aria-label="Send"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4 opacity-30">💬</div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
