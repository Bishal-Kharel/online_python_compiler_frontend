import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import styles from "../styles/TerminalDisplay.module.css";

const TerminalDisplay = ({ ws, isWaitingForInput, sendInput, isRunning, setIsRunning }) => {
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(new FitAddon());
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    terminalRef.current = new Terminal({
      cursorBlink: true,
      theme: { background: "#ffffff", foreground: "#000000", cursor: "#000000" },
      fontSize: 14,
    });
    terminalRef.current.loadAddon(fitAddonRef.current);
    const termElement = document.getElementById("terminal");
    if (termElement) {
      terminalRef.current.open(termElement);
      fitAddonRef.current.fit();
      terminalRef.current.write("Terminal initialized\r\n");
    } else {
      console.error("Terminal element not found");
    }

    const handleResize = () => fitAddonRef.current.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (terminalRef.current) terminalRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        console.log("Raw WebSocket message:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data.output) {
            const cleanOutput = data.output.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
            terminalRef.current.write(cleanOutput);
            isWaitingForInput.current = cleanOutput.includes(">>>");
            console.log("isWaitingForInput set to:", isWaitingForInput.current);
            if (cleanOutput.includes("Process exited")) {
              setIsRunning(false);
              console.log("Process exited, isRunning set to false");
            }
          } else if (data.error) {
            terminalRef.current.write(`\x1b[31mError: ${data.error}\x1b[0m\r\n`);
            isWaitingForInput.current = false;
            setIsRunning(false);
            console.log("Error displayed:", data.error);
          } else if (data.pong) {
            console.log("Received pong");
          }
        } catch (e) {
          console.error("WebSocket message parse error:", e, "Raw data:", event.data);
          terminalRef.current.write(`\x1b[31mError: WebSocket message error\x1b[0m\r\n`);
          setIsRunning(false);
        }
      };
    }
  }, [ws, isWaitingForInput, setIsRunning]);

  useEffect(() => {
    if (isRunning) {
      terminalRef.current.reset();
      fitAddonRef.current.fit();
      isWaitingForInput.current = false;
      setInputValue("");
      console.log("Terminal reset");
    }
  }, [isRunning]);

  useEffect(() => {
    if (isWaitingForInput.current && inputRef.current) {
      inputRef.current.focus();
      console.log("Input field focused");
    }
  }, [isWaitingForInput]);

  const handleInputKeyPress = (e) => {
    if (e.key === "Enter" && isWaitingForInput.current) {
      const input = inputValue.trim();
      if (input) {
        sendInput(input);
        terminalRef.current.write(input + "\r\n");
        setInputValue("");
        console.log("Input sent:", input);
      }
    }
  };

  return (
    <div className={styles.terminalContainer}>
      <div id="terminal" className={styles.terminal} />
      {isWaitingForInput.current && (
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleInputKeyPress}
          placeholder="Enter input here..."
        />
      )}
    </div>
  );
};

export default TerminalDisplay;
