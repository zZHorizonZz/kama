import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  isConnected: boolean;
  serverUrl: string;
  connect: (url: string) => void;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState("http://localhost:9000");

  const connect = (url: string) => {
    setServerUrl(url);
    setIsConnected(true);
  };

  const disconnect = () => {
    setIsConnected(false);
  };

  return (
    <AuthContext.Provider value={{ isConnected, serverUrl, connect, disconnect }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
