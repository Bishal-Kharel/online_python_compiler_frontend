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
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const inputBufferRef = useRef("");
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
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed with code: ${event.code}`);
      setConnectionStatus("disconnected");
      reconnectAttempts.current += 1;
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };
  };

  const sendInput = (input) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ input }));
      isWaitingForInput.current = false;
    } else {
      console.error("WebSocket not connected");
    }
  };

  const runCode = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ code }));
      setResetTerminal(true);
      setTimeout(() => setResetTerminal(false), 0);
    } else {
      console.error("WebSocket not connected");
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <ConnectionStatus status={connectionStatus} />
        <CodeEditor code={code} setCode={setCode} />
        <RunButton
          onClick={runCode}
          disabled={connectionStatus !== "connected"}
        />
        <TerminalDisplay
          ws={wsRef.current}
          isWaitingForInput={isWaitingForInput}
          inputBuffer={inputBufferRef}
          sendInput={sendInput}
          resetTerminal={resetTerminal}
        />
      </main>
      <Footer />
    </div>
  );
}

export default App;
