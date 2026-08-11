import { VOICE_ID, DEFAULT_VOICE_SETTINGS } from '../lib/constants';
import { useSettingsStore } from '../store/settings';

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
    const err = await safeJson(response.clone());
    errText = err.error || JSON.stringify(err);
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
  } catch {
    errText = await response.text();
  }
  return errText;
}

export async function fetchSubscription(apiKey: string): Promise<any> {
  const response = await fetch(`/api/elevenlabs/subscription?apiKey=${encodeURIComponent(apiKey)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    if (response.status === 403 || errText.includes('missing the permission') || errText.includes('user_read')) {
      return { character_count: 0, character_limit: Infinity, tier: 'Unknown (No Permission)' };
    }
    throw new Error(`Failed to fetch subscription: ${response.statusText} - ${errText}`);
  }

  return await safeJson(response);
}

export async function fetchVoices(apiKey: string): Promise<any[]> {
  const response = await fetch(`/api/elevenlabs/voices?apiKey=${encodeURIComponent(apiKey)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    throw new Error(`Failed to fetch voices: ${response.statusText} - ${errText}`);
  }

  const data = await safeJson(response);
  return data.voices || [];
}

export async function generateAudioChunk(text: string, apiKey: string): Promise<ArrayBuffer> {
  const storeState = useSettingsStore.getState();
  const { voiceSettings, cinematicSettings, apiKeys } = storeState;

  const activeKeyData = apiKeys.find(k => k.key === apiKey);
  const provider = activeKeyData?.provider || 'elevenlabs';
  const voiceId = activeKeyData?.voiceId || 'q109vaFit7lX6QNjx3cW';

  if (provider === 'cartesia') {
    const response = await fetch("/api/cartesia", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, apiKey }),
    });
    if (!response.ok) {
      const errText = await parseElevenLabsError(response);
      throw new ElevenLabsError(`Cartesia API Error: ${response.statusText} - ${errText}`, response.status);
    }
    return await response.arrayBuffer();
  } else if (provider === 'google') {
    const response = await fetch("/api/google", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, apiKey }),
    });
    if (!response.ok) {
      const errText = await parseElevenLabsError(response);
      throw new ElevenLabsError(`Google API Error: ${response.statusText} - ${errText}`, response.status);
    }
    return await response.arrayBuffer();
  }

  // Dimension scaling for ElevenLabs
  const dynamicStability = Math.max(0.2, 0.9 - (cinematicSettings.emotionControl / 100) * 0.6);
  const appliedSettings = {
    ...voiceSettings,
    stability: (voiceSettings.stability + dynamicStability) / 2
  };
  const response = await fetch("/api/elevenlabs", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId, settings: appliedSettings, apiKey }),
  });
  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    throw new ElevenLabsError(`ElevenLabs API Error: ${response.statusText} - ${errText}`, response.status);
  }
  return await response.arrayBuffer();
}

/** Merges multiple MP3 array buffers into one Blob */
export function mergeAudioChunks(chunks: ArrayBuffer[]): Blob {
  // Simple concatenation of MP3 bytes works effectively for basic playback.
  return new Blob(chunks, { type: 'audio/mpeg' });
}

export async function verifyVoiceAccess(apiKey: string): Promise<boolean> {
  const storeState = useSettingsStore.getState();
  const activeKeyData = storeState.apiKeys.find(k => k.key === apiKey);
  
  if (activeKeyData?.provider === 'cartesia' || activeKeyData?.provider === 'google') {
    return true; // Skipping verification for now
  }

  const voiceId = activeKeyData?.voiceId || 'q109vaFit7lX6QNjx3cW';

  const response = await fetch("/api/elevenlabs/check-voice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      voiceId,
    }),
  });

  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    throw new ElevenLabsError(`Voice Verification Error: ${response.statusText} - ${errText}`, response.status);
  }

  const data = await safeJson(response);
  return !!data.hasVoice;
}

export async function cloneVoice(apiKey: string, name: string, description: string, files: File[]): Promise<string> {
  const storeState = useSettingsStore.getState();
  const activeKeyData = storeState.apiKeys.find(k => k.key === apiKey);
  if (activeKeyData?.provider && activeKeyData.provider !== 'elevenlabs') {
     throw new Error(`Voice cloning is not currently supported for ${activeKeyData.provider}`);
  }

  const formData = new FormData();
  formData.append('apiKey', apiKey);
  formData.append('name', name);
  if (description) {
    formData.append('description', description);
  }
  
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch("/api/elevenlabs/voices/add", {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errText = await parseElevenLabsError(response);
    throw new ElevenLabsError(`Voice Cloning Error: ${response.statusText} - ${errText}`, response.status);
  }

  const data = await safeJson(response);
  return data.voice_id;
}
