import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { emailTemplates, emailLogs } from '../../drizzle/schema';
import { DEFAULT_EMAIL_TEMPLATES } from './email-templates.defaults';

export type EmailTemplateRow = typeof emailTemplates.$inferSelect;

interface EmailSendResult {
  status: 'sent' | 'simulated' | 'failed' | 'skipped';
  providerStatus: 'configured' | 'fallback';
  emailLogId?: string;
  providerMessageId?: string | null;
  error?: string | null;
}

/**
 * Config-driven transactional email service backed by Resend.
 *
 * Templates are stored in the `EmailTemplate` table (admin-editable via the
 * web GUI) with hardcoded fallback defaults in `email-templates.defaults.ts`.
 * Rendering substitutes `{{varName}}` placeholders. Email delivery is
 * asynchronous (fire-and-forget with error capture in `EmailLog`) so the
 * caller's flow is never blocked by an email outage. When `RESEND_API_KEY` is
 * absent (dev/staging) delivery is simulated — the rendered content is logged
 * and a log row records status `simulated`, matching the Paystack/DocuSeal
 * graceful-degradation pattern.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private templateCache = new Map<string, { template: EmailTemplateRow | null; expiresAt: number }>();
  private readonly TTL = 5 * 60 * 1000;
  private client: Resend | null = null;

  constructor(private db: DrizzleService) {}

  onModuleInit() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.client = new Resend(apiKey);
      this.logger.log('Resend client initialised');
    } else {
      this.logger.warn('RESEND_API_KEY is not set — transactional emails will be simulated');
    }
  }

  get providerConfigured(): boolean {
    return Boolean(this.client);
  }

  /** Returns `from` email in `Name <email>` shape. */
  private defaultFrom(): string {
    const name = process.env.RESEND_FROM_NAME ?? 'Homewolves';
    const email = process.env.RESEND_FROM_EMAIL ?? 'noreply@homewolves.africa';
    return `${name} <${email}>`;
  }

  private async resolveTemplate(key: string): Promise<EmailTemplateRow | null> {
    const cached = this.templateCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.template;

    let template: EmailTemplateRow | null = null;
    try {
      const [row] = await this.db.select().from(emailTemplates).where(eq(emailTemplates.key, key));
      template = row ?? null;
    } catch (err) {
      this.logger.warn(`Email template lookup failed (${key}): ${(err as Error).message}`);
    }

    if (!template) {
      const fallback = DEFAULT_EMAIL_TEMPLATES.find((t) => t.key === key);
      if (fallback) {
        template = {
          id: `fallback-${fallback.key}`,
          key: fallback.key,
          name: fallback.name,
          subject: fallback.subject,
          htmlBody: fallback.htmlBody,
          textBody: fallback.textBody ?? null,
          fromEmail: null,
          active: true,
          updatedAt: new Date(),
        } as EmailTemplateRow;
      }
    }

    this.templateCache.set(key, { template, expiresAt: Date.now() + this.TTL });
    return template;
  }

  /** Replaces `{{varName}}` occurrences (case-insensitive, dotted keys allowed). */
  render(template: string, variables: Record<string, unknown>): string {
    const lookup = new Map(Object.entries(variables).map(([k, v]) => [k.toLowerCase(), v]));
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, name: string) => {
      const value = lookup.get(name.toLowerCase());
      if (value == null) return '';
      return String(value);
    });
  }

  async listTemplates(): Promise<EmailTemplateRow[]> {
    try {
      return (await this.db.select().from(emailTemplates).orderBy(emailTemplates.key)) as EmailTemplateRow[];
    } catch (err) {
      this.logger.warn(`Email template list failed, returning fallbacks: ${(err as Error).message}`);
      return DEFAULT_EMAIL_TEMPLATES.map((t) => ({
        id: `fallback-${t.key}`,
        key: t.key,
        name: t.name,
        subject: t.subject,
        htmlBody: t.htmlBody,
        textBody: t.textBody ?? null,
        fromEmail: null,
        active: true,
        updatedAt: new Date(),
      })) as EmailTemplateRow[];
    }
  }

  async upsertTemplate(data: {
    key: string;
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string | null;
    fromEmail?: string | null;
    active?: boolean;
  }): Promise<EmailTemplateRow> {
    const [row] = await this.db
      .insert(emailTemplates)
      .values({
        key: data.key,
        name: data.name,
        subject: data.subject,
        htmlBody: data.htmlBody,
        textBody: data.textBody ?? null,
        fromEmail: data.fromEmail ?? null,
        active: data.active ?? true,
      })
      .onConflictDoUpdate({
        target: emailTemplates.key,
        set: {
          name: data.name,
          subject: data.subject,
          htmlBody: data.htmlBody,
          textBody: data.textBody ?? null,
          fromEmail: data.fromEmail ?? null,
          active: data.active ?? true,
          updatedAt: new Date(),
        },
      })
      .returning();
    this.templateCache.delete(data.key);
    return row as EmailTemplateRow;
  }

  async seedDefaultsIfEmpty(): Promise<number> {
    const existing = await this.db.select({ key: emailTemplates.key }).from(emailTemplates);
    const existingKeys = new Set(existing.map((r) => r.key));
    const missing = DEFAULT_EMAIL_TEMPLATES.filter((t) => !existingKeys.has(t.key));
    if (missing.length === 0) return 0;
    for (const t of missing) {
      await this.upsertTemplate({
        key: t.key,
        name: t.name,
        subject: t.subject,
        htmlBody: t.htmlBody,
        textBody: t.textBody,
        active: t.active,
      });
      this.logger.log(`Seeded email template: ${t.key}`);
    }
    return missing.length;
  }

  renderPreview(data: { key: string; subject: string; htmlBody: string; textBody?: string | null }) {
    return { subject: data.subject, htmlBody: data.htmlBody, textBody: data.textBody ?? null };
  }

  /**
   * Fire-and-forget transactional email. Resolves the template (DB → fallback),
   * renders subject/body, dispatches via Resend (or simulates), and writes an
   * `EmailLog` row. Never throws — errors are captured in the log.
   */
  async send(
    to: string | string[],
    templateKey: string,
    variables: Record<string, unknown>,
  ): Promise<EmailSendResult> {
    const template = await this.resolveTemplate(templateKey);
    const result: EmailSendResult = {
      status: 'skipped',
      providerStatus: this.providerConfigured ? 'configured' : 'fallback',
      error: null,
    };

    const logRow = async (
      status: 'sent' | 'simulated' | 'failed' | 'skipped',
      subject: string,
      providerMessageId?: string | null,
      error?: string | null,
    ): Promise<void> => {
      try {
        const recipients = Array.isArray(to) ? to.join(',') : to;
        const [row] = await this.db
          .insert(emailLogs)
          .values({
            toEmail: recipients,
            templateKey,
            subject,
            status,
            providerMessageId: providerMessageId ?? null,
            error: error ?? null,
            metadata: { variables },
          })
          .returning();
        result.emailLogId = row?.id;
        result.providerMessageId = providerMessageId ?? null;
      } catch (logErr) {
        this.logger.error(`Failed to write email log: ${(logErr as Error).message}`);
      }
    };

    if (!template || !template.active) {
      this.logger.warn(`Email template ${templateKey} missing or inactive — email skipped`);
      await logRow('skipped', templateKey);
      return result;
    }

    const enrichedVariables = {
      ...variables,
      siteUrl: variables.siteUrl ?? process.env.WEB_URL ?? 'https://homewolves.africa',
      logoUrl: variables.logoUrl ?? `${process.env.WEB_URL ?? 'https://homewolves.africa'}/logo.png`,
    };
    const subject = this.render(template.subject, enrichedVariables);
    const html = this.render(template.htmlBody, enrichedVariables);
    const text = template.textBody ? this.render(template.textBody, enrichedVariables) : undefined;
    const from = template.fromEmail ?? this.defaultFrom();

    if (!this.client) {
      this.logger.log(`[Email simulated] ${subject} → ${Array.isArray(to) ? to.join(', ') : to}`);
      await logRow('simulated', subject);
      result.status = 'simulated';
      return result;
    }

    try {
      const { data, error } = await this.client.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      });
      if (error) {
        this.logger.warn(`Resend error for ${templateKey}: ${error.message}`);
        await logRow('failed', subject, null, error.message);
        result.status = 'failed';
        result.error = error.message;
        return result;
      }
      await logRow('sent', subject, data?.id ?? null);
      result.status = 'sent';
      result.providerMessageId = data?.id ?? null;
      return result;
    } catch (sendErr) {
      const message = (sendErr as Error).message;
      this.logger.warn(`Resend send failed for ${templateKey}: ${message}`);
      await logRow('failed', subject, null, message);
      result.status = 'failed';
      result.error = message;
      return result;
    }
  }
}