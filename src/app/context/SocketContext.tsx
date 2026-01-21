"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface User {
  id: string;
  email: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: Number,
  type: "TEXT";
  sender: User;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  currentUser: User | null;
  joinChat: (user: User, token: string, conversationId: string) => void;
  sendMessage: (conversationId: string, message: string) => void;
  leaveChat: () => void;
}

const SocketContext = createContext<SocketContextType>(null as any);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const joinChat = React.useCallback(
  (user: User, token: string, conversationId: string) => {
    // Disconnect existing socket
    socketRef.current?.disconnect();

    const newSocket = io("https://lai-chat.onrender.com", {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = newSocket;
    setCurrentUser(user);

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("joinRoom", { roomId: conversationId });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("roomMessage", (payload: any) => {
      if (!payload) return;

      const newMessage: Message = {
        id: payload.id ?? crypto.randomUUID(),
        conversationId: payload.conversationId ?? "system",
        senderId: payload.from?.id ?? "system",
        content: payload.message ?? payload.error ?? "System message",
        sender: payload.from ?? { id: "system", email: "System" },
        type: "TEXT",
        createdAt: payload.timestamp ?? new Date().toISOString(),
      };

      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.content === newMessage.content &&
            msg.sender.id === newMessage.sender.id &&
            Math.abs(
              new Date(msg.createdAt).getTime() -
                new Date(newMessage.createdAt).getTime()
            ) < 1000
        );

        return isDuplicate ? prev : [...prev, newMessage];
      });
    });
  },
  []
);


  const sendMessage = (conversationId: string, message: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit("roomMessage", {
      conversationId,
      message,
      type: "TEXT",
    });
  };

  const leaveChat = () => {
    socketRef.current?.disconnect();
    setMessages([]);
    setCurrentUser(null);
  };

  useEffect(() => {
  return () => {
    socketRef.current?.disconnect();
  };
}, []);


  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        messages,
        currentUser,
        joinChat,
        sendMessage,
        leaveChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};