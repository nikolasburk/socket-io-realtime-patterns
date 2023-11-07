import * as socket from "socket.io";
import { Socket } from "socket.io";
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

// Set up polling
const pollingInterval = 1000;
console.log(`Start polling every second ...`);
setInterval(async () => {
  const oneSecondAgo = new Date(Date.now() - pollingInterval);
  const newMessages = await prisma.message.findMany({
    where: {
      createdAt: { gte: oneSecondAgo },
    },
  });
  console.log(`Found new messages: ${newMessages.length}`);
  if (newMessages.length > 0) {
    newMessages.forEach((message) => {
      io.sockets.emit(`chat-message`, message);
    });
  }
}, pollingInterval);

io.on(`connection`, async (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on(`disconnect`, () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on(`chat-message`, async (text) => {
    console.log(`Received message: ${text} (${socket.id})`);

    // Write message into database
    await prisma.message.create({
      data: {
        text,
        senderSocketId: socket.id,
      },
    });
  });
});

server.listen(4000, () => {
  console.log(`Server running on http://localhost:4000`);
});
