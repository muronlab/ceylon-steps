import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @ApiOperation({ summary: 'Upload a file to Supabase' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        path: {
          type: 'string',
          description: 'The path in the bucket (e.g. avatars/user-1.png)',
        },
      },
    },
  })
  @UseGuards(SessionAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('path') pathParam?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Generate a unique path if not provided
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, '-')}`;
    const path = pathParam || `uploads/${fileName}`;

    return this.storage.uploadFile(file, path);
  }

  @ApiOperation({ summary: 'Get public URL of a file' })
  @Get('url/*path')
  async getUrl(@Param('path') path: string) {
    const url = await this.storage.getFileUrl(path);
    return { url };
  }

  @ApiOperation({ summary: 'Delete a file from Supabase' })
  @UseGuards(SessionAuthGuard)
  @Delete('delete/*path')
  async deleteFile(@Param('path') path: string): Promise<{ success: boolean }> {
    return this.storage.deleteFile(path);
  }
}
