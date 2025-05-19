import React from "react";
import styles from "../styles/RunButton.module.css";

const RunButton = ({ onClick, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={styles.button}>
      Run Code
    </button>
  );
};

export default RunButton;
