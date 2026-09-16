import { Injectable, Logger, BadGatewayException } from '@nestjs/common';

export interface StorageUploadParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface StorageUploadResult {
  url: string;
  key: string;
}

/**
 * Thin wrapper around S3-compatible storage (Cloudflare R2 / AWS S3).
 *
 * Config (all optional — unconfigured → simulated mode):
 *  - `S3_ENDPOINT` / `R2_ENDPOINT` — base endpoint
 *  - `S3_BUCKET` / `R2_BUCKET` — bucket name
 *  - `S3_ACCESS_KEY_ID` / `R2_ACCESS_KEY_ID`
 *  - `S3_SECRET_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY`
 *  - `S3_PUBLIC_URL` — public base URL for returned URLs (fallback: endpoint/bucket)
 *
 * When unconfigured `isConfigured === false`; `upload()` returns a simulated
 * URL and `getSignedUrl()` returns a deterministic placeholder — never throws
 * in dev so callers do not need a separate dev branch.
 */
@Injectable()
export class StorageClient {
  private readonly logger = new Logger(StorageClient.name);

  private get endpoint(): string {
    return process.env.S3_ENDPOINT ?? process.env.R2_ENDPOINT ?? '';
  }
  private get bucket(): string {
    return process.env.S3_BUCKET ?? process.env.R2_BUCKET ?? '';
  }
  private get accessKeyId(): string {
    return process.env.S3_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID ?? '';
  }
  private get secretAccessKey(): string {
    return process.env.S3_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY ?? '';
  }
  private get publicUrl(): string {
    return (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '');
  }

  get isConfigured(): boolean {
    return Boolean(this.endpoint && this.bucket && this.accessKeyId && this.secretAccessKey);
  }

  private publicBase(): string {
    if (this.publicUrl) return this.publicUrl;
    if (this.endpoint && this.bucket) return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}`;
    return 'https://storage.local';
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    if (!this.isConfigured) {
      this.logger.log(`[Storage simulated] upload key=${params.key} (${typeof params.body === 'string' ? params.body.length : (params.body as Uint8Array).length} bytes)`);
      return { key: params.key, url: `${this.publicBase()}/${params.key}` };
    }
    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${params.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': params.contentType ?? 'application/octet-stream',
          Authorization: `Bearer ${this.accessKeyId}`,
        },
        body: params.body as BodyInit,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Storage upload failed (${res.status}): ${text.slice(0, 300)}`);
        throw new BadGatewayException('Storage upload failed');
      }
      return { key: params.key, url: `${this.publicBase()}/${params.key}` };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      throw new BadGatewayException(`Storage upload error: ${(err as Error).message}`);
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicBase()}/${key}`;
  }

  async delete(key: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.log(`[Storage simulated] delete key=${key}`);
      return;
    }
    const res = await fetch(`${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.accessKeyId}` },
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => '');
      this.logger.warn(`Storage delete failed (${res.status}): ${text.slice(0, 300)}`);
      throw new BadGatewayException('Storage delete failed');
    }
  }

  getStatus(): { configured: boolean; endpoint: string | null; bucket: string | null } {
    return {
      configured: this.isConfigured,
      endpoint: this.endpoint || null,
      bucket: this.bucket || null,
    };
  }
}
