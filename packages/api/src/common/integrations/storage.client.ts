import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

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
 * Thin wrapper around Cloudinary for file storage.
 *
 * Config (all optional — unconfigured → simulated mode):
 *  - `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
 *  - `CLOUDINARY_API_KEY` — Cloudinary API key
 *  - `CLOUDINARY_API_SECRET` — Cloudinary API secret
 *  - `CLOUDINARY_FOLDER` — folder prefix for uploaded assets (default: "homewolves")
 *
 * When unconfigured `isConfigured === false`; `upload()` returns a simulated
 * URL and `delete()` is a no-op — never throws in dev so callers do not need
 * a separate dev branch.
 */
@Injectable()
export class StorageClient {
  private readonly logger = new Logger(StorageClient.name);
  private configured = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
    const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.configured = true;
    }
  }

  private get folder(): string {
    return process.env.CLOUDINARY_FOLDER ?? 'homewolves';
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  private simulatedUrl(key: string): string {
    return `https://res.cloudinary.com/placeholder/image/upload/${this.folder}/${key}`;
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    if (!this.isConfigured) {
      this.logger.log(`[Storage simulated] upload key=${params.key} (${typeof params.body === 'string' ? params.body.length : (params.body as Uint8Array).length} bytes)`);
      return { key: params.key, url: this.simulatedUrl(params.key) };
    }

    try {
      const buffer = Buffer.isBuffer(params.body)
        ? params.body
        : params.body instanceof Uint8Array
          ? Buffer.from(params.body)
          : Buffer.from(params.body);

      const dataUrl = params.contentType
        ? `data:${params.contentType};base64,${buffer.toString('base64')}`
        : `data:application/octet-stream;base64,${buffer.toString('base64')}`;

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          dataUrl,
          { folder: this.folder, public_id: params.key.replace(/\.[^.]+$/, '') },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result);
            else reject(new Error('Upload returned no result'));
          },
        );
      });

      return { key: result.public_id, url: result.secure_url };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.warn(`Storage upload failed: ${(err as Error).message}`);
      throw new BadGatewayException(`Storage upload error: ${(err as Error).message}`);
    }
  }

  getPublicUrl(key: string): string {
    if (!this.isConfigured) return this.simulatedUrl(key);
    return cloudinary.url(`${this.folder}/${key}`, { secure: true });
  }

  async delete(key: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.log(`[Storage simulated] delete key=${key}`);
      return;
    }

    try {
      await cloudinary.uploader.destroy(`${this.folder}/${key}`);
    } catch (err) {
      this.logger.warn(`Storage delete failed: ${(err as Error).message}`);
      throw new BadGatewayException(`Storage delete error: ${(err as Error).message}`);
    }
  }

  getStatus(): { configured: boolean; cloudName: string | null; folder: string } {
    return {
      configured: this.isConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? null,
      folder: this.folder,
    };
  }
}
