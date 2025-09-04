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
import type { Route } from "../../.react-router/types/app/routes/+types/collections";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  return await client.getCollectionService().listCollections({});
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <div className="container flex w-full flex-row items-center justify-between pb-8">
          <div className="flex items-center">
            <MdTextButton disabled>
              <MdIcon slot="icon">apps</MdIcon>
              Collections
            </MdTextButton>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="border-md-sys-color-primary border-l-4 pl-6">
            <MdListItem>
              <h1 slot="headline" className="text-md-sys-typescale-display-small">
                Collections
              </h1>
              <p slot="supporting-text"> Manage your data collections</p>
            </MdListItem>
          </div>
          <Link to="/collections/new">
            <MdOutlinedButton>
              <MdIcon slot="icon">add</MdIcon>
              New Collection
            </MdOutlinedButton>
          </Link>
        </div>
      </div>
      {collections.length === 0 ? (
        <div className="py-12 text-center">
          <MdIcon className="mb-4 text-6xl text-md-sys-color-on-surface-variant">folder</MdIcon>
          <h3 className="mb-2 text-md-sys-color-on-surface text-md-sys-typescale-title-large">No collections yet</h3>
          <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
            Create your first collection to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link to={`/collections/${collection.id}`}>
              <MdFilledCard key={collection.id} className="relative overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-md-sys-color-on-surface text-md-sys-typescale-title-large">
                        {collection.displayName || collection.name}
                      </h3>
                      <p className="mb-4 text-md-sys-color-on-surface-variant text-md-sys-typescale-body-small">
                        {Object.keys(collection.fields).length} field
                        {Object.keys(collection.fields).length !== 1 ? "s" : ""} • {collection.rules.length} rule
                        {collection.rules.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <Link to={`/collections/${collection.id}/records`} className="w-full">
                          <MdFilledTonalButton className="w-full">
                            <MdIcon slot="icon">table_rows</MdIcon>
                            View Records
                          </MdFilledTonalButton>
                        </Link>
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
