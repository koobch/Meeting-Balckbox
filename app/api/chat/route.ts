/**
 * n8n Chat Trigger 연동용 프록시 API
 * - @n8n/chat 위젯과 동일한 요청 형식: https://www.npmjs.com/package/@n8n/chat
 * - 쿼리: ?action=sendMessage | loadPreviousSession
 * - Body: chatInputKey 기본 'chatInput', chatSessionKey 기본 'sessionId', metadata 선택
 */
import { NextRequest, NextResponse } from "next/server";

const N8N_CHAT_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;

export async function POST(request: NextRequest) {
    if (!N8N_CHAT_WEBHOOK_URL) {
        return NextResponse.json(
            { error: "N8N_CHAT_WEBHOOK_URL is not configured" },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const {
            sessionId,
            chatInput,
            action = "sendMessage",
            metadata,
        } = body as {
            sessionId?: string;
            chatInput?: string;
            action?: "sendMessage" | "loadPreviousSession";
            metadata?: Record<string, unknown>;
        };

        const url = new URL(N8N_CHAT_WEBHOOK_URL);
        url.searchParams.set("action", action);

        // n8n에서 {{ $json.chatInput }} 등으로 받을 수 있도록 객체 하나만 전송
        const n8nBody: Record<string, unknown> = {
            action,
            sessionId: sessionId ?? crypto.randomUUID(),
            chatInput: chatInput ?? "",
        };
        if (metadata != null && typeof metadata === "object") {
            n8nBody.metadata = metadata;
        }

        const res = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n8nBody),
        });

        const contentType = res.headers.get("content-type") ?? "";

        // 🔍 디버깅 로그 (개발 중에만 사용)
        if (process.env.NODE_ENV === 'development') {
            console.log('[api/chat] Response status:', res.status);
            console.log('[api/chat] Content-Type:', contentType);
        }

        // 1️⃣ 실제 스트리밍(SSE/NDJSON) 응답 처리
        const isStreaming =
            contentType.includes("text/event-stream") ||
            contentType.includes("application/x-ndjson");

        if (res.body && isStreaming) {
            return new NextResponse(res.body, {
                status: res.status,
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        }

        // 2️⃣ 응답 body 읽기 (한 번만 읽을 수 있음)
        const rawText = await res.text();

        if (process.env.NODE_ENV === "development") {
            console.log("[api/chat] rawText length:", rawText.length);
            console.log("[api/chat] rawText (first 500):", rawText.slice(0, 500));
            console.log("[api/chat] rawText (last 500):", rawText.slice(-500));
        }

        let data: unknown = {};

        if (!rawText.trim()) {
            if (process.env.NODE_ENV === "development") {
                console.log("[api/chat] rawText is empty");
            }
        } else {
            // 2-1. 단일 JSON 시도 (n8n이 [{ output: "..." }] 로 주는 경우)
            try {
                data = JSON.parse(rawText);
                if (process.env.NODE_ENV === "development") {
                    console.log("[api/chat] parsed as single JSON, type:", Array.isArray(data) ? "array" : typeof data);
                }
            } catch {
                // 2-2. NDJSON: 한 줄에 하나씩 JSON (n8n 스트리밍이 application/json으로 올 때)
                const lines = rawText.split(/\r?\n/).filter((s) => s.trim());
                if (process.env.NODE_ENV === "development") {
                    console.log("[api/chat] single JSON failed, trying NDJSON. lines:", lines.length);
                }
                const parsed: unknown[] = [];
                let outputText = "";
                for (let i = 0; i < lines.length; i++) {
                    try {
                        const obj = JSON.parse(lines[i]) as Record<string, unknown>;
                        parsed.push(obj);
                        if (process.env.NODE_ENV === "development" && i < 5) {
                            console.log("[api/chat] NDJSON line", i, "type:", obj.type, "keys:", Object.keys(obj));
                        }
                        if (obj && typeof obj === "object") {
                            if (typeof obj.output === "string") outputText = obj.output;
                            else if (typeof obj.text === "string") outputText = obj.text;
                            else if (typeof obj.data === "string") outputText += obj.data;
                            else if (obj.type === "data" && typeof obj.data === "string") outputText += obj.data;
                            // n8n 스트리밍 NDJSON: type "item" 이고 content 가 문자열 (한 줄씩 조각)
                            else if (obj.type === "item" && typeof obj.content === "string") outputText += obj.content;
                            else if (obj.type === "data" && obj.data != null && typeof obj.data === "object") {
                                const d = obj.data as Record<string, unknown>;
                                if (typeof d.text === "string") outputText += d.text;
                                if (typeof d.output === "string") outputText += d.output;
                            }
                        }
                    } catch (lineErr) {
                        if (process.env.NODE_ENV === "development") {
                            console.log("[api/chat] NDJSON line parse fail, index:", i, "line:", lines[i].slice(0, 100));
                        }
                    }
                }
                // NDJSON에서 output/text를 찾았으면 배열 형태로 통일해서 반환
                if (outputText) {
                    data = [{ output: outputText }];
                    if (process.env.NODE_ENV === "development") {
                        console.log("[api/chat] extracted from NDJSON, output length:", outputText.length);
                    }
                } else {
                    data = parsed.length ? parsed : {};
                    if (process.env.NODE_ENV === "development") {
                        console.log("[api/chat] NDJSON parsed, items:", parsed.length, "sample keys:", parsed.slice(0, 3).map((p) => p && typeof p === "object" ? Object.keys(p as object) : []));
                    }
                }
            }
        }

        if (process.env.NODE_ENV === "development") {
            const summary =
                Array.isArray(data) && data.length > 0
                    ? `array(${data.length}), first keys: ${Object.keys((data[0] as object) || {}).join(",")}`
                    : typeof data === "object" && data !== null
                        ? `object keys: ${Object.keys(data as object).join(",")}`
                        : String(data);
            console.log("[api/chat] Response data (summary):", summary);
        }

        return NextResponse.json(data, { status: res.status });

    } catch (e) {
        console.error("[api/chat] n8n proxy error:", e);
        return NextResponse.json(
            { error: "Chat service temporarily unavailable" },
            { status: 502 }
        );
    }
}