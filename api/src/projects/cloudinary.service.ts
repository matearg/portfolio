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

// Public id of an image this cloud uploaded to our folder, else null:
// https://res.cloudinary.com/<cloud>/image/upload/v123/portfolio/abc.jpg -> portfolio/abc
export const publicIdFromUrl = (url: string, cloud: string) =>
  url.match(
    new RegExp(
      `^https://res\\.cloudinary\\.com/${cloud}/image/upload/(?:v\\d+/)?(${FOLDER}/[^?#]+)\\.\\w+$`,
    ),
  )?.[1] ?? null;

// Format from Cloudinary's dashboard: cloudinary://<key>:<secret>@<cloud>
function credentials() {
  if (!process.env.CLOUDINARY_URL) return null;
  const { username, password, hostname } = new URL(process.env.CLOUDINARY_URL);
  return {
    key: username,
    secret: decodeURIComponent(password),
    cloud: hostname,
  };
}

@Injectable()
export class CloudinaryService {
  async upload(file: Express.Multer.File): Promise<string> {
    const creds = credentials();
    if (!creds) {
      throw new InternalServerErrorException('CLOUDINARY_URL is not set');
    }
    const { key, secret, cloud } = creds;
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
    body.append('signature', sign(params, secret));

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
      { method: 'POST', body },
    );
    if (!res.ok) {
      throw new BadGatewayException(`Image upload failed (${res.status})`);
    }
    return ((await res.json()) as { secure_url: string }).secure_url;
  }

  // Null when unconfigured or when the URL is not ours (external, seed images).
  publicIdOf(url: string) {
    const creds = credentials();
    return creds && publicIdFromUrl(url, creds.cloud);
  }

  async destroy(publicId: string): Promise<void> {
    const creds = credentials();
    if (!creds) return;
    const params = {
      public_id: publicId,
      timestamp: Math.floor(Date.now() / 1000),
    };
    const body = new FormData();
    body.append('api_key', creds.key);
    body.append('public_id', params.public_id);
    body.append('timestamp', String(params.timestamp));
    body.append('signature', sign(params, creds.secret));

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${creds.cloud}/image/destroy`,
      { method: 'POST', body },
    );
    if (!res.ok) {
      throw new BadGatewayException(`Image destroy failed (${res.status})`);
    }
  }
}
