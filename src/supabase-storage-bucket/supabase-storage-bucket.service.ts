import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageBucketService {
  private readonly client: SupabaseClient;
  private readonly resumeBucketName = 'Resume';
  private readonly taskSubmissionBucketName = 'Task-Submissions';

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    ) as SupabaseClient;
  }

  async uploadResume(
    file: Express.Multer.File,
    personId: string,
  ): Promise<string> {
    const filePath = `${personId}/applicantResume.pdf`;

    const { error } = await this.client.storage
      .from(this.resumeBucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload has failed: ${error.message}`);
    }

    return filePath;
  }

  async uploadTaskSubmission(
    file: Express.Multer.File,
    taskId: string,
    internId: string,
  ): Promise<string> {
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${internId}/${taskId}/${Date.now()}-${safeFileName}`;

    const { error } = await this.client.storage
      .from(this.taskSubmissionBucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Task submission upload failed: ${error.message}`);
    }

    return filePath;
  }
}
