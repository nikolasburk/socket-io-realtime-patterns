import * as socket from "socket.io";
import express, { Response } from "express";
import http from "http";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(cors());

app.get(`/messages`, async (_, res: Response) => {
  const messages = await prisma.message.findMany();
  res.json(messages);
});

const server = http.createServer(app);

const io = new socket.Server(server, {
  cors: { origin: true },
});

io.on(`connection`, async (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on(`disconnect`, () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on(`chat-message`, async (text) => {
    console.log(`Received message: ${text} (${socket.id})`);

    // 1. Write message into database
    const message = await prisma.message.create({
      data: {
        text,
        senderSocketId: socket.id,
      },
    });

    // 2. Broadcast message to all subscribed clients
    io.sockets.emit(`chat-message`, message);
  });
});

server.listen(4000, () => {
  console.log(`Server running on http://localhost:4000`);
});
