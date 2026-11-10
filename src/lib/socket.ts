'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(userId?: string): Socket {
  if (!socketInstance) {
    socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || '', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      // Re-authenticate when reconnected
      const currentId = userId || (typeof window !== 'undefined' ? localStorage.getItem('connectchat_userId') : null);
      if (currentId) {
        socketInstance?.emit('authenticate', { userId: currentId });
      }
    });
  }

  if (userId && socketInstance.connected) {
    socketInstance.emit('authenticate', { userId });
  }

  return socketInstance;
}

export function useSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    const s = getSocket(userId);
    setSocket(s);
    setIsConnected(s.connected);

    const onConnect = () => {
      setIsConnected(true);
      s.emit('authenticate', { userId });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) {
      s.emit('authenticate', { userId });
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [userId]);

  return { socket, isConnected };
}
