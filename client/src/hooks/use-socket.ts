import { useState, useEffect } from 'react';
import { socketManager } from '@/lib/socket';
import { useAuth } from '@/lib/auth';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Set up connection status listener
    const handleConnectionChange = (data: { connected: boolean }) => {
      setIsConnected(data.connected);
    };

    // Set up message listener
    const handleMessage = (data: any) => {
      setLastMessage(JSON.stringify(data));
    };

    socketManager.on('connectionChange', handleConnectionChange);
    socketManager.on('message', handleMessage);

    // Set initial connection status
    setIsConnected(socketManager.isConnected);

    // Set auth token if user is logged in
    if (user) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        socketManager.setToken(token);
      }
    }

    return () => {
      socketManager.off('connectionChange', handleConnectionChange);
      socketManager.off('message', handleMessage);
    };
  }, [user]);

  const sendMessage = (data: any) => {
    socketManager.send(data);
  };

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}
