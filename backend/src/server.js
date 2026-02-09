import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import config from "./config/env.js";
import { setIO } from "./config/socket.js";
import { verifyToken } from "./services/authService.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true
  }
});

io.use((socket, next) => {
  try {
    const { token } = socket.handshake.auth;
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    const payload = verifyToken(token);
    socket.data.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const { id, role } = socket.data.user;
  socket.join(`role:${role}`);
  socket.join(`user:${id}`);

  socket.on("disconnect", () => {
    // room cleanup handled automatically by Socket.IO
  });
});

setIO(io);

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${config.port}`);
});
