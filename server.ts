import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = getFirestore();
const auth = getAuth();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Seed Admin if not exists
  const adminEmail = 'a98012247@gmail.com';
  try {
    const adminSnap = await db.collection('members').where('email', '==', adminEmail).limit(1).get();
    if (adminSnap.empty) {
      console.log("Seeding admin member...");
      // Note: We don't create the auth user here as we don't have a password.
      // The admin must be created manually or log in with Google once if it was supported,
      // but since we removed Google login, the admin user must exist in Firebase Auth.
      // For this specific case, I'll assume the admin is already created or will be.
    }
  } catch (e) {
    console.error("Seed error:", e);
  }

  // Use raw express.json for body parsing limits
  app.use(express.json({ limit: "50mb" }));

  // Auth Middleware
  const authMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const deviceId = req.headers['x-device-id'];

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing Token' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      // Check member status and device binding
      const memberDoc = await db.collection('members').doc(uid).get();
      
      if (!memberDoc.exists) {
        // If it's the specific admin email, auto-create the document
        if (email === adminEmail) {
          await db.collection('members').doc(uid).set({
            email,
            status: 'active',
            role: 'admin',
            createdAt: FieldValue.serverTimestamp(),
            deviceId: null
          });
          req.user = { uid, email, role: 'admin' };
          return next();
        }
        return res.status(403).json({ error: 'Forbidden: Not a Pro member' });
      }

      const member = memberDoc.data();
      if (member?.status !== 'active') {
        return res.status(403).json({ error: `Account ${member?.status}` });
      }

      // Device binding logic
      if (!member?.deviceId) {
        // First login - bind device
        if (deviceId) {
          await db.collection('members').doc(uid).update({ deviceId });
        }
      } else if (member.deviceId !== deviceId) {
        return res.status(403).json({ error: 'Unauthorized device' });
      }

      req.user = { uid, email, role: member?.role };
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ error: 'Invalid Token' });
    }
  };

  // Usage Tracker Middleware
  const usageMiddleware = async (req: any, res: any, next: any) => {
    const tool = req.path.split('/').pop();
    if (req.user) {
      await db.collection('usage').add({
        userId: req.user.uid,
        email: req.user.email,
        tool,
        timestamp: FieldValue.serverTimestamp()
      });
    }
    next();
  };

  // Admin Routes
  app.post("/api/admin/create-member", authMiddleware, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    
    const { email, password, role } = req.body;
    try {
      const userRecord = await auth.createUser({
        email,
        password,
      });

      await db.collection('members').doc(userRecord.uid).set({
        email,
        status: 'active',
        role: role || 'pro',
        createdAt: FieldValue.serverTimestamp(),
        deviceId: null
      });

      res.json({ success: true, uid: userRecord.uid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Protected AI endpoints
  app.post("/api/elevenlabs", authMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
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

  app.post("/api/elevenlabs/voices/add", authMiddleware, usageMiddleware, upload.array('files'), async (req: express.Request, res: express.Response) => {
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
  app.post("/api/cartesia", authMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
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
  app.post("/api/google", authMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
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
