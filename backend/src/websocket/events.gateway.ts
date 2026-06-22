import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

export type RealtimeEvent =
  | 'payment_created'
  | 'attendance_updated'
  | 'student_created'
  | 'group_created'
  | 'expense_created'
  | 'session_updated'
  | 'program_created'
  | 'event_created'
  | 'event_updated';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
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
