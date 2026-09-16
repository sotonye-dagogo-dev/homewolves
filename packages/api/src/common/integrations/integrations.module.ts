import { Module, Global } from '@nestjs/common';
import { PaystackClient } from './paystack.client';
import { DocuSealClient } from './docuseal.client';
import { SmsClient } from './sms.client';
import { StorageClient } from './storage.client';

/**
 * Shared external-provider clients (Paystack, DocuSeal, SMS, Storage).
 *
 * Each client reads its own env configuration and reports `isConfigured`.
 * Feature modules consume them through DI and are expected to degrade
 * gracefully when a provider is not configured.
 */
@Global()
@Module({
  providers: [PaystackClient, DocuSealClient, SmsClient, StorageClient],
  exports: [PaystackClient, DocuSealClient, SmsClient, StorageClient],
})
export class IntegrationsModule {}
