"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import MessageItem from "./MessageItem";
import styles from "./ChatRoom.module.css";

const ChatRoom: React.FC = () => {
  const { messages, sendMessage, joinChat, currentUser } = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");
    const conversationId = localStorage.getItem("conversationId");

    if (!token || !userId || !conversationId) return;

    joinChat(
      { id: userId, email: email ?? "" },
      token,
      conversationId
    );
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(localStorage.getItem("conversationId")!, newMessage);
    setNewMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Chat</h2>
        <p>{currentUser?.email}</p>
      </div>

      <div className={styles.chatMessages}>
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isOwnMessage={msg.user.id === currentUser?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.messageForm} onSubmit={handleSend}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatRoom;
