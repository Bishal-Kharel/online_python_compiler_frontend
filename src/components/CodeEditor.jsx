import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import styles from "../styles/CodeEditor.module.css";

const CodeEditor = ({ code, setCode }) => {
  return (
    <div className={styles.container}>
      <CodeMirror
        value={code}
        extensions={[python()]}
        onChange={(value) => setCode(value)}
        height="60vh"
        theme="light"
        basicSetup={{
          highlightActiveLine: true,
          highlightSpecialChars: true,
        }}
        className={styles.editor}
      />
    </div>
  );
};

export default CodeEditor;
