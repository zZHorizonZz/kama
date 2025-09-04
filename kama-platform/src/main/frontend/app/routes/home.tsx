import { useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "~/contexts/auth-context";

export default function Home() {
  const { isConnected, connect } = useAuth();
  const [serverUrl, setServerUrl] = useState("http://localhost:9000");
  const [connecting, setConnecting] = useState(false);

  if (isConnected) {
    return <Navigate to="/collections" replace />;
  }

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      connect(serverUrl);
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center font-bold text-3xl text-gray-900 tracking-tight">Connect to Kama Server</h2>
        <p className="mt-2 text-center text-gray-600 text-sm">Enter your server URL to get started</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label htmlFor="server-url" className="block font-medium text-gray-700 text-sm">
                Server URL
              </label>
              <div className="mt-1">
                <input
                  id="server-url"
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="http://localhost:9000"
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleConnect}
                disabled={connecting || !serverUrl}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
