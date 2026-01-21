"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import MessageItem from "./MessageItem";
import styles from "./ChatRoom.module.css";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    email: string;
  };
  createdAt: string;
}

const ChatRoom: React.FC = () => {
  const { messages, sendMessage, joinChat, currentUser, socket } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [conversationId, setConversationId] = useState<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setConversationId(localStorage.getItem("conversationId") || '');
  }, []);

  // Get user data from localStorage once on component mount
  const [userData, setUserData] = useState<{ token: string | null; userId: string | null; email: string | null }>({
    token: null,
    userId: null,
    email: null
  });

  // Set user data on component mount
  useEffect(() => {
    setUserData({
      token: localStorage.getItem("accessToken"),
      userId: localStorage.getItem("userId"),
      email: localStorage.getItem("userEmail")
    });
  }, []);

  // Handle joining chat when conversationId or userData changes
  useEffect(() => {
    const { token, userId, email } = userData;

    if (!token || !userId || !conversationId || !email) return;

    joinChat({ id: userId, email }, token, conversationId);
  }, [conversationId, userData.token, userData.userId, userData.email]);


  useEffect(() => {
    const handleTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== currentUser?.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(data.userId);
          return newSet;
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }, 3000);
      }
    };

    socket?.on('typing', handleTyping);

    return () => {
      socket?.off('typing', handleTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, socket, currentUser?.id, joinChat]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) {
      console.log("Message or conversationId is empty", {
        hasMessage: !!newMessage.trim(),
        conversationId
      });
      return;
    }

    console.log("Attempting to send message", {
      conversationId,
      message: newMessage
    });

    sendMessage(conversationId, newMessage);
    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("Messages updated:", messages);
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = e.target.value;
    setNewMessage(message);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socket && conversationId) {
      socket.emit('typing', {
        conversationId,
        userId: currentUser?.id || 'unknown'
      });

      typingTimeoutRef.current = setTimeout(() => {
        // This is handled by the server, but we can also clean up locally
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentUser?.id || '');
          return newSet;
        });
      }, 3000);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Chat</h2>
        <p>{currentUser?.email}</p>
      </div>

      <div className={styles.chatMessages}>
        {messages.map((msg) => {
          const isOwn = String(msg.sender.id) === String(currentUser?.id);
          console.log('Message:', {
            messageId: msg.id,
            senderId: msg.sender.id,
            currentUserId: currentUser?.id,
            isOwn,
            type: { senderType: typeof msg.sender.id, currentType: typeof currentUser?.id }
          });
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              isOwnMessage={isOwn}
            />
          );
        })}

        {Array.from(typingUsers).map(userId => {
          // Find the user in the messages to get their name
          const typingUser = messages.find(msg => msg.sender.id === userId)?.sender;
          return (
            <MessageItem
              key={`typing-${userId}`}
              message={{
                id: `typing-${userId}`,
                content: 'typing...',
                senderId: Number(userId),
                sender: typingUser || { id: userId, email: '...' },
                createdAt: new Date().toISOString()
              }}
              isOwnMessage={false}
              isTyping={true}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <form className={styles.messageForm} onSubmit={handleSend}>
        <input
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message"
          className={styles.messageInput}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;