import { Field, Input } from "@chakra-ui/react";

export function InputNode({ props, style }) {
  return (
    <Field.Root {...style}>
      {props.label ? <Field.Label>{props.label}</Field.Label> : null}
      <Input placeholder={props.placeholder || ""} />
    </Field.Root>
  );
}

export const inputDefinition = {
  defaultProps: { label: "Nama", placeholder: "Ketik di sini" },
  propSchema: [
    { key: "label", label: "Label", input: "text" },
    { key: "placeholder", label: "Placeholder", input: "text" },
  ],
};
