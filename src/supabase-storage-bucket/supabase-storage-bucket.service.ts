import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient} from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageBucketService {
    private readonly client: SupabaseClient;
    private readonly bucketName: 'Resume';

    constructor(){
        this.client = createClient (
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
        )
    };

    async uploadResume (){
        
    }
}
