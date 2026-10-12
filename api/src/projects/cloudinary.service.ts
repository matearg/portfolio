import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';

const FOLDER = 'portfolio';

// Cloudinary's signed-upload signature: sorted params joined with &, then the secret, SHA-1.
export const sign = (params: Record<string, string | number>, secret: string) =>
  createHash('sha1')
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&') + secret,
    )
    .digest('hex');

@Injectable()
export class CloudinaryService {
  async upload(file: Express.Multer.File): Promise<string> {
    if (!process.env.CLOUDINARY_URL) {
      throw new InternalServerErrorException('CLOUDINARY_URL is not set');
    }
    // Format from Cloudinary's dashboard: cloudinary://<key>:<secret>@<cloud>
    const {
      username: key,
      password: secret,
      hostname: cloud,
    } = new URL(process.env.CLOUDINARY_URL);
    const params = { folder: FOLDER, timestamp: Math.floor(Date.now() / 1000) };
    const body = new FormData();
    // Copy: Blob rejects Buffer's ArrayBufferLike (could be shared) under TS 6 typings.
    body.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
    );
    body.append('api_key', key);
    body.append('folder', params.folder);
    body.append('timestamp', String(params.timestamp));
    body.append('signature', sign(params, decodeURIComponent(secret)));

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
      { method: 'POST', body },
    );
    if (!res.ok) {
      throw new BadGatewayException(`Image upload failed (${res.status})`);
    }
    return ((await res.json()) as { secure_url: string }).secure_url;
  }
}
