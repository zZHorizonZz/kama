import { Link } from "react-router";
import { client } from "~/lib/client";
import {
  MdFilledCard,
  MdFilledTonalButton,
  MdIcon,
  MdListItem,
  MdOutlinedButton,
  MdRipple,
  MdTextButton,
} from "react-material-web";
import type { Route } from "../../.react-router/types/app/routes/+types/users";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return await client.getIdentityService().listUsers({});
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <div className="container flex w-full flex-row items-center justify-between pb-8">
          <div className="flex items-center">
            <MdTextButton disabled>
              <MdIcon slot="icon">people</MdIcon>
              Users
            </MdTextButton>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="border-md-sys-color-primary border-l-4 pl-6">
            <MdListItem>
              <h1 slot="headline" className="text-md-sys-typescale-display-small">
                Users
              </h1>
              <p slot="supporting-text">Manage user accounts and identities</p>
            </MdListItem>
          </div>
          <Link to="/users/new">
            <MdOutlinedButton>
              <MdIcon slot="icon">person_add</MdIcon>
              New User
            </MdOutlinedButton>
          </Link>
        </div>
      </div>
      {users.length === 0 ? (
        <div className="py-12 text-center">
          <MdIcon className="mb-4 text-6xl text-md-sys-color-on-surface-variant">people</MdIcon>
          <h3 className="mb-2 text-md-sys-color-on-surface text-md-sys-typescale-title-large">No users yet</h3>
          <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
            Create your first user account to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Link to={`/users/${user.id}`} key={user.id}>
              <MdFilledCard className="relative overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-md-sys-color-on-surface text-md-sys-typescale-title-large">
                        {user.displayName || user.email}
                      </h3>
                      <p className="mb-2 text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
                        {user.email}
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm ${
                          user.active 
                            ? "bg-md-sys-color-tertiary-container text-md-sys-color-on-tertiary-container"
                            : "bg-md-sys-color-error-container text-md-sys-color-on-error-container"
                        }`}>
                          {user.active ? "Active" : "Inactive"}
                        </span>
                        {user.emailVerified && (
                          <span className="inline-flex items-center rounded-md bg-md-sys-color-primary-container px-2 py-1 text-md-sys-color-on-primary-container text-sm">
                            <MdIcon className="mr-1 text-sm">verified</MdIcon>
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <MdFilledTonalButton className="w-full">
                          <MdIcon slot="icon">person</MdIcon>
                          View Profile
                        </MdFilledTonalButton>
                      </div>
                    </div>
                  </div>
                </div>
                <MdRipple />
              </MdFilledCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}