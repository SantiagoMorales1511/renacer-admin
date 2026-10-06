import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServerResponse } from 'http';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { ReceiptStorageService, UploadedReceipt } from './receipt-storage.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../common/audit/audit.service';
import { EventsGateway } from '../websocket/events.gateway';

const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private receipts: ReceiptStorageService,
    private audit: AuditService,
    private events: EventsGateway,
  ) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('studentId') studentId?: string,
    @Query('groupId') groupId?: string,
  ) {
    return this.paymentsService.findAll({ from, to, studentId, groupId });
  }

  @Post('receipt')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: RECEIPT_MAX_BYTES } }))
  async uploadReceipt(@UploadedFile() file?: UploadedReceipt) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    const stored = await this.receipts.save(file);
    return { receiptUrl: stored.key };
  }

  @Get(':id/receipt')
  async downloadReceipt(@Param('id') id: string, @Res() res: ServerResponse) {
    const key = await this.paymentsService.getReceiptKey(id);
    const file = await this.receipts.read(key);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    file.stream.pipe(res);
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    const created = await this.paymentsService.create(dto, user.id);
    await this.audit.log({ userId: user.id, action: 'create', entity: 'payment', entityId: created.id });
    this.events.emit('payment_created', { id: created.id });
    return created;
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.paymentsService.update(id, dto);
    await this.audit.log({ userId: user.id, action: 'update', entity: 'payment', entityId: id });
    this.events.emit('payment_updated', { id });
    return updated;
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const res = await this.paymentsService.remove(id);
    await this.audit.log({ userId: user.id, action: 'delete', entity: 'payment', entityId: id });
    return res;
  }
}
