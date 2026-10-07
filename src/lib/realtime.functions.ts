import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ChannelSchema = z.object({ threadId: z.string().uuid() });

/**
 * Mint a short-lived Agora RTC token for the signed-in candidate.
 * The App Certificate never leaves the server.
 */
export const getAgoraSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChannelSchema.parse(input))
  .handler(async ({ data, context }) => {
    const appId = process.env["AGORA_APP_ID"];
    const cert = process.env["AGORA_APP_CERTIFICATE"];
    if (!appId || !cert) throw new Error("Agora is not configured");

    const agoraModule: any = await import("agora-token");
    const { RtcTokenBuilder, RtcRole } = agoraModule.default ?? agoraModule;
    // Channel name limited to 64 chars; thread id is a uuid.
    const channel = `es-${data.threadId}`.slice(0, 64);
    // Deterministic numeric uid derived from the user id.
    let uid = 0;
    for (const ch of context.userId) uid = (uid * 31 + ch.charCodeAt(0)) % 2147483647;
    uid = uid || 1;

    const expireSeconds = 60 * 60; // 1 hour session
    const now = Math.floor(Date.now() / 1000);
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      cert,
      channel,
      uid,
      RtcRole.PUBLISHER,
      expireSeconds,
      now + expireSeconds,
    );

    return { appId, channel, uid, token, expiresIn: expireSeconds };
  });

const AnamSchema = z.object({
  role: z.string().max(120).optional().default("Software Engineer"),
  company: z.string().max(120).optional().default("the company"),
  domain: z.string().max(120).optional().default("General"),
  candidateName: z.string().max(120).optional().default("the candidate"),
});

/**
 * Create an Anam session token for the digital-human interviewer.
 * The Anam API key stays server-side.
 */
export const getAnamSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnamSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["ANAM_API_KEY"];
    if (!apiKey) throw new Error("Anam is not configured");
    const personaId = process.env["ANAM_PERSONA_ID"];

    const systemPrompt = `You are Alex, a senior technical interviewer at ${data.company}. You are running a live mock interview with ${data.candidateName} for the role of ${data.role} in the ${data.domain} domain.
Rules:
- Ask one question at a time and wait for the answer.
- Start by greeting the candidate and asking them to introduce themselves.
- Progress from background, to technical depth, to product/system design, to behavioural questions.
- Follow up on vague answers, stay warm but rigorous, and keep your turns under 40 words.
- Never reveal scores or evaluation criteria during the interview.`;

    async function mint(body: unknown) {
      const res = await fetch("https://api.anam.ai/v1/auth/session-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    }

    // Preferred: reuse a configured persona (only valid as a UUID) and override its brief.
    const isUuid = !!personaId && /^[0-9a-f-]{36}$/i.test(personaId);
    let result = isUuid
      ? await mint({ personaConfig: { personaId, systemPrompt } })
      : { ok: false, status: 0, text: "" };

    // Fallback: build the interviewer persona from Anam's stock avatar/voice/LLM.
    if (!result.ok) {
      result = await mint({
        personaConfig: {
          name: "Alex",
          avatarId: "071b0286-4cce-4808-bee2-e642f1062de3", // Liv, seated at home
          voiceId: "90a1acd3-4fc0-11f1-84b0-52bacf74fa75", // Rachel - Polished Presence
          llmId: "27cbd128-f1e6-4b67-8ab3-9123659be08c", // Gemini 3 Flash Preview
          systemPrompt,
        },
      });
    }

    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        throw new Error(
          "The digital interviewer service rejected the saved API key. Please generate a new key and save it again.",
        );
      }
      throw new Error(`Anam session failed: ${result.status} ${result.text.slice(0, 300)}`);
    }

    const json = JSON.parse(result.text || "{}");
    const sessionToken = json.sessionToken ?? json.session_token ?? json.token;
    if (!sessionToken) throw new Error("Anam returned no session token");
    return { sessionToken: sessionToken as string };
  });
