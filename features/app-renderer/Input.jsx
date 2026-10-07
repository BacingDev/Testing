import { Field, Input } from "@chakra-ui/react";

export function InputNode({ props, style, value, onInput }) {
  const controlled = typeof onInput === "function";
  return (
    <Field.Root {...style}>
      {props.label ? <Field.Label>{props.label}</Field.Label> : null}
      <Input
        placeholder={props.placeholder || ""}
        {...(controlled
          ? { value: value ?? "", onChange: (event) => onInput(event.target.value) }
          : {})}
      />
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
