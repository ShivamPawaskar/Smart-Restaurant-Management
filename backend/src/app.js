import cors from "cors";
import express from "express";
import helmet from "helmet";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/debug", debugRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
