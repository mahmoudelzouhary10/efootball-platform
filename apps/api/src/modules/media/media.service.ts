import { Inject, Injectable } from '@nestjs/common';
import { ErrorCode, MediaResponse } from '@efp/contracts';
import { and, eq } from 'drizzle-orm';
import sharp from 'sharp';
import { AppError } from '../../common/errors/app-error';
import { RateLimiter } from '../../common/rate-limit/rate-limiter.service';
import { DB, Database, DbExecutor } from '../../db/db.module';
import { media, MediaKind } from '../../db/schema';
import { Storage } from './storage';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const OUTPUT_SIZE = 512;
/** Raster formats only. SVG is refused: it can carry scripts. */
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

/** Public URL path for a stored image (served by MediaController). */
export function mediaUrl(id: string | null | undefined): string | null {
  return id ? `/api/v1/media/${id}` : null;
}

@Injectable()
export class MediaService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly storage: Storage,
    private readonly rateLimiter: RateLimiter,
  ) {}

  /**
   * Validates and re-encodes an uploaded image: decodes it (rejecting anything that isn't a real
   * JPEG/PNG/WebP), applies EXIF orientation, crops to a 512×512 square and writes WebP. The
   * re-encode drops all metadata (GPS, camera) and any payload hidden in the original bytes.
   */
  async uploadImage(userId: string, kind: MediaKind, input: Buffer): Promise<MediaResponse> {
    await this.rateLimiter.consume({ name: 'upload:user', limit: 30, windowSeconds: 3600 }, userId);
    if (input.length === 0 || input.length > MAX_UPLOAD_BYTES)
      throw invalid('Image must be under 2 MB');

    let output: Buffer;
    try {
      const pipeline = sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' });
      const meta = await pipeline.metadata();
      if (!meta.format || !ACCEPTED_FORMATS.has(meta.format))
        throw invalid('Use a JPEG, PNG or WebP image');
      if ((meta.width ?? 0) < 64 || (meta.height ?? 0) < 64)
        throw invalid('Image must be at least 64×64');
      output = await pipeline
        .rotate()
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'cover', position: 'attention' })
        .webp({ quality: 86 })
        .toBuffer();
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw invalid('The file is not a valid image');
    }

    const [row] = await this.db
      .insert(media)
      .values({
        ownerUserId: userId,
        kind,
        storageKey: 'pending',
        contentType: 'image/webp',
        byteSize: output.length,
        width: OUTPUT_SIZE,
        height: OUTPUT_SIZE,
      })
      .returning({ id: media.id });
    const id = row!.id;
    const key = `${kind}/${id}.webp`;
    try {
      await this.storage.put(key, output, 'image/webp');
      await this.db.update(media).set({ storageKey: key }).where(eq(media.id, id));
    } catch (err) {
      await this.db.delete(media).where(eq(media.id, id));
      throw err;
    }
    return { id, url: mediaUrl(id)!, width: OUTPUT_SIZE, height: OUTPUT_SIZE };
  }

  /**
   * Ensures a media id may be attached by this user for this purpose: it exists, has the
   * right kind, and was uploaded by the same user (no attaching other people's uploads).
   */
  async assertOwned(
    mediaId: string,
    userId: string,
    kind: MediaKind,
    executor: DbExecutor = this.db,
  ) {
    const [row] = await executor
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, mediaId), eq(media.ownerUserId, userId), eq(media.kind, kind)));
    if (!row) throw invalid('Upload the image again');
  }

  async read(id: string): Promise<{ body: Buffer; contentType: string } | null> {
    const [row] = await this.db
      .select({ key: media.storageKey, contentType: media.contentType })
      .from(media)
      .where(eq(media.id, id));
    if (!row || row.key === 'pending') return null;
    const body = await this.storage.get(row.key);
    return body ? { body, contentType: row.contentType } : null;
  }
}

function invalid(detail: string): AppError {
  return new AppError(400, ErrorCode.MEDIA_INVALID, detail);
}
