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

  const fetchMessages = async (
    identifier: string,
    conversationId: string,
    token: string
  ) => {
    console.log('Fetching messages with params:', { identifier, conversationId });
    
    try {
      const res = await fetch(
        `https://lai-chat.onrender.com/api/v1/chat/messages?userId=${identifier}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Fetch response status:', res.status);
      
      if (!res.ok) {
        console.error('Failed to fetch messages. Status:', res.status);
        const errorText = await res.text();
        console.error('Error response:', errorText);
        return;
      }

      const result = await res.json();
      console.log('Raw API response:', JSON.stringify(result, null, 2));

      if (!result.success) {
        console.error('API returned unsuccessful response:', result);
        return;
      }

      // Handle case when no messages are found
      if (result.message === 'No messages found.') {
        console.log('No messages found for this conversation');
        setMessages([]);
        return;
      }

      if (!result.data || (typeof result.data === 'object' && Object.keys(result.data).length === 0)) {
        console.log('No messages data in response, initializing empty messages array');
        setMessages([]);
        return;
      }

      if (!Array.isArray(result.data)) {
        console.error('Invalid data format in response:', result);
        return;
      }

      // Filter messages by conversationId and map to the expected format
      const filteredMessages = result.data
        .filter((msg: any) => {
          const matches = msg.conversationId === conversationId;
          if (!matches) {
            console.log('Filtering out message - wrong conversation:', {
              messageId: msg.id,
              messageConversationId: msg.conversationId,
              targetConversationId: conversationId
            });
          }
          return matches;
        });

      console.log('Filtered messages count:', filteredMessages.length);
      
      // Map to the expected Message type
      const mappedMessages: Message[] = filteredMessages.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.content,
        senderId: msg.senderId,
        sender: {
          id: String(msg.senderId),
          email: `user${msg.senderId}@example.com`, // Default email since it's not in the API response
        },
        type: 'TEXT',
        createdAt: msg.createdAt,
      }));

      console.log('Mapped messages:', JSON.stringify(mappedMessages, null, 2));
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  };


  const joinChat = React.useCallback(
    async (user: User, token: string, conversationId: string) => {
      console.log("Joining chat with:", { user, conversationId });

      const identifier = localStorage.getItem("userIdentifier");
      if (!identifier) return;

      await fetchMessages(identifier, conversationId, token);

      // Disconnect existing socket
      if (socketRef.current) {
        console.log("Disconnecting existing socket");
        socketRef.current.disconnect();
      }

      const newSocket = io("https://lai-chat.onrender.com", {
        transports: ["websocket"],
        auth: {
          token,
          userId: user.id
        },
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        autoConnect: true,
      });
      console.log("New socket created, setting up listeners");

      socketRef.current = newSocket;
      setCurrentUser(user);

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error.message);
        if (error.message === "invalid credentials" || error.message === "Not authorized") {
          console.error("Authentication failed - invalid token");
          // You might want to redirect to login here
        }
      });

      newSocket.on("connect", () => {
        console.log("Socket connected, joining room:", conversationId);
        setIsConnected(true);
        newSocket.emit("joinRoom", {
          roomId: conversationId,
          userId: user.id  // Make sure to include userId when joining room
        }, (response: any) => {
          if (response?.error) {
            console.error("Error joining room:", response.error);
          } else {
            console.log("Successfully joined room:", response);
          }
        });
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`Reconnection attempt ${attemptNumber}`);
      });
      newSocket.on("reconnect_failed", () => {
        console.error("Failed to reconnect after multiple attempts");
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected, reason:", reason);
        setIsConnected(false);
      });

      newSocket.on("roomMessage", (payload: any) => {
        console.log("Received message payload:", payload);
        if (!payload) {
          console.error("Received empty message payload");
          return;
        }
        const newMessage: Message = {
          id: payload.id ?? crypto.randomUUID(),
          conversationId: payload.conversationId ?? "system",
          senderId: payload.from?.id ?? "system",
          content: payload.message ?? payload.error ?? "System message",
          sender: payload.from ?? { id: "system", email: "System" },
          type: "TEXT",
          createdAt: payload.timestamp ?? new Date().toISOString(),
        };

        console.log("Message details:", {
          id: payload.id,
          from: payload.from,
          content: payload.message || payload.content,
          timestamp: payload.timestamp
        });

        console.log("Processed new message:", newMessage);
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

          if (isDuplicate) {
            console.log("Duplicate message detected, not adding to state");
            return prev;
          }
          console.log("Adding new message to state");
          return [...prev, newMessage];

        });
      });
    },
    []
  );


  const sendMessage = (conversationId: string, message: string) => {
    if (!socketRef.current) {
      console.error("Socket is not connected");
      return;
    }

    if (!socketRef.current.connected) {
      console.error("Socket is not connected, attempting to reconnect...");
      socketRef.current.connect();
      // You might want to add the message to a queue to send after reconnection
      return;
    }

    console.log("Sending message:", { conversationId, message });
    socketRef.current.emit("roomMessage", {
      conversationId,
      message,
      type: "TEXT",
    },
      (acknowledgment: any) => {
        if (acknowledgment?.error) {
          console.error("Error sending message:", acknowledgment.error);
        } else {
          console.log("Message sent successfully:", acknowledgment);
        }
      }

    );
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