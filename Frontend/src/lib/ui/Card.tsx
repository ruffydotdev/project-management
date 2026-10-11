import React from "react";
import styles from "./Card.module.scss";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
  title,
  subtitle,
  action,
}) => {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ""} ${className}`}
      onClick={onClick}
    >
      {(title || action) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default Card;
