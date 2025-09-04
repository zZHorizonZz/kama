import { Link, Outlet, useLocation } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { MdIcon, MdPrimaryTab } from "react-material-web";

export default function Layout() {
  const { isConnected, serverUrl, disconnect } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex h-screen flex-col bg-md-sys-color-background">
      <nav className="shrink-0">
        <div className="mx-auto max-w-7xl px-8">
          <div className="relative flex h-16 w-full items-end justify-center">
            <Link to="/" className="absolute top-0 left-0 h-16 content-center font-semibold text-xl">
              Kama
            </Link>
            {isConnected && (
              <div className="h-fit">
                <Link to="/schematic">
                  <MdPrimaryTab>Schematic</MdPrimaryTab>
                </Link>
                <Link to="/collections">
                  <MdPrimaryTab active>Collections</MdPrimaryTab>
                </Link>
                <Link to="/identity">
                  <MdPrimaryTab>Identity</MdPrimaryTab>
                </Link>
                <Link to="/gateway">
                  <MdPrimaryTab>Gateway</MdPrimaryTab>
                </Link>
              </div>
            )}
            <div className="absolute top-0 right-0 flex h-16 items-center space-x-4">
              <Link to="/profile">
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-md-sys-color-primary to-md-sys-color-secondary">
                  <MdIcon className="text-md-sys-color-on-primary">person</MdIcon>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="w-screen flex-1 overflow-hidden px-0 sm:px-6 lg:px-1">
        <div className="mx-auto h-full max-w-7xl overflow-y-auto rounded-t-2xl border border-md-sys-color-outline-variant border-b-0 bg-background bg-md-sys-color-surface-container-low p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
