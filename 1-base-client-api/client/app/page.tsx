"use client";

import { useState, useEffect, useRef, MutableRefObject } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  text: string;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);

  let socketRef: MutableRefObject<Socket | null> = useRef(null);

  const newMessageReceived = text => {
    console.log(`Received message: `, text);
    setMessageHistory((oldMessageHistory) => [...oldMessageHistory, { text }]);
  };

  useEffect(() => {
    const url = `http://localhost:4000`;
    socketRef.current = io(url);
    socketRef.current.on(`chat-message`, newMessageReceived);

    return () => {
      socketRef.current?.off(`chat-message`, newMessageReceived);
    };
  }, []);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    const newMessage = message;
    setMessage(``);
    console.log(`Send message`, newMessage);
    socketRef.current?.emit(`chat-message`, newMessage);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="">
        {messageHistory.map((message, i) => {
          return <div key={i}>{message.text}</div>;
        })}
      </div>

      <form
        id="text-input-container"
        className="py-4 px-2 w-full flex items-center justify-center"
        onSubmit={sendMessage}
      >
        <div className="text-center bg-white w-full md:w-1/3 px-3 py-2 flex gap-3 rounded-xl drop-shadow-2xl">
          <input
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            id="message"
            className="focus:outline-none px-2 flex-1 rounded-xl"
            type="text"
            placeholder="What do you want to say?"
          />
          <button type="submit" className="rounded-xl px-3 py-2 bg-gray-600 text-gray-100 text-sm">
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
