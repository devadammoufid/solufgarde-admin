'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { protectionConfigs } from '@/components/auth/ProtectedRoute';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import apiClient from '@/lib/api-client';
import useMessagesSocket, { ChatMessage } from '@/hooks/useMessagesSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function MessagesPage() {
  const qc = useQueryClient();
  const { connected, on, sendMessage } = useMessagesSocket();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  // New conversation form
  const [newClientId, setNewClientId] = useState('');
  const [newRemplacantId, setNewRemplacantId] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: conversations, isLoading: loadingConvos, error: convErr } = useQuery({
    queryKey: queryKeys.conversations.list(),
    queryFn: () => apiClient.getConversations(),
    staleTime: 60_000,
  });

  const { data: msgsResp, isLoading: loadingMsgs } = useQuery({
    queryKey: activeId ? queryKeys.conversations.messages(activeId) : ['conversations', 'none', 'messages'],
    queryFn: () => activeId ? apiClient.getConversationMessages(activeId) : Promise.resolve({ data: [], total: 0, page: 1, limit: 50, totalPages: 1 }),
    enabled: Boolean(activeId),
    staleTime: 10_000,
  });

  const messages: ChatMessage[] = useMemo(() => (msgsResp?.data as any[]) || [], [msgsResp]);

  useEffect(() => {
    if (!connected) return;
    const offReceive = on<ChatMessage>('message:receive', (msg) => {
      if (activeId && msg.conversationId === activeId) {
        qc.setQueryData(queryKeys.conversations.messages(activeId), (prev: any) => {
          const next = { ...(prev || { data: [], total: 0, page: 1, limit: 50, totalPages: 1 }) };
          next.data = [...(next.data || []), msg];
          return next;
        });
        // scroll to bottom
        queueMicrotask(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
      }
      // Update conversations list (move to top, increment unread ideally)
      qc.invalidateQueries({ queryKey: queryKeys.conversations.list() as any });
    });

    const offRead = on<{ id: string; readAt: string }>('message:read', (payload) => {
      const convId = activeId;
      if (!convId) return;
      qc.setQueryData(queryKeys.conversations.messages(convId), (prev: any) => {
        if (!prev?.data) return prev;
        const next = { ...prev };
        next.data = prev.data.map((m: any) => (m.id === payload.id ? { ...m, readAt: payload.readAt } : m));
        return next;
      });
    });

    return () => {
      offReceive?.();
      offRead?.();
    };
  }, [connected, activeId, on, qc]);

  const handleSend = () => {
    if (!activeId || !draft.trim()) return;
    // Optimistic append
    const optimistic: ChatMessage = {
      id: `tmp_${Date.now()}`,
      conversationId: activeId,
      senderId: user?.id || 'me',
      content: draft.trim(),
      createdAt: new Date().toISOString(),
    } as any;
    qc.setQueryData(queryKeys.conversations.messages(activeId), (prev: any) => {
      const next = { ...(prev || { data: [], total: 0, page: 1, limit: 50, totalPages: 1 }) };
      next.data = [...(next.data || []), optimistic];
      return next;
    });

    // Try socket, then fallback to REST
    try {
      sendMessage({ conversationId: activeId, body: draft.trim() });
    } catch {
      apiClient.createMessage({ conversationId: activeId, body: draft.trim() }).catch(() => {
        // rollback optimistic on hard failure
        qc.setQueryData(queryKeys.conversations.messages(activeId), (prev: any) => {
          if (!prev?.data) return prev;
          return { ...prev, data: prev.data.filter((m: any) => m.id !== optimistic.id) };
        });
      });
    }
    setDraft('');
  };

  // Mark unread messages as read when viewing a conversation
  useEffect(() => {
    if (!activeId || !messages?.length) return;
    const unread = messages.filter((m: any) => !m.readAt && m.senderId !== user?.id);
    if (unread.length === 0) return;
    unread.forEach((m) => {
      // socket event
      // markRead available via hook if needed later; REST ensures persistence
      apiClient.markMessageRead(m.id).catch(() => {});
    });
  }, [activeId, messages, user?.id]);

  const handleCreateConversation = async () => {
    if (!newClientId || !newRemplacantId) return;
    try {
      setCreating(true);
      const convo = await apiClient.createConversation({ clientId: newClientId, remplacantId: newRemplacantId });
      await qc.invalidateQueries({ queryKey: queryKeys.conversations.list() as any });
      setActiveId(convo.id);
      setNewClientId('');
      setNewRemplacantId('');
    } catch (e) {
      console.error('Failed to create conversation', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute {...protectionConfigs.authenticated}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100dvh-8rem)]">
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {/* New Conversation */}
            <div className="border rounded p-2 space-y-2">
              <div className="text-xs text-muted-foreground">Nouvelle conversation</div>
              <Input placeholder="Client ID" value={newClientId} onChange={(e) => setNewClientId(e.target.value)} />
              <Input placeholder="Remplaçant ID" value={newRemplacantId} onChange={(e) => setNewRemplacantId(e.target.value)} />
              <Button size="sm" onClick={handleCreateConversation} disabled={creating || !newClientId || !newRemplacantId}>Créer</Button>
            </div>

            {loadingConvos ? (
              <div className="text-sm text-muted-foreground">Chargement…</div>
            ) : convErr ? (
              <div className="text-sm text-destructive">Échec du chargement des conversations</div>
            ) : (conversations || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucune conversation</div>
            ) : (
              (conversations || []).map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'w-full text-left p-2 rounded border hover:bg-muted',
                    activeId === c.id && 'bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{c.title || `Conversation ${c.id.slice(0,6)}`}</div>
                    {!!c.unreadCount && <span className="text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5">{c.unreadCount}</span>}
                  </div>
                  {c.lastMessage && (
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage.content}</div>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Messages {connected ? <span className="text-xs text-emerald-600">• connecté</span> : <span className="text-xs text-muted-foreground">• hors ligne</span>}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {!activeId ? (
              <div className="text-sm text-muted-foreground">Sélectionnez une conversation à gauche.</div>
            ) : loadingMsgs ? (
              <div className="text-sm text-muted-foreground">Chargement des messages…</div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 border rounded p-2">
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="font-medium text-xs text-muted-foreground">{m.senderId}</div>
                      <div>{(m as any).body ?? (m as any).content}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Votre message…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={handleSend} disabled={!draft.trim()}>Envoyer</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
