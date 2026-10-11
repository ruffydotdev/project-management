import React from "react";
import "./Button.scss";

export interface ButtonProps {
  text?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

const Button = ({ text, onClick, children, type = "button" }: ButtonProps) => {
  return (
    <button
      type={type}
      className="btn"
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        }
      }}
    >
      {text ? text : children}
    </button>
  );
};

export default Button;
