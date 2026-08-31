const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf-8');

const getKeyFuncStr = `
// API Key Rotation Engine
async function getAvailableCartesiaKey(category, textLength = 0) {
  const keysRef = db.collection('platform_api_keys');
  const snapshot = await keysRef
    .where('provider', '==', 'cartesia')
    .where('isActive', '==', true)
    .where('category', '==', category)
    .get();

  if (snapshot.empty) return null;

  const keys = [];
  snapshot.forEach(doc => keys.push({ id: doc.id, ...doc.data() }));

  if (textLength > 20000) {
    keys.sort((a, b) => (a.totalCharactersUsed || 0) - (b.totalCharactersUsed || 0));
  } else {
    keys.sort((a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0));
  }

  return keys[0];
}

async function markKeyExhausted(keyId) {
  await db.collection('platform_api_keys').doc(keyId).update({ isActive: false });
}

async function updateKeyUsage(keyId, chars) {
  await db.collection('platform_api_keys').doc(keyId).update({
    usageCount: FieldValue.increment(1),
    totalCharactersUsed: FieldValue.increment(chars),
    lastUsedAt: Date.now()
  });
}
`;

code = code.replace('const app = express();', getKeyFuncStr + '\n  const app = express();');

const cartesiaOldBlock = `  app.post("/api/cartesia", authMiddleware, requireProMiddleware, usageMiddleware, async (req: express.Request, res: express.Response) => {
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
  });`;

const cartesiaNewBlock = `  app.post("/api/cartesia", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const { text, voiceId } = req.body;
      const isPublic = req.query.public === 'true';
      const userObj = (req as any).user;
      const category = isPublic ? 'public' : (userObj?.role || 'free');

      let retries = 2;
      let lastError = null;

      while (retries > 0) {
        const keyData = await getAvailableCartesiaKey(category, text.length);
        if (!keyData) {
           res.status(503).json({ error: "No available Cartesia API keys in category: " + category });
           return;
        }

        const response = await fetch("https://api.cartesia.ai/tts/bytes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": keyData.key,
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
          if (response.status === 401 || response.status === 403 || response.status === 429) {
            await markKeyExhausted(keyData.id);
            retries--;
            lastError = errorText;
            continue;
          }
          res.status(response.status).json({ error: errorText });
          return;
        }

        await updateKeyUsage(keyData.id, text.length);
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", "audio/mpeg");
        res.send(Buffer.from(arrayBuffer));
        return;
      }
      res.status(502).json({ error: "All available API keys failed. Last error: " + lastError });
    } catch (error: any) {
      console.error("Cartesia proxy error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });`;

code = code.replace(cartesiaOldBlock, cartesiaNewBlock);

const voicesOldBlock = `  app.get("/api/cartesia/voices", authMiddleware, async (req: express.Request, res: express.Response) => {
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
  });`;

const voicesNewBlock = `  app.get("/api/cartesia/voices", authMiddleware, async (req: express.Request, res: express.Response) => {
    try {
      const isPublic = req.query.public === 'true';
      const userObj = (req as any).user;
      const category = isPublic ? 'public' : (userObj?.role || 'free');
      const keyData = await getAvailableCartesiaKey(category);
      if (!keyData) {
         res.status(503).json({ error: "No available API keys for category: " + category });
         return;
      }
      const response = await fetch("https://api.cartesia.ai/voices", {
        headers: { "X-API-Key": keyData.key, "Cartesia-Version": "2024-06-10" },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 429) await markKeyExhausted(keyData.id);
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });`;

code = code.replace(voicesOldBlock, voicesNewBlock);

fs.writeFileSync('server.ts', code);
