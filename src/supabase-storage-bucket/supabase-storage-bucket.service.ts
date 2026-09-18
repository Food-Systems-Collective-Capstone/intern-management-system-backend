import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient} from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageBucketService{
    private readonly client: SupabaseClient;
    private readonly bucketName = 'Resume';

    constructor(){
        this.client = createClient (
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
        )
    };

    async uploadResume (file: Express.Multer.File, personid : string) : Promise<string>{
        const filePath = `${personid}/applicantResume.pdf`;

        const { error } = await this.client.storage .from(this.bucketName) .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
        });

        if (error){
            throw new Error (`Upload has failed: ${error.message}`);
        }

        return filePath;
    }
}
