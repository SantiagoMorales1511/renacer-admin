import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  onModuleInit() {
    this.$connect()
      .then(() => this.logger.log('Conexión a PostgreSQL establecida'))
      .catch((error) =>
        this.logger.error('No se pudo conectar a PostgreSQL al iniciar (se reintentará en la primera consulta)', error),
      );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
