import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import circuitHashRoutes from "./circuitHashes.js";
import starknetRelayRoutes from "./starknetRelay.js";
import storachaDelegateRoutes from "./storachaDelegate.js";
import { getDb } from "./db/schema.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/circuit-hashes", circuitHashRoutes);
app.use("/api/starknet", starknetRelayRoutes);
app.use("/api/storacha", storachaDelegateRoutes);

// Initialize DB on startup
getDb();
console.log("[Zkly] Database initialized");

// Start server
app.listen(PORT, () => {
  console.log(`

             Zkly Backend Server           
                                           
  ---- http://localhost:${PORT}               
  --- Circuits: /api/circuit-hashes/*        
  -- Relay:    /api/starknet/*              
  -- Storacha: /api/storacha/*             
  -- Health:   /health                     

  `);
});

export default app;
