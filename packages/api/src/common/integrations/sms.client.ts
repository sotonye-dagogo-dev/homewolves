import { Injectable, Logger, BadGatewayException } from '@nestjs/common';

export interface SmsSendParams {
  to: string;
  message: string;
  channel?: 'generic' | 'dnd' | 'whatsapp';
}

export interface SmsSendResult {
  status: 'sent' | 'simulated';
  provider: 'termii' | 'simulated';
  messageId?: string;
}

/**
 * Thin wrapper around Termii SMS (Nigeria-first) with graceful dev fallback.
 *
 * Config:
 *  - `TERMII_API_KEY` — enables live sends
 *  - `TERMII_SENDER_ID` — default sender id (fallback: Homewolves)
 *  - `TERMII_API_URL` — override base URL (default: https://api.ng.termii.com)
 *
 * When unconfigured `isConfigured === false` and `send()` returns a simulated
 * result (logs + no throw) — callers must not branch on exception for dev mode.
 */
@Injectable()
export class SmsClient {
  private readonly logger = new Logger(SmsClient.name);
  private readonly apiKey = process.env.TERMII_API_KEY ?? '';
  private readonly senderId = process.env.TERMII_SENDER_ID ?? 'Homewolves';
  private readonly apiUrl = (process.env.TERMII_API_URL ?? 'https://api.ng.termii.com').replace(/\/$/, '');

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!this.isConfigured) {
      throw new BadGatewayException('SMS provider is not configured');
    }
    let res: Response;
    try {
      res = await fetch(`${this.apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new BadGatewayException('SMS provider is unreachable');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.warn(`Termii request failed (${res.status}): ${text.slice(0, 300)}`);
      throw new BadGatewayException('SMS provider request failed');
    }
    return res.json() as Promise<T>;
  }

  async send(params: SmsSendParams): Promise<SmsSendResult> {
    if (!this.isConfigured) {
      this.logger.log(`[SMS simulated] to=${params.to} msg="${params.message.slice(0, 80)}"`);
      return { status: 'simulated', provider: 'simulated' };
    }
    const channel = params.channel ?? 'generic';
    const json = await this.request<{ code: string; message_id?: string; message?: string }>('/api/sms/send', {
      to: params.to,
      from: this.senderId,
      sms: params.message,
      type: 'plain',
      channel,
      api_key: this.apiKey,
    });
    if (json.code !== 'ok' && !json.message_id) {
      throw new BadGatewayException(json.message ?? 'Termii send failed');
    }
    return { status: 'sent', provider: 'termii', messageId: json.message_id };
  }

  async sendOtp(to: string, otp: string): Promise<SmsSendResult> {
    return this.send({ to, message: `Your Homewolves verification code is ${otp}. It expires in 5 minutes.` });
  }

  verifyWebhookSignature(): boolean {
    return true;
  }
}
