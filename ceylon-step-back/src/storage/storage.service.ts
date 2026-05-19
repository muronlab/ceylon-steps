import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_KEY');
    this.bucket = this.config.get<string>('SUPABASE_BUCKET') || 'ceylon-step-storage';

    if (url && key) {
      this.supabase = createClient(url, key);
    } else {
      this.logger.error('Supabase URL or Key is missing!');
    }
  }

  async uploadFile(file: Express.Multer.File, path: string) {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      url: publicUrlData.publicUrl,
    };
  }

  async getFileUrl(path: string) {
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(path: string): Promise<{ success: boolean }> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }

    return { success: true };
  }
}
