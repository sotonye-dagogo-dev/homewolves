import { Module } from '@nestjs/common';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { IntegrationsModule } from './common/integrations/integrations.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { AuditModule } from './modules/audit/audit.module';
import { PlatformConfigModule } from './modules/platform-config/platform-config.module';
import { EmailModule } from './modules/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { ListingsModule } from './modules/listings/listing.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { SavedModule } from './modules/saved/saved.module';
import { CrmModule } from './modules/crm/crm.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ActivityModule } from './modules/activity/activity.module';
import { BlogModule } from './modules/blog/blog.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SignaturesModule } from './modules/signatures/signatures.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { FeaturedListingsModule } from './modules/featured-listings/featured-listings.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    RateLimitModule,
    IntegrationsModule,
    DrizzleModule,
    AuditModule.forRoot(),
    PlatformConfigModule,
    EmailModule,
    AuthModule,
    HealthModule,
    ListingsModule,
    RecentlyViewedModule,
    SavedModule,
    CrmModule,
    MessagingModule,
    NotificationsModule,
    AlertsModule,
    TransactionsModule,
    ActivityModule,
    BlogModule,
    DocumentsModule,
    SignaturesModule,
    SubscriptionsModule,
    ReferralsModule,
    FeaturedListingsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
