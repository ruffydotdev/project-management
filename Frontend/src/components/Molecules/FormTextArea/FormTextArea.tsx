import React from "react";
import "./FormTextArea.scss";

export interface WarningInfo {
  warn?: boolean;
  message?: string;
}

export interface FormTextAreaProps {
  text?: React.ReactNode;
  htmlFor?: string;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  emoji?: React.ReactNode;
  emojiOnClick?: () => void;
  warn?: WarningInfo;
  hint?: React.ReactNode;
}

const FormTextArea = ({
  text,
  htmlFor,
  value,
  name,
  onChange,
  emoji,
  emojiOnClick,
  warn,
  hint,
}: FormTextAreaProps) => {
  return (
    <div className={warn?.warn ? "form__textarea warn" : "form__textarea"}>
      <div>
        <label htmlFor={htmlFor}>{text}</label>
        <p className="hint">{hint}</p>
      </div>
      <div className="textarea__wrapper">
        <textarea
          id={htmlFor}
          value={value ? value : ""}
          name={name}
          onChange={onChange}
        ></textarea>
        {emoji && (
          <div
            className="textarea__emoji"
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

export default FormTextArea;
