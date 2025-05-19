import React from "react";
import styles from "../styles/ConnectionStatus.module.css";

const ConnectionStatus = ({ status }) => {
  if (status === "connected") return null;
  return (
    <div className={styles.container}>
      {status === "connecting"
        ? "Connecting to server... Please wait."
        : "Connection lost. Reconnecting..."}
    </div>
  );
};

export default ConnectionStatus;
