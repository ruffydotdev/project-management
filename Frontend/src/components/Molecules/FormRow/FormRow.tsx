import React from "react";
import "./FormRow.scss";

export interface FormRowProps {
  children?: React.ReactNode;
}

const FormRow = ({ children }: FormRowProps) => {
  return <div className="form__row">{children}</div>;
};

export default FormRow;
