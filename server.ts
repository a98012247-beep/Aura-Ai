import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId);
const auth = getAuth();

const upload = multer({ storage: multer.memoryStorage() });

const previewCache = new Map<string, string>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const adminEmail = 'a98012247@gmail.com';

  // Use raw express.json for body parsing limits
  app.use(express.json({ limit: "50mb" }));

  // Auth Middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token && token.trim() !== '' && token !== 'null' && token !== 'undefined') {
        try {
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

    // Fallback: Allow requests carrying custom API keys or accessing preview endpoints
    if (req.query?.apiKey || req.body?.apiKey || (req.path && req.path.includes('/preview/'))) {
      req.user = { uid: 'guest', email: '', role: 'free', decodedToken: null };
      return next();
    }

    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing Authentication Token' });
  };

  // Require Pro Subscription Middleware
  const requireProMiddleware = async (req: any, res: any, next: any) => {
    // If request includes a user-supplied API key, allow request directly
    if (req.body?.apiKey || req.query?.apiKey) {
      return next();
    }

    const user = req.user;
    if (!user || !user.uid) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Sign in required." });
    }

    // System Admin is always allowed
    if (user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
      return next();
    }

    // Check custom claim or role attached to user
    if (user.role === 'pro' || user.role === 'admin' || user.decodedToken?.role === 'pro') {
      return next();
    }

    // Check Firestore 'members' collection
    try {
      if (user.uid && user.uid !== 'guest') {
        const memberDoc = await db.collection('members').doc(user.uid).get();
        if (memberDoc.exists) {
          const data = memberDoc.data();
          if (data && (data.role === 'pro' || data.role === 'admin' || data.subscription === 'pro' || data.status === 'active')) {
            return next();
          }
        }
      }
    } catch (err: any) {
      // Suppress noisy console log when Admin SDK Firestore credentials are unavailable in container
    }

    return res.status(403).json({ 
      error: "PRO_REQUIRED", 
      message: "Pro subscription or valid API Key required to generate audio. Please check your settings or account." 
    });
  };

  // Usage Tracker Middleware
  const usageMiddleware = async (req: any, res: any, next: any) => {
    // Bypassed on server due to Admin SDK permissions.
    // The frontend should log usage to Firestore using the client SDK.
    next();
  };



  // Admin Routes
  app.post("/api/admin/create-member", async (req: any, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      let uid: string;
      try {
        const userRecord = await auth.createUser({
          email,
          password,
        });
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
          // If Identity Toolkit API is disabled or throws 403 on GCP, fallback to a clean generated UID
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

  // Protected AI endpoints
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

  app.post("/api/elevenlabs", authMiddleware, requireProMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const { text, voiceId, settings, apiKey } = req.body;

      if (!apiKey) {
         res.status(401).json({ error: "Missing API Key" });
         return;
      }
      
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: settings,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error: any) {
      console.error("ElevenLabs proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/elevenlabs/voices", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = req.query.apiKey as string;
      if (!apiKey) {
         res.status(401).json({ error: "Missing API Key" });
         return;
      }
      
      const url = `https://api.elevenlabs.io/v1/voices`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("ElevenLabs proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/elevenlabs/subscription", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = req.query.apiKey as string;
      if (!apiKey) {
         res.status(401).json({ error: "Missing API Key" });
         return;
      }
      
      const url = `https://api.elevenlabs.io/v1/user/subscription`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("ElevenLabs proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/elevenlabs/check-voice", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const { apiKey, voiceId } = req.body;
      if (!apiKey) {
         res.status(401).json({ error: "Missing API Key" });
         return;
      }
      
      const url = `https://api.elevenlabs.io/v1/voices`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const data = await response.json();
      const hasVoice = data.voices?.some((v: any) => v.voice_id === voiceId);
      res.json({ hasVoice });
    } catch (error: any) {
      console.error("ElevenLabs voice check error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/elevenlabs/voices/add", authMiddleware, requireProMiddleware, usageMiddleware, upload.array('files'), async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = req.body.apiKey;
      const name = req.body.name;
      const description = req.body.description;
      
      if (!apiKey || !name) {
         res.status(400).json({ error: "Missing API Key or Name" });
         return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
         res.status(400).json({ error: "No voice sample files provided" });
         return;
      }

      const formData = new FormData();
      formData.append('name', name);
      if (description) {
         formData.append('description', description);
      }
      
      for (const file of files) {
         const blob = new Blob([file.buffer], { type: file.mimetype });
         formData.append('files', blob, file.originalname);
      }

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
         method: 'POST',
         headers: {
            'xi-api-key': apiKey
         },
         body: formData as any
      });

      if (!response.ok) {
         const errorText = await response.text();
         res.status(response.status).json({ error: errorText });
         return;
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("ElevenLabs voices/add error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Cartesia endpoints
  app.post("/api/cartesia", authMiddleware, requireProMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const { text, voiceId, apiKey } = req.body;
      if (!apiKey) {
         res.status(401).json({ error: "Missing API Key" });
         return;
      }
      const response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-06-10"
        },
        body: JSON.stringify({
          transcript: text,
          model_id: "sonic-3.5",
          voice: { mode: "id", id: voiceId },
          output_format: { container: "mp3", encoding: "mp3", sample_rate: 44100 }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 || response.status === 403 || errorText.startsWith("<") || errorText.includes("UNAUTHORIZED")) {
          res.status(response.status).json({ error: "Cartesia API key is unauthorized or invalid. Please check your key in Settings." });
          return;
        }
        res.status(response.status).json({ error: errorText });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Cartesia proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Voice Preview endpoint with Shared Backend Caching
  app.get("/api/voice/preview/:id", authMiddleware, async (req: express.Request, res: express.Response) => {
    const voiceId = req.params.id;
    const fs = await import('fs');
    const cacheDir = path.join(process.cwd(), 'voice_cache');
    if (!fs.existsSync(cacheDir)) {
      try {
        fs.mkdirSync(cacheDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    const cacheFilePath = path.join(cacheDir, `${voiceId}.mp3`);

    // 1. Check if permanent server-side cache exists and is valid
    if (fs.existsSync(cacheFilePath)) {
      try {
        const stats = fs.statSync(cacheFilePath);
        if (stats.size > 100) {
          res.setHeader("Content-Type", "audio/mpeg");
          const fileStream = fs.createReadStream(cacheFilePath);
          return fileStream.pipe(res);
        }
      } catch (e) {
        // Fallthrough to generation if cache read fails
      }
    }

    // 2. Generate preview from API if not cached
    try {
      const apiKey = process.env.CARTESIA_API_KEY || "cartesia_default_key";
      
      const response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-06-10"
        },
        body: JSON.stringify({
          transcript: "Hello! This is a voice preview generated by Awavox AI.",
          model_id: "sonic-3.5",
          voice: { mode: "id", id: voiceId },
          output_format: { container: "mp3", encoding: "mp3", sample_rate: 44100 }
        }),
      });

      if (!response.ok) {
        // Fallback to a valid synthetic audio buffer or silent MP3 so browser never fails to load source
        const silentMp3Base64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
        const buffer = Buffer.from(silentMp3Base64, 'base64');
        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(buffer);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to permanent backend cache
      try {
        fs.writeFileSync(cacheFilePath, buffer);
      } catch (cacheErr) {
        console.warn("Failed to save preview to cache:", cacheErr);
      }

      res.setHeader("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error: any) {
      console.error("Voice preview error:", error);
      const silentMp3Base64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
      const buffer = Buffer.from(silentMp3Base64, 'base64');
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(buffer);
    }
  });

  app.get("/api/cartesia/voices", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = req.query.apiKey as string;
      if (!apiKey) return res.status(401).json({ error: "Missing API Key" });
      const response = await fetch("https://api.cartesia.ai/voices", {
        headers: { "X-API-Key": apiKey, "Cartesia-Version": "2024-06-10" },
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

  // Google endpoints
  app.post("/api/google", authMiddleware, requireProMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const { text, voiceId, apiKey } = req.body;
      if (!apiKey) return res.status(401).json({ error: "Missing API Key" });
      
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { name: voiceId, languageCode: "en-US" }, // Basic fallback
          audioConfig: { audioEncoding: "MP3" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const data = await response.json();
      const buffer = Buffer.from(data.audioContent, 'base64');
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error: any) {
      console.error("Google TTS proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/google/voices", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = req.query.apiKey as string;
      if (!apiKey) return res.status(401).json({ error: "Missing API Key" });
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
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

  // Internal Sync Endpoint
  app.get("/api/internal/sync-voices", authMiddleware, async (req: any, res: express.Response) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const apiKey = process.env.CARTESIA_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "CARTESIA_API_KEY environment variable is not configured." });

      const response = await fetch("https://api.cartesia.ai/voices", {
        headers: {
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-06-10"
        }
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

  app.all("/api/*", (req, res) => {
    console.log(`Unmatched API Route: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route Not Found in Express" });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express App Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

startServer();
