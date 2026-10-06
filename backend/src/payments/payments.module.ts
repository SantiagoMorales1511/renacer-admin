import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ReceiptStorageService } from './receipt-storage.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, ReceiptStorageService],
})
export class PaymentsModule {}
