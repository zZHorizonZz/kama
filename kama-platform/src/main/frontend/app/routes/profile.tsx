import { Link } from "react-router";
import { MdFilledCard, MdIcon, MdTextButton, MdOutlinedSelect, MdSelectOption, MdListItem } from "react-material-web";
import { useTheme } from "~/contexts/theme-context";

export default function Profile() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return theme;
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "light":
        return "light_mode";
      case "dark":
        return "dark_mode";
      case "system":
        return "brightness_auto";
      default:
        return "brightness_auto";
    }
  };

  return (
    <div className="space-y-6">
      <div className="container flex w-full flex-row items-center justify-between py-8">
        <div className="flex items-center">
          <Link to="/collections">
            <MdTextButton>
              <MdIcon slot="icon">apps</MdIcon>
              Collections
            </MdTextButton>
          </Link>
          <MdIcon>chevron_forward</MdIcon>
          <MdTextButton disabled>Profile</MdTextButton>
        </div>
      </div>

      <div className="border-md-sys-color-primary border-l-4 pl-6">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-md-sys-color-primary to-md-sys-color-secondary">
            <MdIcon className="text-2xl text-md-sys-color-on-primary">person</MdIcon>
          </div>
          <div>
            <h1 className="text-md-sys-color-on-surface text-md-sys-typescale-display-small">User Profile</h1>
            <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
              Manage your preferences and settings
            </p>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <MdFilledCard>
        <div className="flex w-full items-center justify-center p-4">
          <p className="text-md-sys-typescale-title-large">Appearance</p>
        </div>
        <div className="space-y-4 p-4">
          <MdListItem>
            <MdIcon slot="start">{getThemeIcon(theme)}</MdIcon>
            <div slot="headline" className="text-md-sys-typescale-body-large">
              Theme
            </div>
            <div slot="supporting-text" className="text-md-sys-typescale-body-medium">
              Choose how Kama looks to you
            </div>
          </MdListItem>

          <div className="space-y-2">
            <label className="block text-md-sys-color-on-surface text-md-sys-typescale-body-medium">Select Theme</label>
            <MdOutlinedSelect
              value={theme}
              onInput={(e) => setTheme((e.target as HTMLSelectElement)?.value as "light" | "dark" | "system")}
            >
              <MdSelectOption value="light">
                <div slot="headline" className="flex items-center space-x-2">
                  <MdIcon>light_mode</MdIcon>
                  <span>Light</span>
                </div>
                <div slot="supporting-text">Always use light theme</div>
              </MdSelectOption>
              <MdSelectOption value="dark">
                <div slot="headline" className="flex items-center space-x-2">
                  <MdIcon>dark_mode</MdIcon>
                  <span>Dark</span>
                </div>
                <div slot="supporting-text">Always use dark theme</div>
              </MdSelectOption>
              <MdSelectOption value="system">
                <div slot="headline" className="flex items-center space-x-2">
                  <MdIcon>brightness_auto</MdIcon>
                  <span>System</span>
                </div>
                <div slot="supporting-text">Use system preference</div>
              </MdSelectOption>
            </MdOutlinedSelect>
          </div>

          <div className="mt-4 rounded-md-sys-shape-corner-md bg-md-sys-color-surface-container-low p-4">
            <div className="mb-2 flex items-center space-x-2">
              <MdIcon className="text-md-sys-color-primary">info</MdIcon>
              <span className="text-md-sys-color-on-surface text-md-sys-typescale-body-medium">
                Current Theme: {getThemeDisplayName(theme)}
              </span>
            </div>
            <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-small">
              {theme === "system"
                ? "The theme will automatically switch based on your system preferences."
                : `The theme is set to ${theme} mode and will remain consistent across sessions.`}
            </p>
          </div>
        </div>
      </MdFilledCard>

      {/* About Section */}
      <MdFilledCard>
        <div className="flex w-full items-center justify-center p-4">
          <p className="text-md-sys-typescale-title-large">About</p>
        </div>
        <div className="space-y-4 p-4">
          <MdListItem>
            <MdIcon slot="start">info</MdIcon>
            <div slot="headline" className="text-md-sys-typescale-body-large">
              Kama Platform
            </div>
            <div slot="supporting-text" className="text-md-sys-typescale-body-medium">
              Data collection and management platform
            </div>
          </MdListItem>

          <MdListItem>
            <MdIcon slot="start">palette</MdIcon>
            <div slot="headline" className="text-md-sys-typescale-body-large">
              Material Design 3
            </div>
            <div slot="supporting-text" className="text-md-sys-typescale-body-medium">
              Built with Google's latest design system
            </div>
          </MdListItem>
        </div>
      </MdFilledCard>
    </div>
  );
}
