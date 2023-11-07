import * as socket from "socket.io";
import express from "express";
import http from "http";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new socket.Server(server, {
  cors: { origin: true },
});

io.on(`connection`, async (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on(`disconnect`, () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on(`chat-message`, (text) => {
    console.log(`Received message: ${text} (${socket.id})`);
    io.sockets.emit(`chat-message`, text);
  });
});

server.listen(4000, () => {
  console.log(`Server running on http://localhost:4000`);
});
