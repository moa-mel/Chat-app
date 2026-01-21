"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./SelectUser.module.css";

interface User {
  id: string;
  identifier: string;
  email: string;
  name: string;
  conversationId?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export default function SelectUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("accessToken");
      const currentUserId = localStorage.getItem("userId");

      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://lai-chat.onrender.com/api/v1/chat/conversations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch conversations");
        }

        const result = await response.json();

        console.log('API Response:', result); // Log the full response

        if (result.success && result.data) {
          // Transform the data to match our User interface
          const formattedUsers = result.data
            .filter((conv: any) => {
              // Skip conversations without users or with empty users array
              if (!conv.users || !Array.isArray(conv.users)) {
                console.warn('Invalid users in conversation:', conv);
                return false;
              }
              return true;
            })
            .map((conv: any) => {
              try {
                // Find the other user in the conversation
                const otherUser = conv.users.find(
                  (p: any) => p && p.id && p.id.toString() !== currentUserId
                );

                if (!otherUser) {
                  console.warn('No other user found in conversation:', conv);
                  return null;
                }

                // Combine first and last name for display
                const fullName = [otherUser.firstName, otherUser.lastName]
                  .filter(Boolean)
                  .join(' ');

                return {
                  id: otherUser.id.toString(),
                  email: otherUser.email || 'Unknown User',
                  name: fullName || otherUser.identifier || 'Unknown User',
                  identifier: otherUser.identifier,
                  conversationId: conv.id,
                  lastMessage: conv.lastMessage?.content,
                  lastMessageTime: conv.lastMessage?.createdAt,
                  unreadCount: conv.unreadCount || 0
                };
              } catch (err) {
                console.error('Error processing conversation:', conv, err);
                return null;
              }
            })
            .filter(Boolean); // Remove any null entries from the map

          setUsers(formattedUsers);

        }
      } catch (err: any) {
        console.error('Error fetching conversations:', err);
        setError(err.message || "Failed to load conversations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Initialize WebSocket connection
    const initializeWebSocket = () => {
      try {
        // Replace with your WebSocket URL
        const wsUrl = 'wss://lai-chat.onrender.com';
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('WebSocket Connected');
          setIsWsConnected(true);
          reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            // Handle incoming WebSocket messages here
            console.log('WebSocket message received:', message);

            // If you need to update the UI based on WebSocket messages, do it here
            // For example, refresh conversations when a new message arrives
            if (message.type === 'NEW_MESSAGE') {
              fetchConversations();
            }
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsWsConnected(false);
        };

        socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsWsConnected(false);

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`Attempting to reconnect in ${timeout}ms...`);

            reconnectTimeout.current = setTimeout(() => {
              reconnectAttempts.current++;
              initializeWebSocket();
            }, timeout);
          } else {
            console.error('Max reconnection attempts reached');
          }
        };

        setWs(socket);

        // Cleanup function
        return () => {
          if (socket) {
            socket.close();
          }
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
          }
        };
      } catch (err) {
        console.error('Error initializing WebSocket:', err);
      }
    };

    // Initialize WebSocket connection
    initializeWebSocket();

    // Cleanup function
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  const startChat = async (userId: string, userIdentifier: string) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("You are not logged in. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store the clicked user's identifier
      localStorage.setItem("userIdentifier", userIdentifier);
      console.log("userIdentifier", userIdentifier);

      const res = await fetch(
        "https://lai-chat.onrender.com/api/v1/chat/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: Number(userId) }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to start chat");
      }

      if (!result.data || !result.data.id) {
        throw new Error("Invalid response from server: missing conversation ID");
      }

      const conversationId = result.data.id;
      localStorage.setItem("conversationId", conversationId);
      router.push(`/chat/${conversationId}?userId=${userId}`);
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || "Failed to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Chats</h2>

        {loading ? (
          <div className={styles.loading}>Loading conversations...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : users.length === 0 ? (
          <div className={styles.emptyState}>No conversations found</div>
        ) : (
          <div className={styles.userList}>
            {users.map((user) => (
              <div
                key={user.id}
                className={styles.userItem}
                onClick={() => startChat(user.id, user.identifier)}
              >
                <div className={styles.avatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userHeader}>
                    <span className={styles.userName}>{user.name}</span>
                    {user.lastMessageTime && (
                      <span className={styles.time}>
                        {formatTime(user.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className={styles.userLastMessage}>
                    {user.lastMessage || 'No messages yet'}
                  </div>
                </div>
                {user.unreadCount ? (
                  <span className={styles.unreadBadge}>{user.unreadCount}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
