import * as socket from "socket.io";
import express, { Response } from "express";
import http from "http";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { Kafka, KafkaConfig, Producer, Consumer, EachMessagePayload } from "kafkajs";

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

const kafkaConfig: KafkaConfig = { brokers: [`localhost:9093`] };
const kafka = new Kafka(kafkaConfig);

const producer: Producer = kafka.producer();
const consumer: Consumer = kafka.consumer({ groupId: `test-group` });

// Set up Kafka
async function connectKafka(io: socket.Server) {
  console.log(`Connect to Kafka and subscribe to topics ...`);
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: `topic-chat`, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      const chatMessageText = message.value?.toString();
      const chatMessage = JSON.parse(chatMessageText || `{}`);
      console.log(`Consumed message from Kafka: `, chatMessage);
      io.sockets.emit(`chat-message`, chatMessage);
    },
  });
}

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

    // 2. Publish message to Kafka
    await producer.send({
      topic: `topic-chat`,
      messages: [{ value: JSON.stringify(message) }],
    });
  });
});

server.listen(4000, async () => {
  console.log(`Server running on http://localhost:4000`);
  await connectKafka(io);
});
