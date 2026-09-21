"use client";

import { createContext, useContext } from "react";

const FlowContext = createContext(null);

/**
 * Aksi canvas yang perlu diakses dari dalam node/port (yang di-render React
 * Flow di luar pohon komponen flow-canvas).
 *
 * `value`: { setNodes, openPortMenu, connectMode }
 */
export function FlowProvider({ value, children }) {
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlowContext() {
  const value = useContext(FlowContext);
  if (!value) {
    throw new Error("useFlowContext must be used within FlowProvider");
  }
  return value;
}
