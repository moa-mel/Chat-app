
import React from 'react';
import styles from './MessageItem.module.css';

interface User {
  id: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  senderId: Number,
  sender: {
    id: string;
    email: string;
  };
  createdAt: string;
}

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  isTyping?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage , isTyping}) => {
  if (isTyping) {
    return (
      <div className={`${styles.messageItem} ${styles.typingIndicator} ${isOwnMessage ? styles.ownMessage : ''}`}>
        <div className={styles.typingDot}></div>
        <div className={styles.typingDot}></div>
        <div className={styles.typingDot}></div>
      </div>
    );
  }

  const isSystemMessage = message.sender.id === 'system';

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });


  if (isSystemMessage) {
    return (
      <div className={styles.systemMessage}>
        <p>{message.content}</p>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.messageItem} ${isOwnMessage ? styles.ownMessage : ''}`}>
      <div className={styles.messageContent}>
        {!isOwnMessage && <p className={styles.username}>{message.sender.email}</p>}
        <p className={styles.messageText}>{message.content}</p>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
};

export default MessageItem;