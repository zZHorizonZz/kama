import { Link, useOutletContext, useParams } from "react-router";
import type { Collection } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { MdFilledCard, MdIcon, MdListItem } from "react-material-web";

type OutletContext = {
  collection: Collection;
  setCollection: (collection: Collection) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

export default function Page() {
  const { collectionId } = useParams();
  const { collection } = useOutletContext<OutletContext>();

  return (
    <div className="max-w-2xl">
      <MdFilledCard>
        <div className="flex w-full items-center justify-center p-4">
          <p className="text-md-sys-typescale-title-large">Collection Info</p>
        </div>
        <div className="p-1">
          <div className="overflow-hidden rounded-md-sys-shape-corner-md bg-md-sys-color-surface-container-low">
            <MdListItem>
              <div slot="headline">Name</div>
              <div slot="supporting-text">{collection.name}</div>
            </MdListItem>
            <MdListItem>
              <div slot="headline">Display Name</div>
              <div slot="supporting-text">{collection.displayName || "—"}</div>
            </MdListItem>
            <MdListItem>
              <div slot="headline">ID</div>
              <div slot="supporting-text">{collection.id}</div>
            </MdListItem>
            {collection.createTime && (
              <MdListItem>
                <div slot="headline">Created</div>
                <div slot="supporting-text">{collection.createTime.toString()}</div>
              </MdListItem>
            )}
            {collection.updateTime && (
              <MdListItem>
                <div slot="headline">Updated</div>
                <div slot="supporting-text">{collection.updateTime.toString()}</div>
              </MdListItem>
            )}
          </div>
        </div>
      </MdFilledCard>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link to={`/collections/${collectionId}/schema`} className="block">
          <MdFilledCard className="cursor-pointer transition-shadow hover:shadow-lg">
            <div className="p-6 text-center">
              <MdIcon className="mb-2 text-4xl text-md-sys-color-primary">schema</MdIcon>
              <h3 className="mb-2 text-md-sys-typescale-title-medium">Schema</h3>
              <p className="text-md-sys-color-on-surface-variant text-sm">
                {Object.keys(collection.fields).length} field{Object.keys(collection.fields).length !== 1 ? "s" : ""}
              </p>
            </div>
          </MdFilledCard>
        </Link>

        <Link to={`/collections/${collectionId}/rules`} className="block">
          <MdFilledCard className="cursor-pointer transition-shadow hover:shadow-lg">
            <div className="p-6 text-center">
              <MdIcon className="mb-2 text-4xl text-md-sys-color-primary">rule</MdIcon>
              <h3 className="mb-2 text-md-sys-typescale-title-medium">Rules</h3>
              <p className="text-md-sys-color-on-surface-variant text-sm">
                {collection.rules.length} rule{collection.rules.length !== 1 ? "s" : ""}
              </p>
            </div>
          </MdFilledCard>
        </Link>
      </div>
    </div>
  );
}
