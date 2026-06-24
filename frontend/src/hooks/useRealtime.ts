import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_URL } from '../services/api';

const EVENT_QUERY_MAP: Record<string, string[]> = {
  payment_created: ['payments', 'daily-cash', 'dashboard', 'assistant-home', 'cash-flow', 'reports', 'student', 'cartera'],
  payment_updated: ['payments', 'daily-cash', 'dashboard', 'assistant-home', 'cash-flow', 'reports', 'student', 'cartera'],
  payment_deleted: ['payments', 'daily-cash', 'dashboard', 'assistant-home', 'cash-flow', 'reports', 'student', 'cartera'],
  attendance_updated: ['session', 'assistant-home', 'student', 'reports', 'cartera', 'group'],
  student_created: ['students', 'dashboard', 'assistant-home', 'group'],
  group_created: ['groups', 'dashboard'],
  expense_created: ['expenses', 'dashboard', 'cash-flow', 'reports'],
  expense_updated: ['expenses', 'dashboard', 'cash-flow', 'reports'],
  expense_deleted: ['expenses', 'dashboard', 'cash-flow', 'reports'],
  session_updated: ['sessions', 'session', 'dashboard', 'assistant-home', 'group'],
  program_created: ['programs'],
  event_created: ['events', 'program', 'programs'],
  event_updated: ['events', 'event', 'program'],
};

let socket: Socket | null = null;

export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ['websocket'] });
    }
    const client = socket;

    const handlers: Array<[string, () => void]> = Object.entries(EVENT_QUERY_MAP).map(
      ([event, keys]) => {
        const handler = () => {
          keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
        };
        client.on(event, handler);
        return [event, handler];
      },
    );

    return () => {
      handlers.forEach(([event, handler]) => client.off(event, handler));
    };
  }, [queryClient]);
}
