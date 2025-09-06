import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { client } from "~/lib/client";
import {
  MdFilledButton,
  MdFilledCard,
  MdIcon,
  MdOutlinedButton,
  MdOutlinedTextField,
  MdSwitch,
  MdTextButton,
} from "react-material-web";

export default function Page() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.getIdentityService().createUser({
        email: email.trim(),
        password: password,
        displayName: displayName.trim() || undefined,
      });

      // Navigate to user detail page or users list
      navigate(`/users`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="container flex w-full flex-row items-center justify-between pb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Link to="/users">
              <MdTextButton>
                <MdIcon slot="icon">people</MdIcon>
                Users
              </MdTextButton>
            </Link>
            <MdIcon>chevron_forward</MdIcon>
            <MdTextButton disabled>New</MdTextButton>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-md-sys-color-on-surface text-md-sys-typescale-display-medium">New User</h1>
        <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
          Create a new user account with email and password
        </p>
      </div>

      {error && (
        <div className="rounded-md-sys-shape-corner-md border border-md-sys-color-error bg-md-sys-color-error-container px-4 py-3 text-md-sys-color-on-error-container">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information */}
        <MdFilledCard>
          <div className="flex w-full items-center justify-center p-4">
            <p className="text-md-sys-typescale-title-large">User Information</p>
          </div>
          <div className="space-y-4 p-4">
            <MdOutlinedTextField
              type="email"
              label="Email Address"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement)?.value || "")}
              supporting-text="User will use this email to sign in"
              required
            />
            
            <MdOutlinedTextField
              label="Display Name"
              value={displayName}
              onInput={(e) => setDisplayName((e.target as HTMLInputElement)?.value || "")}
              supporting-text="Optional - friendly name for the user"
            />
          </div>
        </MdFilledCard>

        {/* Password Settings */}
        <MdFilledCard>
          <div className="flex w-full items-center justify-center p-4">
            <p className="text-md-sys-typescale-title-large">Password</p>
          </div>
          <div className="space-y-4 p-4">
            <MdOutlinedTextField
              type="password"
              label="Password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement)?.value || "")}
              supporting-text="Choose a strong password"
              required
            />
            
            <MdOutlinedTextField
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onInput={(e) => setConfirmPassword((e.target as HTMLInputElement)?.value || "")}
              supporting-text="Re-enter the password to confirm"
              required
            />
          </div>
        </MdFilledCard>

        {/* Actions */}
        <div className="flex space-x-4">
          <MdFilledButton type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </MdFilledButton>
          <Link to="/users">
            <MdOutlinedButton disabled={loading}>Cancel</MdOutlinedButton>
          </Link>
        </div>
      </form>
    </div>
  );
}