import {Link, useParams} from "react-router";
import { client } from "~/lib/client";
import {
  MdFilledCard,
  MdIcon,
  MdListItem,
  MdOutlinedButton,
  MdFilledTonalButton,
  MdTextButton,
} from "react-material-web";
import type { Route } from "../../.react-router/types/app/routes/+types/user.detail";
import {timestampDate} from "@bufbuild/protobuf/wkt";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { userId } = params;
  return await client.getIdentityService().getUser({ name: `users/${userId}` });
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { userId } = useParams();
  const user = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <div className="container flex w-full flex-row items-center justify-between pb-8">
          <div className="flex items-center">
              <Link to="/users">
                  <MdTextButton>
                      <MdIcon slot="icon">people</MdIcon>
                      Users
                  </MdTextButton>
              </Link>
              <MdIcon>chevron_forward</MdIcon>
              <MdTextButton disabled>{user.displayName}</MdTextButton>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="border-md-sys-color-primary border-l-4 pl-6">
            <MdListItem>
              <h1 slot="headline" className="text-md-sys-typescale-display-small">
                {user.displayName || user.email}
              </h1>
              <p slot="supporting-text">User account information and settings</p>
            </MdListItem>
          </div>
          <div className="flex gap-2">
            <MdOutlinedButton>
              <MdIcon slot="icon">edit</MdIcon>
              Edit User
            </MdOutlinedButton>
            <MdFilledTonalButton>
              <MdIcon slot="icon">key</MdIcon>
              Change Password
            </MdFilledTonalButton>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <MdFilledCard>
          <div className="flex w-full items-center justify-center p-4">
            <p className="text-md-sys-typescale-title-large">User Information</p>
          </div>
          <div className="p-1">
            <div className="overflow-hidden rounded-md-sys-shape-corner-md bg-md-sys-color-surface-container-low">
              <MdListItem>
                <div slot="headline">User ID</div>
                <div slot="supporting-text">{user.id}</div>
              </MdListItem>
              <MdListItem>
                <div slot="headline">Email</div>
                <div slot="supporting-text">{user.email}</div>
              </MdListItem>
              <MdListItem>
                <div slot="headline">Display Name</div>
                <div slot="supporting-text">{user.displayName || "—"}</div>
              </MdListItem>
              <MdListItem>
                <div slot="headline">Email Verified</div>
                <div slot="supporting-text">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm ${
                    user.emailVerified 
                      ? "bg-md-sys-color-tertiary-container text-md-sys-color-on-tertiary-container"
                      : "bg-md-sys-color-error-container text-md-sys-color-on-error-container"
                  }`}>
                    <MdIcon className="mr-1 text-sm">
                      {user.emailVerified ? "verified" : "error"}
                    </MdIcon>
                    {user.emailVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
              </MdListItem>
              <MdListItem>
                <div slot="headline">Status</div>
                <div slot="supporting-text">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm ${
                    user.active 
                      ? "bg-md-sys-color-tertiary-container text-md-sys-color-on-tertiary-container"
                      : "bg-md-sys-color-error-container text-md-sys-color-on-error-container"
                  }`}>
                    <MdIcon className="mr-1 text-sm">
                      {user.active ? "check_circle" : "cancel"}
                    </MdIcon>
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </MdListItem>
              {user.roles && user.roles.length > 0 && (
                <MdListItem>
                  <div slot="headline">Roles</div>
                  <div slot="supporting-text">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, index) => (
                        <span key={index} className="inline-flex items-center rounded-md bg-md-sys-color-primary-container px-2 py-1 text-md-sys-color-on-primary-container text-sm">
                          <MdIcon className="mr-1 text-sm">security</MdIcon>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </MdListItem>
              )}
              {user.createTime && (
                <MdListItem>
                  <div slot="headline">Created</div>
                  <div slot="supporting-text">{timestampDate(user.createTime).toString()}</div>
                </MdListItem>
              )}
              {user.updateTime && (
                <MdListItem>
                  <div slot="headline">Last Updated</div>
                  <div slot="supporting-text">{timestampDate(user.updateTime).toString()}</div>
                </MdListItem>
              )}
            </div>
          </div>
        </MdFilledCard>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <MdFilledCard className="cursor-pointer transition-shadow hover:shadow-lg">
            <div className="p-6 text-center">
              <MdIcon className="mb-2 text-4xl text-md-sys-color-primary">security</MdIcon>
              <h3 className="mb-2 text-md-sys-typescale-title-medium">Security</h3>
              <p className="text-md-sys-color-on-surface-variant text-sm mb-4">
                Manage authentication and security settings
              </p>
              <MdFilledTonalButton className="w-full">
                <MdIcon slot="icon">key</MdIcon>
                Change Password
              </MdFilledTonalButton>
            </div>
          </MdFilledCard>

          <MdFilledCard className="cursor-pointer transition-shadow hover:shadow-lg">
            <div className="p-6 text-center">
              <MdIcon className="mb-2 text-4xl text-md-sys-color-primary">admin_panel_settings</MdIcon>
              <h3 className="mb-2 text-md-sys-typescale-title-medium">Permissions</h3>
              <p className="text-md-sys-color-on-surface-variant text-sm mb-4">
                {user.roles?.length || 0} role{(user.roles?.length || 0) !== 1 ? "s" : ""} assigned
              </p>
              <MdFilledTonalButton className="w-full">
                <MdIcon slot="icon">group</MdIcon>
                Manage Roles
              </MdFilledTonalButton>
            </div>
          </MdFilledCard>
        </div>
      </div>
    </div>
  );
}