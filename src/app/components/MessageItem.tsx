
import React from 'react';
import styles from './MessageItem.module.css';

interface User {
  id: string;
  email: string;
}

interface Message {
  id: string;
  message: string;
  user: {
    id: string;
    email: string;
  };
  createdAt: string;
}

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage }) => {
  const isSystemMessage = message.user.id === 'system';

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });


  if (isSystemMessage) {
    return (
      <div className={styles.systemMessage}>
        <p>{message.message}</p>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.messageItem} ${isOwnMessage ? styles.ownMessage : ''}`}>
      <div className={styles.messageContent}>
        {!isOwnMessage && <p className={styles.username}>{message.user.email}</p>}
        <p className={styles.messageText}>{message.message}</p>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
};

export default MessageItem;