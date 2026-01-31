"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CreateMeetingParams {
    title: string;
    projectId: string; // Passed as string, converted to UUID in DB
    durationSeconds: number;
    transcript: string;
    audioUrl: string; // Used to derive storage path/filename
    participants?: string[];
}

export async function createMeeting(params: CreateMeetingParams) {
    try {
        // Basic extraction of filename from URL if possible, otherwise just use URL
        // URL format: https://.../storage/v1/object/public/recordings/filename.webm
        const urlParts = params.audioUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const storagePath = `recordings/${filename}`;

        const { data, error } = await supabase
            .from('meetings')
            .insert({
                title: params.title,
                project_id: params.projectId, // UUID
                meeting_date: new Date().toISOString(),
                audio_duration_seconds: params.durationSeconds,
                transcript_with_speakers: params.transcript,
                audio_filename: filename,
                audio_storage_path: storagePath,
                status: "completed", // Since we only save after it's done
                participants: params.participants || [],
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to save meeting:', error);
        return { success: false, error: error.message };
    }
}

export async function getMeetings(projectId: string) {
    try {
        const { data, error } = await supabase
            .from('meetings')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to fetch meetings:', error);
        return { success: false, error: error.message };
    }
}
