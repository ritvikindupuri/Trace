import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'system', 
      message: 'Connected to Trace Telemetry Stream',
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => console.log('[WS] Client disconnected'));
  });

  // Broadcast helper
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    });
  });

  // Telemetry Ingestion Pipeline
  app.post("/api/v1/telemetry/ingest", (req, res) => {
    const { events, source_metadata } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Invalid payload: 'events' array required" });
    }

    console.log(`[INGEST] Received ${events.length} events from ${source_metadata?.hostname || 'unknown'}`);
    
    // Broadcast to all connected WebSocket clients
    broadcast({ 
      type: 'telemetry', 
      events,
      source: source_metadata?.hostname || 'remote-sensor'
    });

    res.status(202).json({ 
      status: "accepted", 
      ingestion_id: Math.random().toString(36).substr(2, 9),
      received_count: events.length 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
