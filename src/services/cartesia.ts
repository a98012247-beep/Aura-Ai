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
  const headers: Record<string, string> = {};
  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn("Could not get auth token:", e);
    }
  }
  return headers;
}

export class CartesiaError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function parseApiError(response: Response): Promise<string> {
  let errText = response.statusText || `HTTP ${response.status}`;
  try {
    const raw = await response.text();
    if (!raw) return errText;
    try {
      const err = JSON.parse(raw);
      if (typeof err === 'object' && err !== null) {
        if (typeof err.message === 'string' && err.message.trim()) {
          return err.message.trim();
        }
        if (typeof err.error === 'string' && err.error.trim()) {
          try {
            const nested = JSON.parse(err.error);
            if (nested && nested.message) return nested.message;
          } catch {}
          return err.error.trim();
        }
      }
      errText = typeof err === 'string' ? err : JSON.stringify(err);
    } catch {
      errText = raw;
    }
  } catch {
    errText = response.statusText || `HTTP ${response.status}`;
  }
  return errText;
}

export async function fetchSubscription(): Promise<any> {
  return { character_count: 0, character_limit: Infinity, tier: 'Cartesia API' };
}

/**
 * Generate a TTS audio chunk from Cartesia via the backend.
 * @param text     - The text to synthesize
 * @param voiceId  - The Cartesia voice ID
 * @param type     - 'preview' uses public API pool (no credits); 'generation' uses free/paid pool
 */
export async function generateAudioChunk(
  text: string,
  voiceId: string,
  type: 'preview' | 'generation' = 'generation'
): Promise<ArrayBuffer> {
  const authHeaders = await getAuthHeader();

  const response = await fetch("/api/cartesia/generate", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({ text, voiceId, type }),
  });

  if (!response.ok) {
    const errText = await parseApiError(response);
    throw new CartesiaError(`Cartesia API Error: ${response.status} - ${errText}`, response.status);
  }

  return await response.arrayBuffer();
}

/** Merges multiple MP3 array buffers into one Blob */
export function mergeAudioChunks(chunks: ArrayBuffer[]): Blob {
  return new Blob(chunks, { type: 'audio/mpeg' });
}

export async function verifyVoiceAccess(): Promise<boolean> {
  return true;
}

export async function cloneVoice(name: string, description: string, files: File[]): Promise<string> {
  throw new Error("Voice cloning is currently handled directly in Cartesia Console.");
}

export async function fetchVoices(): Promise<any[]> {
  const authHeaders = await getAuthHeader();
  const response = await fetch('/api/cartesia/voices', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errText = await parseApiError(response);
    throw new Error(`Failed to fetch voices: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data || [];
}
