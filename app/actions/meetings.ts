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

        // 4. Fetch logic gaps with research results
        const { data: logicGaps, error: logicGapsError } = await supabase
            .from('logic_gaps')
            .select('*, research_results(*)')
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

export async function updateActionItemStatus(itemId: string, status: string) {
    try {
        const { data, error } = await supabase
            .from('action_items')
            .update({ status })
            .eq('id', itemId)
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to update action item status:', error);
        return { success: false, error: error.message };
    }
}

export async function integrateMeetingItems(items: any[]) {
    try {
        const webhookUrl = process.env.N8N_INTEGRATION_URL;
        if (!webhookUrl) {
            throw new Error('N8N_INTEGRATION_URL is not defined');
        }

        console.log('[Integration] Sending items to n8n:', items.length);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });

        if (!response.ok) {
            throw new Error(`n8n responded with ${response.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error('[Integration] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getProjectOverview(projectId: string) {
    try {
        // 1. Fetch all meetings for this project
        const { data: meetings, error: meetingsError } = await supabase
            .from('meetings')
            .select('*')
            .eq('project_id', projectId)
            .order('meeting_date', { ascending: false });

        if (meetingsError) throw meetingsError;

        const meetingIds = meetings.map(m => m.id);

        // 2. Fetch all decisions for these meetings
        const { data: decisions, error: decisionsError } = await supabase
            .from('decisions')
            .select('*')
            .in('meeting_id', meetingIds);

        if (decisionsError) throw decisionsError;

        // 3. Fetch all action items for these meetings
        const { data: actionItems, error: actionItemsError } = await supabase
            .from('action_items')
            .select('*')
            .in('meeting_id', meetingIds);

        if (actionItemsError) throw actionItemsError;

        // 4. Fetch all logic gaps for these meetings
        const { data: logicGaps, error: logicGapsError } = await supabase
            .from('logic_gaps')
            .select('*')
            .in('meeting_id', meetingIds);

        if (logicGapsError) throw logicGapsError;

        return {
            success: true,
            data: {
                meetings,
                decisions,
                actionItems,
                logicGaps
            }
        };
    } catch (error: any) {
        console.error('Failed to fetch project overview:', error);
        return { success: false, error: error.message };
    }
}

export async function getExternalEvidences(projectId: string) {
    try {
        console.log(`[getExternalEvidences] Fetching for projectId: ${projectId}`);
        const { data, error } = await supabase
            .from('external_evidences')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getExternalEvidences] Supabase error:', error);
            throw error;
        }

        console.log(`[getExternalEvidences] Successfully fetched ${data?.length || 0} items`);
        if (data && data.length > 0) {
            console.log(`[getExternalEvidences] First item sample:`, JSON.stringify(data[0], null, 2));
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Failed to fetch external evidences:', error);
        return { success: false, error: error.message };
    }
}

export async function getProjectById(projectId: string) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('name, description, team_lead, created_at')
            .eq('id', projectId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to fetch project details:', error);
        return { success: false, error: error.message };
    }
}

export async function uploadEvidence(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string;

        if (!file) throw new Error('파일이 제공되지 않았습니다.');
        if (!projectId) throw new Error('프로젝트 ID가 제공되지 않았습니다.');

        // 1. Ensure bucket exists
        const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
        if (getBucketsError) throw getBucketsError;

        const bucketExists = buckets.some(b => b.name === 'evidence');
        if (!bucketExists) {
            const { error: createBucketError } = await supabase.storage.createBucket('evidence', {
                public: true
            });
            if (createBucketError) throw createBucketError;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;

        // Convert File to ArrayBuffer for Supabase upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('evidence')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Fix encoding for Korean filenames
        const decodedFileName = Buffer.from(file.name, 'latin1').toString('utf8');

        // Save metadata to DB
        const { data, error: dbError } = await supabase
            .from('external_evidences')
            .insert({
                project_id: projectId,
                drive_file_id: uploadData.path, // Using storage path as drive_file_id for now
                file_name: decodedFileName,
                file_type: file.type,
                title: decodedFileName.replace(/\.[^/.]+$/, ""), // title without extension
                file_size: Math.round(file.size / 1024).toString(), // Store as KB
                is_integrated: true
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return { success: true, data };
    } catch (error: any) {
        console.error('Evidence upload error:', error);
        return { success: false, error: error.message };
    }
}
