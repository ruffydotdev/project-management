import React from "react";
import "./FormInput.scss";

export interface WarningInfo {
  warn?: boolean;
  message?: string;
}

export interface FormInputProps {
  text?: React.ReactNode;
  htmlFor?: string;
  type?: string;
  value?: string | number;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  emoji?: React.ReactNode;
  emojiOnClick?: () => void;
  warn?: WarningInfo;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const FormInput = ({
  text,
  htmlFor,
  type,
  value,
  name,
  onChange,
  emoji,
  emojiOnClick,
  warn,
  onKeyDown,
}: FormInputProps) => {
  return (
    <div className={warn?.warn ? "form__input warn" : "form__input"}>
      <label htmlFor={htmlFor}>{text}</label>
      <div className="input__wrapper">
        <input
          type={type}
          id={htmlFor}
          value={value ? value : ""}
          name={name}
          onChange={onChange}
          onKeyDown={(e) => {
            if (onKeyDown) {
              onKeyDown(e);
            }
          }}
        ></input>
        {emoji && (
          <div
            className="input__emoji"
            onClick={() => {
              if (emojiOnClick) {
                emojiOnClick();
              }
            }}
          >
            {emoji}
          </div>
        )}
        <span className="warning">
          {warn?.warn ? warn.message : "This is warning"}
        </span>
      </div>
    </div>
  );
};

export default FormInput;
