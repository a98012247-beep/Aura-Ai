import 'dotenv/config';
import fs from "fs";
import crypto from "crypto";
import express from "express";
import path from "path";
import multer from "multer";
import { onRequest } from "firebase-functions/v2/https";
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import firebaseConfig from "./firebase-applet-config.json";

let db: FirebaseFirestore.Firestore | null = null;
let auth: any = null;

try {
  // Initialize Firebase Admin
  if (getApps().length === 0) {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
  
  if (getApps().length > 0) {
    db = getFirestore(firebaseConfig.firestoreDatabaseId);
    auth = getAuth();
  }
} catch (e) {
  console.warn("Firebase Admin could not be fully initialized.", e);
}

const upload = multer({ storage: multer.memoryStorage() });

// In-memory cache: hash → audio Buffer
const generationCache = new Map<string, Buffer>();

// In-memory cache for preview audio (keyed by voiceId+text hash)
const previewCache = new Map<string, Buffer>();

const adminEmail = 'a98012247@gmail.com';

interface StoredApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  usageCount: number;
  totalCharactersUsed: number;
  createdAt: string;
  lastTestedStatus?: 'valid' | 'invalid' | 'untested';
  lastTestedMessage?: string;
}

const KEYS_FILE_PATH = "";

function loadStoredKeys(): StoredApiKey[] { return [];
  try {
    if (fs.existsSync(KEYS_FILE_PATH)) {
      const data = fs.readFileSync(KEYS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not read platform_api_keys.json:", e);
  }
  return [];
}

function saveStoredKeys(keys: StoredApiKey[]): void { return;
  try {
    const dir = path.dirname(KEYS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(KEYS_FILE_PATH, JSON.stringify(keys, null, 2), 'utf-8');
  } catch (e) {
    console.error("Could not write platform_api_keys.json:", e);
  }
}

async function incrementApiKeyUsage(keyId: string, characters: number): Promise<void> {
  // Update local file
  const keys = loadStoredKeys();
  let updatedLocal = false;
  for (const k of keys) {
    if (k.id === keyId) {
      k.usageCount = (k.usageCount || 0) + 1;
      k.totalCharactersUsed = (k.totalCharactersUsed || 0) + characters;
      updatedLocal = true;
      break;
    }
  }
  if (updatedLocal) {
    saveStoredKeys(keys);
  }

  // Update Firestore if available
  if (db && keyId !== 'env_key') {
    try {
      const keyRef = db.collection('platform_api_keys').doc(keyId);
      const docSnap = await keyRef.get();
      if (docSnap.exists) {
        const currentData = docSnap.data();
        await keyRef.update({
          usageCount: (currentData?.usageCount || 0) + 1,
          totalCharactersUsed: (currentData?.totalCharactersUsed || 0) + characters
        });
      }
    } catch (e) {
      console.warn(`Failed to increment Firestore usage for key ${keyId}:`, e);
    }
  }
}

/**
 * Fetch all active Cartesia API keys from server persistent file, memory, 
 * Firestore (if accessible), and server environment variables.
 */
async function getAllAvailableApiKeys(): Promise<Array<{ key: string; id: string; name?: string }>> {
  const keys: Array<{ key: string; id: string; name?: string }> = [];

  // 1. Fetch from server stored keys (file + memory)
  const storedKeys = loadStoredKeys();
  for (const k of storedKeys) {
    const rawKey = (k.key || '').trim();
    if (rawKey && k.isActive !== false) {
      if (!keys.some(item => item.key === rawKey)) {
        keys.push({ key: rawKey, id: k.id, name: k.name || 'Admin Key' });
      }
    }
  }

  // 2. Fetch keys from Firestore collection platform_api_keys if accessible
  try {
    if (db) {
      const snapshot = await db.collection('platform_api_keys').get();

      snapshot.forEach(doc => {
        const data = doc.data();
        const rawKey = (data.key || '').trim();
        // Include if active (default to true if not explicitly false)
        if (rawKey && data.isActive !== false) {
          if (!keys.some(item => item.key === rawKey)) {
            keys.push({ key: rawKey, id: doc.id, name: data.name || 'Admin Key' });
          }
        }
      });
    }
  } catch (err: any) {
    // Expected in environments without service-account credentials
  }

  // 3. Add server environment variable if present
  if (process.env.CARTESIA_API_KEY && process.env.CARTESIA_API_KEY.trim()) {
    const envKey = process.env.CARTESIA_API_KEY.trim();
    const isDummy = envKey.includes("MY_CARTESIA_API_KEY") || envKey.includes("YOUR_");
    if (!isDummy && !keys.some(k => k.key === envKey)) {
      keys.push({ key: envKey, id: 'env_key', name: 'Environment Key' });
    }
  }

  return keys;
}

/**
 * Fetch all voices from Cartesia API, handling pagination.
 */
async function fetchAllCartesiaVoices(apiKey: string): Promise<any[]> {
  let allVoices: any[] = [];
  let hasMore = true;
  let cursor = "";

  while (hasMore) {
    const url = cursor ? `https://api.cartesia.ai/voices?limit=100&starting_after=${cursor}` : `https://api.cartesia.ai/voices?limit=100`;
    const response = await fetch(url, {
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2024-11-13"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsed = errText;
      try {
        const j = JSON.parse(errText);
        parsed = j.message || j.error || errText;
      } catch {}
      throw new Error(parsed);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
       allVoices = allVoices.concat(data);
       hasMore = false;
    } else if (data && Array.isArray(data.data)) {
       allVoices = allVoices.concat(data.data);
       hasMore = data.has_more === true;
       cursor = data.next_page || "";
    } else if (data && Array.isArray(data.voices)) {
       allVoices = allVoices.concat(data.voices);
       hasMore = false;
    } else {
       hasMore = false;
    }
  }

  return allVoices;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

  // Auth Middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
        try {
          if (!auth) {
            console.warn("Auth Middleware: Firebase Auth is not initialized. Falling back to guest.");
            throw new Error("Firebase Auth not initialized");
          }
          const decodedToken = await auth.verifyIdToken(token);
          const uid = decodedToken.uid;
          const email = decodedToken.email || '';
          const customRole = decodedToken.role;

          const isAdmin = email ? (email.toLowerCase() === adminEmail.toLowerCase()) : false;
          const role = isAdmin ? 'admin' : (customRole || 'free');

          req.user = { uid, email, role, decodedToken };
          return next();
        } catch (error) {
          try {
            // Fallback decode standard Firebase JWT (header.payload.signature)
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
              const uid = payload.user_id || payload.sub || 'user';
              const email = payload.email || '';
              const isAdmin = email ? (email.toLowerCase() === adminEmail.toLowerCase()) : false;
              const role = isAdmin ? 'admin' : (payload.role || 'free');
              req.user = { uid, email, role, decodedToken: payload };
              return next();
            }
          } catch (jwtErr) {}
        }
      }
    }

    // Allow unauthenticated requests to pass through as guests
    // The generate route will enforce preview-only for guests
    req.user = { uid: 'guest', email: '', role: 'guest', decodedToken: null };
    return next();
  };

  // Usage Tracker (frontend logs usage via Firestore client SDK)
  const usageMiddleware = async (req: any, res: any, next: any) => {
    next();
  };

  // ─── Admin Routes ──────────────────────────────────────────────────────────

  app.post("/api/admin/create-member", async (req: any, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      let uid: string;
      try {
        const userRecord = await auth.createUser({ email, password });
        uid = userRecord.uid;
      } catch (err: any) {
        if (err.code === 'auth/email-already-exists') {
          try {
            const existingUser = await auth.getUserByEmail(email);
            uid = existingUser.uid;
          } catch (e) {
            uid = "user_" + Buffer.from(email).toString('hex').slice(0, 16);
          }
        } else {
          console.warn("Firebase Admin Auth API unavailable, generating fallback member UID for:", email);
          uid = "user_" + Buffer.from(email).toString('hex').slice(0, 16);
        }
      }
      res.json({ success: true, uid });
    } catch (error: any) {
      console.warn("create-member fallback triggered:", error.message || error);
      const fallbackUid = "user_" + Buffer.from(email).toString('hex').slice(0, 16);
      res.json({ success: true, uid: fallbackUid });
    }
  });

  app.post("/api/admin/update-member-role", authMiddleware, async (req: any, res: any) => {
    if (req.user?.role !== 'admin' && req.user?.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { targetUid, role, name, phone, email } = req.body;
    if (!targetUid) return res.status(400).json({ error: "Missing targetUid" });

    try {
      if (role) {
        try {
          await auth.setCustomUserClaims(targetUid, { role });
        } catch (cErr) {
          console.warn("Could not set custom user claims:", cErr);
        }
      }

      const updates: any = {};
      if (role) updates.role = role;
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (email !== undefined) updates.email = email;

      try {
        await db.collection('members').doc(targetUid).set(updates, { merge: true });
      } catch (fErr) {
        console.warn("Could not update Firestore via admin SDK:", fErr);
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Error updating member role:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Cartesia TTS Route ────────────────────────────────────────────────────

  app.post("/api/cartesia/generate", authMiddleware, usageMiddleware, async (req: any, res: express.Response) => {
    try {
      const { text, voiceId, type, language } = req.body;

      if (!text || !voiceId) {
        res.status(400).json({ error: "Missing text or voiceId" });
        return;
      }

      const requestType: 'preview' | 'generation' = (type === 'preview') ? 'preview' : 'generation';
      const user = req.user;

      // ── Determine context (public, free, paid) ───────────────────────────
      let context: 'public' | 'free' | 'paid' = 'public';

      if (requestType !== 'preview') {
        if (!user || user.uid === 'guest') {
          res.status(401).json({ error: "UNAUTHORIZED", message: "Sign in required to generate audio." });
          return;
        }

        // Determine user tier
        let isPro = user.role === 'pro' || user.role === 'admin';
        if (!isPro && user.uid && user.uid !== 'guest') {
          try {
            if (db) {
              const memberDoc = await db.collection('members').doc(user.uid).get();
              if (memberDoc.exists) {
                const data = memberDoc.data();
                isPro = !!(data && (data.role === 'pro' || data.role === 'admin' || data.subscription === 'pro' || data.status === 'active'));
              }
            }
          } catch (_) { /* Firestore unavailable, default to free */ }
        }
        
        context = isPro ? 'paid' : 'free';
      }

      // ── Get all active API keys from the unified pool (Admin configured / env) ─────────
      const apiKeys = await getAllAvailableApiKeys();
      
      if (!apiKeys || apiKeys.length === 0) {
        res.status(503).json({
          error: "SERVICE_UNAVAILABLE",
          message: "No active Cartesia API key is configured. Please add an API key in the Admin Panel (Admin → API Keys) or set CARTESIA_API_KEY."
        });
        return;
      }

      // ── Cache check ──────────────────────────────────────────────────────
      const cacheKey = crypto.createHash('sha256').update(text + voiceId).digest('hex');
      const cache = requestType === 'preview' ? previewCache : generationCache;

      if (cache.has(cacheKey)) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("X-Cache", "HIT");
        res.send(cache.get(cacheKey));
        return;
      }

      // ── Call Cartesia TTS with multi-key pool failover ────────────────────
      const candidateModels = ["sonic-3.6", "sonic-3.5", "sonic-3", "sonic"];
      let successfulBuffer: Buffer | null = null;
      let usedApiKeyId = apiKeys[0].id;
      let lastErrorText = "";
      let lastStatusCode = 500;

      for (const apiInfo of apiKeys) {
        const apiKey = apiInfo.key;
        usedApiKeyId = apiInfo.id;

        const cartesiaHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-11-13"
        };

        let keySucceeded = false;

        for (const modelId of candidateModels) {
          try {
            const resp = await fetch('https://api.cartesia.ai/tts/bytes', {
              method: "POST",
              headers: cartesiaHeaders,
              body: JSON.stringify({
                model_id: modelId,
                transcript: text,
                voice: { mode: "id", id: voiceId },
                output_format: { container: "mp3", encoding: "mp3", sample_rate: 44100, bit_rate: 128000 },
                ...(language && { language: language.toLowerCase().substring(0, 2) })
              }),
            });

            if (resp.ok) {
              const contentType = resp.headers.get("content-type") || "";
              if (!contentType.includes("application/json")) {
                const arrayBuffer = await resp.arrayBuffer();
                if (arrayBuffer && arrayBuffer.byteLength > 0) {
                  successfulBuffer = Buffer.from(arrayBuffer);
                  keySucceeded = true;
                  break;
                } else {
                  lastErrorText = "Empty audio buffer received from Cartesia";
                  lastStatusCode = 500;
                  continue;
                }
              }
            }

            const errBody = await resp.text();
            lastErrorText = errBody;
            lastStatusCode = resp.status === 200 ? 500 : resp.status;

            if (resp.status === 401 || resp.status === 403) {
              // Key invalid or unauthorized - try next key in pool
              break;
            }
          } catch (fetchErr: any) {
            console.warn(`[Cartesia] Key (${apiInfo.name || apiInfo.id}) notice:`, fetchErr.message);
          }
        }

        if (keySucceeded && successfulBuffer) {
          break;
        }
      }

      if (!successfulBuffer) {
        let parsedMessage = lastErrorText || "Cartesia audio synthesis failed";
        try {
          const jsonErr = JSON.parse(lastErrorText);
          parsedMessage = jsonErr.message || jsonErr.error || lastErrorText;
        } catch {}
        res.status(lastStatusCode).json({
          error: parsedMessage,
          message: parsedMessage,
          code: lastStatusCode === 401 ? "INVALID_API_KEY" : "API_ERROR"
        });
        return;
      }

      // Store in appropriate cache
      cache.set(cacheKey, successfulBuffer);

      // Increment API key specific usage counters
      incrementApiKeyUsage(usedApiKeyId, text.length).catch(e => console.warn(e));

      // Log usage asynchronously to Firestore
      if (db) {
        db.collection('usage').add({
          apiKeyId: usedApiKeyId,
          context,
          tool: 'tts',
          model: 'cartesia',
          email: user?.email || 'guest',
          characters: text.length,
          timestamp: new Date(),
        }).catch(err => console.warn("Failed to log API usage:", err));
      }

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Cache", "MISS");
      res.send(successfulBuffer);

    } catch (error: any) {
      console.error("Cartesia generate error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // ─── Cartesia Voices Route ─────────────────────────────────────────────────
  // Uses the public API pool. No frontend key required.

  app.get("/api/cartesia/voices", authMiddleware, async (req: any, res: express.Response) => {
    try {
      const apiKeys = await getAllAvailableApiKeys();
      if (!apiKeys || apiKeys.length === 0) {
        return res.status(503).json({ error: "No public API key configured. Please add one in Admin → API Keys or set CARTESIA_API_KEY." });
      }

      let voicesData: any = null;
      let lastError = "Failed to fetch voices";
      let lastStatus = 500;

      for (const apiInfo of apiKeys) {
        try {
          voicesData = await fetchAllCartesiaVoices(apiInfo.key);
          break;
        } catch (err: any) {
          lastError = err.message;
        }
      }

      if (voicesData) {
        return res.json(voicesData);
      }

      let parsedMessage = lastError;
      try {
        const jsonErr = JSON.parse(lastError);
        parsedMessage = jsonErr.message || jsonErr.error || lastError;
      } catch {}
      return res.status(lastStatus).json({ error: parsedMessage, message: parsedMessage });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // ─── Admin: API Key Management Endpoints ─────────────────────────────────

  const checkIsAdmin = (req: any) => {
    if (req.user?.role === 'admin') return true;
    if (req.user?.email && req.user.email.toLowerCase() === adminEmail.toLowerCase()) return true;
    return false;
  };
  app.post("/api/admin/validate-key", authMiddleware, async (req: any, res: express.Response) => {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { key } = req.body;
    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({ valid: false, error: 'API key is required' });
    }

    try {
      const trimmedKey = key.trim();
      const voiceList = await fetchAllCartesiaVoices(trimmedKey);
      return res.json({ valid: true, voiceCount: voiceList.length });
    } catch (err: any) {
      return res.json({ valid: false, error: err.message || 'Validation request failed' });
    }
  });

  // ─── Internal: Sync Voices to voices.json ─────────────────────────────────

  app.get("/api/internal/sync-voices", authMiddleware, async (req: any, res: express.Response) => {
    if (req.user?.role !== 'admin' && req.user?.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Admin only' });
    }
    try {
      const apiKeys = await getAllAvailableApiKeys();
      if (!apiKeys || apiKeys.length === 0) return res.status(500).json({ error: "No Cartesia API key configured." });
      
      let voicesData: any = null;
      let lastErr = "";

      for (const apiInfo of apiKeys) {
        try {
          voicesData = await fetchAllCartesiaVoices(apiInfo.key);
          break;
        } catch (e: any) {
          lastErr = e.message;
        }
      }

      if (!voicesData) {
        return res.status(500).json({ error: lastErr || "Failed to fetch voices" });
      }

      const rawList = Array.isArray(voicesData) ? voicesData : [];

      const mappedVoices = rawList.map((v: any) => ({
        id: v.id,
        name: v.name,
        description: v.description || "",
        language: v.language || "en",
        gender: v.gender || "neutral",
        country: v.country || "US",
        is_high_quality: true,
        is_public: true,
        accents_locales: Array.isArray(v.accents) ? v.accents.map((a: any) => a.locale || a.accent || a).join(', ') : (v.language_locales?.join(', ') || v.language || 'en'),
        age: v.age || "Middle-Aged"
      }));

      const fs = await import('fs');
      const dataPath = path.join(process.cwd(), 'src/data/voices.json');
      fs.writeFileSync(dataPath, JSON.stringify(mappedVoices, null, 2));

      res.json({ success: true, count: mappedVoices.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Catch-all ─────────────────────────────────────────────────────────────

  app.all("/api/*", (req, res) => {
    console.log(`Unmatched API Route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found" });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express App Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });

  // Export for Firebase Cloud Functions
  export const api = onRequest({ region: "us-central1" }, app);
