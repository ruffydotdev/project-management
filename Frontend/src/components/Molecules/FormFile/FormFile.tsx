import React from "react";
import "./FormFile.scss";

export interface FormFileProps {
  name?: string;
  labelFor?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
}

const FormFile = ({ name, labelFor, onChange, id, ref }: FormFileProps) => {
  return (
    <div className="file">
      <label htmlFor={labelFor}>Select Image for your Profile</label>
      <input type="file" name={name} id={id} onChange={onChange} ref={ref} />
    </div>
  );
};

export default FormFile;
