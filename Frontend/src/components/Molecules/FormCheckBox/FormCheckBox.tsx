import React from "react";
import "./FormCheckBox.scss";

export interface FormCheckBoxProps {
  name: string;
  values: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  data?: string[];
}

const FormCheckBox = ({ name, values, onChange, data }: FormCheckBoxProps) => {
  return (
    <div className="checkbox">
      <p className="checkbox__label ">Select Your {name}:</p>
      <div className={`${name}-values checkbox__values`}>
        {values.map((item) => {
          return (
            <div key={item} className="checkbox__value">
              <input
                type="checkbox"
                id={item}
                name={name}
                value={item}
                onChange={onChange}
                checked={data ? data.includes(item) : false}
              />
              <label htmlFor={item}>{item}</label>
            </div>
          );
        })}
      </div>
      <p className="checkbox__warning">This is Warning</p>
    </div>
  );
};

export default FormCheckBox;
