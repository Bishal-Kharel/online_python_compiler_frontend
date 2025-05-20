import React, { useEffect, useRef, useState } from "react";
import CodeEditor from "./components/CodeEditor";
import TerminalDisplay from "./components/TerminalDisplay";
import RunButton from "./components/RunButton";
import ConnectionStatus from "./components/ConnectionStatus";
import Header from "./components/Header";
import Footer from "./components/Footer";
import styles from "./styles/App.module.css";

function App() {
  const [code, setCode] = useState(
    '# Write your Python code here\nprint("Welcome to CodeTech!")'
  );
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isWaitingForInput = useRef(false);
  const reconnectAttempts = useRef(0);
  const [resetTerminal, setResetTerminal] = useState(false);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const wsUrl = import.meta.env.VITE_BACKEND_WS;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setConnectionStatus("connecting");

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("connected");
      reconnectAttempts.current = 0;
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ ping: true }));
          console.log("Sent ping");
        } else {
          clearInterval(pingInterval);
        }
      }, 3000); // Ping every 3 seconds
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.output) {
          isWaitingForInput.current = data.output.includes(">>>");
          console.log("isWaitingForInput:", isWaitingForInput.current);
        } else if (data.error) {
          isWaitingForInput.current = false;
          setIsRunning(false);
          console.log("Error received:", data.error);
        } else if (data.pong) {
          console.log("Received pong");
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
        setIsRunning(false);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed with code: ${event.code}`);
      setConnectionStatus("disconnected");
      setIsRunning(false);
      isWaitingForInput.current = false;
      reconnectAttempts.current += 1;
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
      setIsRunning(false);
      isWaitingForInput.current = false;
    };
  };

  const sendInput = (input) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ input }));
      console.log("Sent input:", input);
    } else {
      console.error("WebSocket not connected");
      isWaitingForInput.current = false;
      setIsRunning(false);
    }
  };

  const runCode = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isRunning) {
      setIsRunning(true);
      setResetTerminal(true);
      wsRef.current.send(JSON.stringify({ code }));
      console.log("Sent code:", code);
      setTimeout(() => setResetTerminal(false), 0);
      isWaitingForInput.current = false;
      // Timeout to reset isRunning if no output received
      setTimeout(() => {
        if (isRunning && !isWaitingForInput.current) {
          console.warn("No output received, resetting isRunning");
          setIsRunning(false);
        }
      }, 10000); // 10-second timeout
    } else {
      console.error("WebSocket not connected or process already running");
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <ConnectionStatus status={connectionStatus} />
        <CodeEditor code={code} setCode={setCode} />
        <RunButton onClick={runCode} disabled={connectionStatus !== "connected" || isRunning} />
        <TerminalDisplay
          ws={wsRef.current}
          isWaitingForInput={isWaitingForInput}
          sendInput={sendInput}
          resetTerminal={resetTerminal}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
