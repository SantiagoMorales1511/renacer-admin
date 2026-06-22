import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { getCorsOrigins } from '../common/env';

export type RealtimeEvent =
  | 'payment_created'
  | 'payment_updated'
  | 'payment_deleted'
  | 'attendance_updated'
  | 'student_created'
  | 'group_created'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'session_updated'
  | 'program_created'
  | 'event_created'
  | 'event_updated';

@WebSocketGateway({
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    // servidor socket.io listo
  }

  emit(event: RealtimeEvent, payload?: unknown) {
    if (this.server) {
      this.server.emit(event, payload ?? {});
    }
  }
}
