import { Link, Outlet, useLocation } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { MdPrimaryTab } from "react-material-web";

export default function Layout() {
  const { isConnected, serverUrl, disconnect } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="h-screen flex flex-col bg-md-sys-color-background">
      <nav className="shrink-0">
        <div className="mx-auto max-w-7xl px-8">
          <div className="relative flex h-16 w-full items-end justify-center">
            <Link to="/" className="absolute left-0 top-0 h-16 font-semibold content-center text-xl">
              Kama
            </Link>
            {isConnected && (
              <div className="h-fit">
                <Link to="/collections">
                  <MdPrimaryTab active>Collections</MdPrimaryTab>
                </Link>
                <Link to="/gateway">
                  <MdPrimaryTab>Gateway</MdPrimaryTab>
                </Link>
              </div>
            )}
            <div className="flex items-center h-16 space-x-4 absolute right-0 top-0">
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600 text-sm">Connected to {serverUrl}</span>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <button
                    onClick={disconnect}
                    className="rounded-md bg-red-100 px-3 py-1 text-red-700 text-sm hover:bg-red-200"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-gray-600 text-sm">Not connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="w-screen flex-1 overflow-hidden px-0 sm:px-6 lg:px-1">
        <div className="border h-full mx-auto overflow-y-auto px-8 max-w-7xl bg-md-sys-color-surface-container-low border-b-0 border-md-sys-color-outline-variant rounded-t-2xl bg-background">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
