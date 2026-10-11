import React from "react";
import "./FormDropDownMenu.scss";

export interface FormDropDownMenuProps {
  name: string;
  options: string[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  value?: string;
}

const FormDropDownMenu = ({ name, options, onChange, value }: FormDropDownMenuProps) => {
  return (
    <div className="select">
      <p className="select__label">Select Your {name}:</p>
      <select
        className={`${name}-values select__values`}
        name={name}
        onChange={onChange}
        value={value}
      >
        {options.map((item) => {
          return (
            <option key={item} className="select_value" value={item}>
              {item}
            </option>
          );
        })}
      </select>
      <p className="select__warning">This is Warning</p>
    </div>
  );
};

export default FormDropDownMenu;
