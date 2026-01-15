"use client";

import ChatRoom from "./components/ChatRoom";
import Login from "./components/Login";
import { useSocket } from "./context/SocketContext";
import "./index.css";

export default function Home() {
   const { currentUser } = useSocket();
  return (
     <div className="app">
      {!currentUser ? <Login /> : <ChatRoom />}
    </div>
  );
}
