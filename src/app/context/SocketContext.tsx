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
  message: string;
  type: "TEXT";
  user: User;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const joinChat = (user: User, token: string, conversationId: string) => {
    if (socket) socket.disconnect();

    const newSocket = io("https://lai-chat.onrender.com", {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(newSocket);
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

      if (!payload.from) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            conversationId: payload.conversationId ?? "system",
            message: payload.error ?? payload.message ?? "System message",
            user: {
              id: "system",
              email: "System",
            },
            type: "TEXT",
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }

      const newMessage: Message = {
        id: payload.id ?? crypto.randomUUID(),
        conversationId: payload.conversationId,
        message: payload.message,
        user: payload.from,
        type: payload.type,
        createdAt: payload.timestamp,
      };

      // Prevent duplicates by checking if message already exists
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.message === newMessage.message &&
            msg.user.id === newMessage.user.id &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 1000
        );
        
        if (isDuplicate) return prev;
        return [...prev, newMessage];
      });
    });
  };

  const sendMessage = (conversationId: string, message: string) => {
    if (!socket) return;

    socket.emit("roomMessage", {
      conversationId,
      message,
      type: "TEXT",
    });
  };

  const leaveChat = () => {
    socket?.disconnect();
    setSocket(null);
    setMessages([]);
    setCurrentUser(null);
  };

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
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