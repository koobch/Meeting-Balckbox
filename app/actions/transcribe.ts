"use server";

import { createClient } from '@supabase/supabase-js';

// Initialize clients strictly server-side to avoid exposing keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

// Create clients only if keys are available
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function transcribeAudio(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file provided');
        }

        if (!supabase || !elevenLabsApiKey) {
            console.warn('Server configuration missing: Supabase or ElevenLabs keys not found.');
            // For demo purposes, return a mock response if keys are missing
            // In production, this should throw an error
            return {
                text: "[DEMO] 서버 설정(API KEY)이 누락되어 실제 전사를 수행하지 못했습니다. .env 파일에 ELEVENLABS_API_KEY와 Supabase 키를 확인해주세요.",
                audioUrl: null
            };
        }

        // 1. Upload to Supabase Storage
        const BUCKET_NAME = 'recordings';

        // Check if bucket exists, create if not
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === BUCKET_NAME);

        if (!bucketExists) {
            console.log(`Bucket '${BUCKET_NAME}' not found, attempting to create...`);
            const { error: createBucketError } = await supabase.storage.createBucket(BUCKET_NAME, {
                public: true,
                allowedMimeTypes: ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3'],
                fileSizeLimit: 10485760 // 10MB
            });

            if (createBucketError) {
                console.error('Failed to create bucket:', createBucketError);
                throw new Error(`Bucket creation failed: ${createBucketError.message}`);
            }
        }

        const fileName = `recording-${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('recordings')
            .getPublicUrl(fileName);

        // 2. Transcribe with ElevenLabs Scribe API
        const scribeFormData = new FormData();
        scribeFormData.append('file', file);
        scribeFormData.append('model_id', 'scribe_v2');
        scribeFormData.append('tag_audio_events', 'true');

        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': elevenLabsApiKey,
            },
            body: scribeFormData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`ElevenLabs API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const transcriptionData = await response.json();

        return {
            text: transcriptionData.text,
            audioUrl: publicUrl
        };

    } catch (error: any) {
        console.error('Transcription process failed:', error);
        return { error: error.message || 'Failed to process audio' };
    }
}

export async function transcribeSampleFile() {
    // Demo function for testing without a real microphone
    return {
        text: "[TEST] 샘플 오디오 전사 결과입니다. 마이크 권한 없이 기능을 테스트할 수 있습니다. 실제 파일 전송 로직은 transcribeAudio 함수를 참고하세요.",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Sample public audio
    };
}
