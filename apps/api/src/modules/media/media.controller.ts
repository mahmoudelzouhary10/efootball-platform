import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ErrorCode, MediaResponse } from '@efp/contracts';
import type { Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../common/errors/app-error';
import { ZodPipe } from '../../common/validation/zod-body.pipe';
import { MEDIA_KINDS, MediaKind } from '../../db/schema';
import { CurrentAuth, Public } from '../identity/auth.decorators';
import type { AuthContext } from '../identity/session.service';
import { MAX_UPLOAD_BYTES, MediaService } from './media.service';

const uploadQuerySchema = z.strictObject({ kind: z.enum(MEDIA_KINDS) });

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0, parts: 2 },
    }),
  )
  async upload(
    @CurrentAuth() auth: AuthContext,
    @Query(new ZodPipe(uploadQuerySchema)) q: { kind: MediaKind },
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<MediaResponse> {
    if (!auth.emailVerified) {
      throw new AppError(403, ErrorCode.EMAIL_NOT_VERIFIED, 'Confirm your email first');
    }
    if (!file) throw new AppError(400, ErrorCode.MEDIA_INVALID, 'No file uploaded');
    return this.media.uploadImage(auth.userId, q.kind, file.buffer);
  }

  /** Public: logos and avatars appear on public pages. Ids are unguessable UUIDs and content is immutable. */
  @Public()
  @Get(':id')
  async serve(@Param('id', new ParseUUIDPipe()) id: string, @Res() res: Response): Promise<void> {
    const file = await this.media.read(id);
    if (!file) throw AppError.notFound();
    res
      .status(200)
      .type(file.contentType)
      .setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      .setHeader('Content-Disposition', 'inline')
      .send(file.body);
  }
}
