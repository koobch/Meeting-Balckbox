"use client";

import React, { useState, useRef, useEffect } from 'react';
import { transcribeAudio, transcribeSampleFile } from '@/app/actions/transcribe';
import { AlertCircle, FileAudio, Mic, MicOff, Loader2, Save, Download, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function VoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [supabaseAudioUrl, setSupabaseAudioUrl] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioBlobRef = useRef<Blob | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/ogg';
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
                audioBlobRef.current = audioBlob;
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setAudioUrl(null);
            setTranscription(null);
            setSupabaseAudioUrl(null);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access is required to record audio.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleTranscribe = async () => {
        if (!audioBlobRef.current) return;

        setIsTranscribing(true);
        setSupabaseAudioUrl(null);
        try {
            const formData = new FormData();
            formData.append('file', audioBlobRef.current);

            const result = await transcribeAudio(formData);
            if ('error' in result) {
                alert(result.error);
            } else if ('text' in result) {
                setTranscription(result.text as string);
                if (result.audioUrl) {
                    setSupabaseAudioUrl(result.audioUrl as string);
                    console.log(`%c[DevTools] Supabase Audio URL: ${result.audioUrl}`, "color: #2563eb; font-weight: bold;");
                }
            }
        } catch (err) {
            console.error("Transcription failed:", err);
            alert("Failed to transcribe audio.");
        } finally {
            setIsTranscribing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div className="w-full max-w-md p-6 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-2xl transition-all duration-500">
            <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Voice Recorder
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Tap the button to start recording
                    </p>
                </div>

                {/* Recording Visualizer (Simplified) */}
                <div className="relative flex items-center justify-center h-24 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
                    {isRecording ? (
                        <div className="flex gap-1 items-center justify-center">
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1.5 h-4 bg-blue-500 rounded-full animate-pulse"
                                    style={{
                                        animationDelay: `${i * 0.1}s`,
                                        height: `${Math.random() * 40 + 20}px`
                                    }}
                                ></div>
                            ))}
                            <span className="ml-4 font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatTime(recordingTime)}
                            </span>
                        </div>
                    ) : (
                        <div className="text-zinc-400 dark:text-zinc-600 font-medium">Ready to record</div>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    {!isRecording ? (
                        <div className="flex flex-col gap-3 items-center">
                            <button
                                onClick={startRecording}
                                className="group relative flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
                            >
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse group-hover:scale-125 transition-transform"></div>
                                Start Recording
                            </button>

                            <button
                                onClick={async () => {
                                    setIsTranscribing(true);
                                    setTranscription(null);
                                    setSupabaseAudioUrl(null);
                                    try {
                                        const result = await transcribeSampleFile();
                                        if ('error' in result) alert(result.error);
                                        else if ('text' in result) {
                                            setTranscription(result.text as string);
                                            if (result.audioUrl) {
                                                setSupabaseAudioUrl(result.audioUrl as string);
                                                console.log(`%c[DevTools] Supabase Audio URL: ${result.audioUrl}`, "color: #2563eb; font-weight: bold;");
                                            }
                                        }
                                    } catch (err) {
                                        alert("Sample test failed.");
                                    } finally {
                                        setIsTranscribing(false);
                                    }
                                }}
                                disabled={isTranscribing}
                                className="text-sm font-medium text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors py-2 px-4 rounded-lg bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-500/10"
                            >
                                📁 Test with Sample MP3
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-full font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <div className="w-3 h-3 bg-current rounded-sm"></div>
                            Stop Recording
                        </button>
                    )}
                </div>

                {audioUrl && (
                    <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-500 mt-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <audio src={audioUrl} controls className="w-full h-10 rounded-lg" />

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleTranscribe}
                                disabled={isTranscribing}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20"
                            >
                                {isTranscribing ? (
                                    <>
                                        <Loader2 className="animate-spin h-5 w-5" />
                                        Transcribing...
                                    </>
                                ) : (
                                    <>
                                        <FileAudio className="w-5 h-5" />
                                        Transcribe to Text (ElevenLabs Scribe)
                                    </>
                                )}
                            </button>

                            <a
                                href={audioUrl}
                                download="recording.webm"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-bold transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Download Audio
                            </a>
                        </div>

                        {transcription && (
                            <div
                                data-supabase-url={supabaseAudioUrl || undefined}
                                className="flex flex-col gap-4 p-5 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-700/50 shadow-inner animate-in zoom-in-95 duration-500 max-h-96 overflow-y-auto"
                            >
                                <div className="flex items-center justify-between sticky top-0 bg-inherit py-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Transcription</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(transcription);
                                                alert("Copied to clipboard!");
                                            }}
                                            className="text-xs flex items-center gap-1.5 text-zinc-600 hover:text-blue-600 font-semibold transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy
                                        </button>
                                        <a
                                            href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcription)}`}
                                            download="transcription.txt"
                                            className="text-xs flex items-center gap-1.5 text-zinc-600 hover:text-emerald-600 font-semibold transition-colors"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            Save
                                        </a>
                                    </div>
                                </div>
                                <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium whitespace-pre-wrap">
                                    {transcription}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
