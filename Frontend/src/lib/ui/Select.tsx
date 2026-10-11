import React from "react";
import styles from "./Select.module.scss";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: (string | Option)[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = "",
  ...props
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectWrapper}>
        <select className={`${styles.select} ${error ? styles.hasError : ""}`} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === "string" ? opt : opt.value;
            const text = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={val} value={val} className={styles.option}>
                {text}
              </option>
            );
          })}
        </select>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export default Select;
