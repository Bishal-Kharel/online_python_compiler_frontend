import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { FitAddon } from 'xterm-addon-fit';
import styles from '../styles/TerminalDisplay.module.css';

const TerminalDisplay = ({
  ws,
  isWaitingForInput,
  inputBuffer,
  sendInput,
  resetTerminal,
}) => {
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(new FitAddon());

  useEffect(() => {
    terminalRef.current = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
      },
      fontSize: 14,
    });
    terminalRef.current.loadAddon(fitAddonRef.current);
    const termElement = document.getElementById('terminal');
    terminalRef.current.open(termElement);
    fitAddonRef.current.fit();

    terminalRef.current.onData((data) => {
      if (isWaitingForInput.current) {
        if (data === '\r') {
          terminalRef.current.write('\r\n');
          sendInput(inputBuffer.current);
          inputBuffer.current = '';
        } else if (data === '\b' || data === '\x7F') {
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            terminalRef.current.write('\b \b');
          }
        } else if (data >= ' ' && data <= '~') {
          inputBuffer.current += data;
          terminalRef.current.write(data);
        }
      } else {
        if (data === '\r') {
          terminalRef.current.write('\r\n');
        }
      }
    });

    const handleResize = () => {
      fitAddonRef.current.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (terminalRef.current) {
        terminalRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.output) {
            const cleanOutput = data.output.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            terminalRef.current.write(cleanOutput);
            isWaitingForInput.current = cleanOutput.includes('>>>');
          } else if (data.error) {
            terminalRef.current.write(`Error: ${data.error}\r\n`);
            isWaitingForInput.current = false;
          } else if (data.message) {
            terminalRef.current.write(`${data.message}\r\n`);
            isWaitingForInput.current = false;
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };
    }
  }, [ws, isWaitingForInput]);

  useEffect(() => {
    if (resetTerminal) {
      if (terminalRef.current) {
        terminalRef.current.reset();
        fitAddonRef.current.fit();
      }
      isWaitingForInput.current = false;
    }
  }, [resetTerminal]);

  return <div id="terminal" className={styles.terminal}></div>;
};

export default TerminalDisplay;
