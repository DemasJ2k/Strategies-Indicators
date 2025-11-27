import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAgentStore } from '../store/useAgentStore';

export default function LiveListener() {
  const setExecutionCandles = useAgentStore((s) => s.setExecutionCandles);
  const setResult = useAgentStore((s) => s.setResult);

  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('🔌 Live socket connected:', socket.id);
    });

    socket.on('liveAnalysis', (msg: any) => {
      console.log('📡 Live analysis received:', msg);

      const { symbol, instrument, timeframe, candles, result } = msg;

      if (candles && candles.length) {
        setExecutionCandles(candles, instrument || 'FOREX', timeframe || '15m');
      }

      if (result) {
        setResult(result);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Live socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [setExecutionCandles, setResult]);

  // No visible UI - this is a background listener
  return null;
}
