import 'dotenv/config';
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

/**
 * Env var fallbacks for local development (when Firestore ADC credentials are not configured).
 * Set these in a .env file or system environment:
/**
 * Fetch an active Cartesia API key from the pool.
 */
async function getAvailableApiKey(): Promise<{ key: string; id: string } | null> {
  try {
    if (!db) throw new Error("Firestore not initialized");
    
    const snapshot = await db.collection('platform_api_keys')
      .where('isActive', '==', true)
      .limit(5)
      .get();

    if (!snapshot.empty) {
      const docs = snapshot.docs;
      const chosen = docs[Math.floor(Math.random() * docs.length)];
      const key = chosen.data().key as string;
      if (key) return { key, id: chosen.id };
    }
  } catch (err: any) {
    console.warn(`[getAvailableApiKey] Firestore unavailable. Reason: ${err.message?.substring(0, 80)}`);
  }

  console.error(`[getAvailableApiKey] No active API key found in the pool.`);
  return null;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

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
          console.warn('Auth Middleware Token Verification Warning:', error);
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
      const { text, voiceId, type } = req.body;

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

      // ── Get API Key from the unified pool ────────────────────────────────
      const apiInfo = await getAvailableApiKey();
      
      if (!apiInfo) {
        res.status(503).json({
          error: "SERVICE_UNAVAILABLE",
          message: "No active API keys are configured for this request. Please contact the administrator."
        });
        return;
      }
      
      const apiKey = apiInfo.key;
      const apiKeyId = apiInfo.id;

      // ── Cache check ──────────────────────────────────────────────────────
      const cacheKey = crypto.createHash('sha256').update(text + voiceId).digest('hex');
      const cache = requestType === 'preview' ? previewCache : generationCache;

      if (cache.has(cacheKey)) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("X-Cache", "HIT");
        res.send(cache.get(cacheKey));
        return;
      }

      // ── Call Cartesia TTS ────────────────────────────────────────────────
      const cartesiaResponse = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Cartesia-Version": "2026-08-14"
        },
        body: JSON.stringify({
          model_id: "sonic",
          transcript: text,
          voice: { mode: "id", id: voiceId },
          output_format: { container: "mp3", encoding: "mp3", sample_rate: 44100, bit_rate: 128000 }
        }),
      });

      if (!cartesiaResponse.ok) {
        const errorText = await cartesiaResponse.text();
        console.error(`Cartesia API error [${cartesiaResponse.status}]:`, errorText);
        res.status(cartesiaResponse.status).json({ error: errorText });
        return;
      }

      const contentType = cartesiaResponse.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const errorJson = await cartesiaResponse.text();
        console.error(`Cartesia returned JSON instead of audio:`, errorJson);
        res.status(400).json({ error: errorJson });
        return;
      }

      const arrayBuffer = await cartesiaResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Store in appropriate cache
      cache.set(cacheKey, buffer);

      // Log usage asynchronously to Firestore
      if (db) {
        db.collection('usage').add({
          apiKeyId,
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
      res.send(buffer);

    } catch (error: any) {
      console.error("Cartesia generate error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // ─── Cartesia Voices Route ─────────────────────────────────────────────────
  // Uses the public API pool. No frontend key required.

  app.get("/api/cartesia/voices", authMiddleware, async (req: any, res: express.Response) => {
    try {
      const apiInfo = await getAvailableApiKey();
      if (!apiInfo) {
        return res.status(503).json({ error: "No public API key configured. Please add one in Admin → API Keys." });
      }
      const apiKey = apiInfo.key;

      const response = await fetch("https://api.cartesia.ai/voices", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Cartesia-Version": "2026-08-14"
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: errorText });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // ─── Internal: Sync Voices to voices.json ─────────────────────────────────

  app.get("/api/internal/sync-voices", authMiddleware, async (req: any, res: express.Response) => {
    if (req.user?.role !== 'admin' && req.user?.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Admin only' });
    }
    try {
      const apiInfo = await getAvailableApiKey();
      if (!apiInfo) return res.status(500).json({ error: "No Cartesia API key configured in Admin Panel." });
      
      const apiKey = apiInfo.key;

      const response = await fetch("https://api.cartesia.ai/voices", {
        headers: { "Authorization": `Bearer ${apiKey}`, "Cartesia-Version": "2026-08-14" }
      });

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: err });
      }

      const voices = await response.json();
      const mappedVoices = voices.map((v: any) => ({
        id: v.id,
        name: v.name,
        description: v.description || "",
        language: v.language || "en",
        gender: v.gender || "neutral",
        country: v.country || "US",
        is_high_quality: true,
        is_public: true,
        accents_locales: v.language_locales?.join(', ') || v.language,
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

  // Local Development Mode
  if (process.env.NODE_ENV !== "production") {
    // Top-level await is not natively supported here without moving to an async IIFE
    (async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })();
  } else {
    // Production Mode (Static Hosting fallback, though Firebase Hosting will handle static files)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Export for Firebase Cloud Functions
  export const api = onRequest({ region: "us-central1" }, app);
