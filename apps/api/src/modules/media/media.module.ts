import { Module } from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../../config/env';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalDiskStorage, Storage } from './storage';

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: Storage,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) => new LocalDiskStorage(cfg.MEDIA_DIR),
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
