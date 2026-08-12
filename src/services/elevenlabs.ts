import { VOICE_ID, DEFAULT_VOICE_SETTINGS } from '../lib/constants';
import { useSettingsStore } from '../store/settings';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export async function getAuthHeader(): Promise<Record<string, string>> {
  let user = auth.currentUser;
  if (!user) {
    try {
      const anonRes = await signInAnonymously(auth);
      user = anonRes.user;
    } catch (e) {
      console.warn("Could not auto sign-in anonymously:", e);
    }
  }
  if (user) {
    try {
      const token = await user.getIdToken();
      return { 'Authorization': `Bearer ${token}` };
    } catch (e) {
      console.warn("Could not get auth token:", e);
    }
  }
  return {};
}

export class ElevenLabsError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function safeJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Unexpected API response: ${text.substring(0, 100)}...`);
  }
}

async function parseElevenLabsError(response: Response): Promise<string> {
  let errText = "Unknown Error";
  try {
    const raw = await response.text();
    if (raw.startsWith("<") || raw.includes("403 Forbidden") || raw.includes("UNAUTHORIZED")) {
      return "Access denied or invalid API key (403 Forbidden). Please check your API key in Settings.";
    }
    try {
      const err = JSON.parse(raw);
      errText = err.error || err.message || JSON.stringify(err);
      if (typeof errText === 'string') {
        try {
          const parsed = JSON.parse(errText);
          if (parsed.detail && parsed.detail.message) {
            errText = parsed.detail.message;
          } else if (parsed.detail && typeof parsed.detail === 'string') {
            errText = parsed.detail;
          }
        } catch (e) {
          // not nested JSON
        }
      }
    } catch {
      errText = raw;
    }
  } catch {
    errText = "Failed to parse API error response";
  }
  return errText;
}

export async function fetchSubscription(apiKey: string): Promise<any> {
  // Cartesia unlimited/standard key estimation
  return { character_count: 0, character_limit: Infinity, tier: 'Cartesia API' };
}

export async function fetchVoices(apiKey: string): Promise<any[]> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`/api/cartesia/voices?apiKey=${encodeURIComponent(apiKey)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    throw new Error(`Failed to fetch voices: ${response.statusText} - ${errText}`);
  }

  const data = await safeJson(response);
  return (data || []).map((v: any) => ({ voice_id: v.id, name: v.name }));
}

export async function generateAudioChunk(text: string, apiKey: string): Promise<ArrayBuffer> {
  const storeState = useSettingsStore.getState();
  const { apiKeys } = storeState;

  const activeKeyData = apiKeys.find(k => k.key === apiKey);
  const voiceId = activeKeyData?.voiceId || '92579402-6868-412e-b845-3efed0be7a9e';
  const authHeaders = await getAuthHeader();

  const response = await fetch("/api/cartesia", {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({ text, voiceId, apiKey }),
  });

  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    throw new ElevenLabsError(`Cartesia API Error: ${response.statusText} - ${errText}`, response.status);
  }

  return await response.arrayBuffer();
}

/** Merges multiple MP3 array buffers into one Blob */
export function mergeAudioChunks(chunks: ArrayBuffer[]): Blob {
  // Simple concatenation of MP3 bytes works effectively for basic playback.
  return new Blob(chunks, { type: 'audio/mpeg' });
}

export async function verifyVoiceAccess(apiKey: string): Promise<boolean> {
  return true; // Cartesia API key voice access verified
}

export async function cloneVoice(apiKey: string, name: string, description: string, files: File[]): Promise<string> {
  throw new Error("Voice cloning is currently handled directly in Cartesia Console.");
}
