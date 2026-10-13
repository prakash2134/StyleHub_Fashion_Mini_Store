import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const ConfigContext = createContext({ currency: "inr", stripe_publishable_key: "", payments_enabled: false });

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({ currency: "inr", stripe_publishable_key: "", payments_enabled: false });

  useEffect(() => {
    api("/config", { auth: false })
      .then(setConfig)
      .catch(() => {});
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
