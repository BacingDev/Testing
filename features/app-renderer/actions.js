"use client";

import { notify } from "@/lib/toast";

export const ACTION_TYPES = ["navigate", "submit_form", "call_api", "show_message", "set_state"];

export const ACTION_PARAM_SCHEMAS = {
  navigate: [{ key: "to", label: "Tujuan path", input: "text" }],
  show_message: [{ key: "message", label: "Pesan", input: "text" }],
  set_state: [
    { key: "key", label: "Nama variabel", input: "text" },
    { key: "value", label: "Nilai", input: "text" },
  ],
  call_api: [
    { key: "url", label: "URL", input: "text" },
    { key: "method", label: "Method", input: "select", options: ["GET", "POST"] },
  ],
  submit_form: [{ key: "table", label: "Nama tabel", input: "text" }],
};

export async function runAction(action, ctx) {
  if (!action || typeof action !== "object") return;
  switch (action.action) {
    case "navigate":
      ctx.navigate(action.to || "/");
      break;
    case "show_message":
      ctx.message(action.message || "");
      break;
    case "set_state":
      if (action.key) ctx.setVar(action.key, action.value ?? "");
      break;
    case "call_api":
      await ctx.callApi(action.url || "", action.method || "GET");
      break;
    case "submit_form":
      await ctx.submitForm(action.table || "", ctx.formValues());
      break;
    default:
      break;
  }
}
