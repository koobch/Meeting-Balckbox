"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CreateMeetingParams {
    title: string;
    projectId: string; // Passed as string, converted to UUID in DB
    durationSeconds?: number;
    transcript: string;
    audioUrl?: string; // Used to derive storage path/filename
    participants?: string[];
}

export async function createMeeting(params: CreateMeetingParams) {
    try {
        // 1. Get current meeting count for this project to create a unique sequential title
        const { count, error: countError } = await supabase
            .from('meetings')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', params.projectId);

        if (countError) console.error('Count error:', countError);

        const sequenceNumber = (count || 0) + 1;
        const finalTitle = `${params.title} #${sequenceNumber}`;

        // 2. Extract storage info if audioUrl exists
        let filename: string | null = null;
        let storagePath: string | null = null;

        if (params.audioUrl) {
            const urlParts = params.audioUrl.split('/');
            filename = urlParts[urlParts.length - 1];
            storagePath = `recordings/${filename}`;
        }

        const { data, error } = await supabase
            .from('meetings')
            .insert({
                title: finalTitle,
                project_id: params.projectId, // UUID
                meeting_date: new Date().toISOString(),
                audio_duration_seconds: params.durationSeconds || 0,
                transcript_with_speakers: params.transcript,
                audio_filename: filename,
                audio_storage_path: storagePath,
                status: "completed", // Since we only save after it's done
                participants: params.participants || [],
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Trigger n8n Webhook
        try {
            const webhookUrl = process.env.N8N_WEBHOOK_URL;

            if (webhookUrl) {
                const payload = [{
                    project_id: params.projectId,
                    title: finalTitle
                }];

                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(err => console.error('n8n Webhook background error:', err));

                console.log('n8n Webhook triggered for meeting:', data.id);
            } else {
                console.warn('N8N_WEBHOOK_URL is not defined in environment variables.');
            }
        } catch (webhookErr) {
            console.error('Failed to trigger n8n webhook:', webhookErr);
        }

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

export async function getMeetingDetails(meetingId: string) {
    try {
        // 1. Fetch meeting
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();

        if (meetingError) throw meetingError;

        // 2. Fetch decisions
        const { data: decisions, error: decisionsError } = await supabase
            .from('decisions')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        if (decisionsError) throw decisionsError;

        // 3. Fetch action items
        const { data: actionItems, error: actionItemsError } = await supabase
            .from('action_items')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        if (actionItemsError) throw actionItemsError;

        // 4. Fetch logic gaps
        const { data: logicGaps, error: logicGapsError } = await supabase
            .from('logic_gaps')
            .select('*')
            .eq('meeting_id', meetingId)
            .order('created_at', { ascending: true });

        if (logicGapsError) throw logicGapsError;

        return {
            success: true,
            data: {
                meeting,
                decisions,
                actionItems,
                logicGaps
            }
        };
    } catch (error: any) {
        console.error('Failed to fetch meeting details:', error);
        return { success: false, error: error.message };
    }
}

export async function updateLogicGapStatus(gapId: string, status: string) {
    try {
        const { data, error } = await supabase
            .from('logic_gaps')
            .update({ review_status: status })
            .eq('id', gapId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to update logic gap status:', error);
        return { success: false, error: error.message };
    }
}
