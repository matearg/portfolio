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

type Credentials = NonNullable<ReturnType<typeof credentials>>;

// Signed POST to a Cloudinary endpoint; `params` are signed, `file` is sent unsigned.
async function signedPost(
  creds: Credentials,
  endpoint: 'upload' | 'destroy',
  params: Record<string, string>,
  file?: Blob,
) {
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  const body = new FormData();
  if (file) body.append('file', file);
  for (const [k, v] of Object.entries(signed)) body.append(k, String(v));
  body.append('api_key', creds.key);
  body.append('signature', sign(signed, creds.secret));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${creds.cloud}/image/${endpoint}`,
    { method: 'POST', body },
  );
  if (!res.ok) {
    throw new BadGatewayException(`Image ${endpoint} failed (${res.status})`);
  }
  return res;
}

@Injectable()
export class CloudinaryService {
  async upload(file: Express.Multer.File): Promise<string> {
    const creds = credentials();
    if (!creds) {
      throw new InternalServerErrorException('CLOUDINARY_URL is not set');
    }
    // Copy: Blob rejects Buffer's ArrayBufferLike (could be shared) under TS 6 typings.
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    const res = await signedPost(creds, 'upload', { folder: FOLDER }, blob);
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
    await signedPost(creds, 'destroy', { public_id: publicId });
  }
}
