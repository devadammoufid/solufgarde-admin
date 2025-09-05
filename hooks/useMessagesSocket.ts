// hooks/useMessagesSocket.ts - Socket.IO client for messages
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getMessagesWsUrl } from '@/lib/ws';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ConversationSummary {
  id: string;
  title?: string;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  clientId?: string;
  remplacantId?: string;
}

export function useMessagesSocket() {
  const { getAuthToken, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const url = useMemo(() => getMessagesWsUrl(), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getAuthToken();
    if (!token) return;

    // Append token as query for guards that read from handshake.query
    const urlWithQuery = url.includes('?') ? `${url}&token=${encodeURIComponent(token)}` : `${url}?token=${encodeURIComponent(token)}`;

    const s = io(urlWithQuery, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Many WsJwtGuards accept either raw token or Bearer format via auth
      auth: { token, Authorization: `Bearer ${token}` },
      // extraHeaders are ignored in browsers; kept for SSR/Node environments
      extraHeaders: { Authorization: `Bearer ${token}` },
      path: '/socket.io',
      withCredentials: true,
    });

    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
      socketRef.current = null;
    };
  }, [url, getAuthToken, isAuthenticated]);

  const sendMessage = (payload: { conversationId: string; body: string }) => {
    socketRef.current?.emit('message:send', payload);
  };

  const markRead = (payload: { id: string }) => {
    socketRef.current?.emit('message:read', payload);
  };

  const on = <T = any>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  };

  return {
    socket: socketRef.current,
    connected,
    sendMessage,
    markRead,
    on,
  };
}

export default useMessagesSocket;
