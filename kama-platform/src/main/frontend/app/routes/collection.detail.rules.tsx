import { useOutletContext, useParams } from "react-router";
import type { Collection } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { MdFilledCard, MdIcon, MdOutlinedButton, MdOutlinedIconButton } from "react-material-web";

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
    <div>
      <MdFilledCard>
        <div className="flex w-full items-center justify-between p-4">
          <p className="text-md-sys-typescale-title-large">Validation Rules</p>
          <MdOutlinedButton>
            <MdIcon slot="icon">add</MdIcon>
            Add Rule
          </MdOutlinedButton>
        </div>
        <div className="p-4">
          {collection.rules.length === 0 ? (
            <p className="py-8 text-center text-gray-500 text-sm">No rules defined</p>
          ) : (
            <div className="space-y-4">
              {collection.rules.map((rule, index) => (
                <div
                  key={index}
                  className="rounded-md-sys-shape-corner-md border border-md-sys-color-outline bg-md-sys-color-surface-container-low p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-md bg-md-sys-color-primary-container px-2 py-1 font-medium text-md-sys-color-on-primary-container text-sm">
                          Rule {index + 1}
                        </span>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md-sys-shape-corner-sm bg-md-sys-color-surface-container p-3 font-mono text-md-sys-color-on-surface text-sm">
                        {rule.expression}
                      </pre>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <MdOutlinedIconButton>
                        <MdIcon>edit</MdIcon>
                      </MdOutlinedIconButton>
                      <MdOutlinedIconButton>
                        <MdIcon>delete</MdIcon>
                      </MdOutlinedIconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MdFilledCard>
    </div>
  );
}
