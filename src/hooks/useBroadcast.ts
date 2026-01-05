// Supabase Realtime Broadcast hook for multi-device sync
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { LocalGameState } from '@/lib/localGameState';

// Message types for broadcast
export type BroadcastMessageType = 
  | 'game_state'      // Full state sync from host
  | 'team_join'       // Team requesting to join
  | 'team_joined'     // Host confirms team joined
  | 'guess'           // Team submitting a guess
  | 'pass'            // Team passing their turn
  | 'continue';       // Team continuing after correct guess

export interface BroadcastMessage {
  type: BroadcastMessageType;
  payload: any;
  senderId: string;
  timestamp: number;
}

interface UseBroadcastOptions {
  gameCode: string;
  isHost: boolean;
  onMessage?: (message: BroadcastMessage) => void;
  onGameState?: (state: LocalGameState) => void;
}

export function useBroadcast({ gameCode, isHost, onMessage, onGameState }: UseBroadcastOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const deviceId = useRef(getOrCreateDeviceId());
  
  // Store callbacks in refs to avoid re-subscribing on every render
  const onMessageRef = useRef(onMessage);
  const onGameStateRef = useRef(onGameState);
  
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    onGameStateRef.current = onGameState;
  }, [onGameState]);

  // Subscribe to channel - only re-subscribe when gameCode or isHost changes
  useEffect(() => {
    if (!gameCode) return;

    const channelName = `game:${gameCode}`;
    console.log(`[Broadcast] Subscribing to channel: ${channelName}`);

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: deviceId.current },
      },
    });

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const message = payload as BroadcastMessage;
        console.log(`[Broadcast] Received:`, message.type, message);

        // Handle game state updates for non-hosts
        if (!isHost && message.type === 'game_state' && onGameStateRef.current) {
          onGameStateRef.current(message.payload as LocalGameState);
        }

        // Forward all messages to handler
        if (onMessageRef.current) {
          onMessageRef.current(message);
        }
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        // When a new client joins, host should broadcast current state
        if (isHost && key !== deviceId.current) {
          console.log(`[Broadcast] New client joined, will broadcast state`);
          // Signal to resend state - done via ref callback
          if (onMessageRef.current) {
            onMessageRef.current({
              type: 'team_join' as BroadcastMessageType,
              payload: { requestState: true },
              senderId: key,
              timestamp: Date.now(),
            });
          }
        }
      })
      .subscribe((status) => {
        console.log(`[Broadcast] Channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Track presence
          channel.track({ online: true });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[Broadcast] Unsubscribing from channel: ${channelName}`);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [gameCode, isHost]); // Only gameCode and isHost - not callbacks

  // Send a message
  const sendMessage = useCallback((type: BroadcastMessageType, payload: any) => {
    if (!channelRef.current) {
      console.warn('[Broadcast] Cannot send - not connected');
      return;
    }

    const message: BroadcastMessage = {
      type,
      payload,
      senderId: deviceId.current,
      timestamp: Date.now(),
    };

    console.log(`[Broadcast] Sending:`, type, payload);

    channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    });
  }, []);

  // Host: broadcast full game state
  const broadcastGameState = useCallback((state: LocalGameState) => {
    sendMessage('game_state', state);
  }, [sendMessage]);

  // Team: request to join
  const requestJoin = useCallback((teamName: string) => {
    sendMessage('team_join', { teamName });
  }, [sendMessage]);

  // Team: submit guess
  const submitGuess = useCallback((position: 'before' | 'after' | 'between', referenceCardId: string, secondCardId?: string) => {
    sendMessage('guess', { position, referenceCardId, secondCardId });
  }, [sendMessage]);

  // Team: pass turn
  const passTurn = useCallback(() => {
    sendMessage('pass', {});
  }, [sendMessage]);

  // Team: continue after correct guess
  const continueGame = useCallback(() => {
    sendMessage('continue', {});
  }, [sendMessage]);

  return {
    isConnected,
    sendMessage,
    broadcastGameState,
    requestJoin,
    submitGuess,
    passTurn,
    continueGame,
    deviceId: deviceId.current,
  };
}

// Helper to get or create a persistent device ID
function getOrCreateDeviceId(): string {
  const key = 'hitster_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
