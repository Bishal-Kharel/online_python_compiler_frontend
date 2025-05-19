import React from "react";
import styles from "../styles/Header.module.css";

const Header = () => {
  return (
    <header className={styles.header}>
      <img src="/python.webp" alt="Python Logo" className={styles.logo} />
      <h1 className={styles.title}>CodeTech - Python Online Editor</h1>
    </header>
  );
};

export default Header;
