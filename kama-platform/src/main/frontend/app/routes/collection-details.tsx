import {useEffect, useState} from "react";
import {Link, useParams} from "react-router";
import {client} from "~/lib/client";
import type {Collection} from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import {
    MdFilledCard,
    MdIcon,
    MdListItem,
    MdOutlinedButton,
    MdOutlinedIconButton,
    MdOutlinedSelect,
    MdOutlinedTextField,
    MdRipple,
    MdSelectOption,
    MdSwitch,
} from "react-material-web";

export default function CollectionDetails() {
    const {collectionId} = useParams();
    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (collectionId) {
            loadCollection();
        }
    }, [collectionId]);

    const loadCollection = async () => {
        if (!collectionId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await client.getCollectionService().getCollection({
                name: `collections/${collectionId}`,
            });
            setCollection(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load collection");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCollection = async () => {
        if (!collectionId || !confirm("Are you sure you want to delete this collection?")) return;

        try {
            await client.getCollectionService().deleteCollection({
                name: `collections/${collectionId}`,
            });
            window.location.href = "/collections";
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete collection");
        }
    };

    if (loading) {
        return (
            <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"/>
                <p className="mt-2 text-gray-600">Loading collection...</p>
            </div>
        );
    }

    if (error) {
        return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>;
    }

    if (!collection) {
        return (
            <div className="py-12 text-center">
                <h2 className="font-semibold text-gray-900 text-xl">Collection not found</h2>
                <Link to="/collections" className="text-blue-600 hover:text-blue-800">
                    Back to Collections
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full">
            <div className="flex flex-col">
                <div className="container py-8 w-full flex flex-row justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm">
                        <Link to="/collections" className="flex items-center text-gray-400 hover:text-lime-900">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                className="lucide lucide-arrow-left h-4 w-4 mr-2"
                            >
                                <path d="m12 19-7-7 7-7"></path>
                                <path d="M19 12H5"></path>
                            </svg>
                            Collections
                        </Link>
                        <span className="text-gray-600">/</span>
                        <span
                            data-slot="badge"
                            className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground border-lime-700 bg-lime-100 text-lime-600"
                        >
              {collection.displayName || collection.name}
            </span>
                    </div>
                    <div className="flex space-x-3">
                        <Link to={`/collections/${collectionId}/records`}>
                            <MdOutlinedButton>View Records</MdOutlinedButton>
                        </Link>
                        <button
                            onClick={handleDeleteCollection}
                            className="relative rounded-full cursor-pointer px-6 py-2 text-md-sys-typescale-label-large bg-md-sys-color-error text-md-sys-color-on-error transition-colors duration-300"
                        >
                            Delete
                            <MdRipple/>
                        </button>
                    </div>
                </div>
                <div className="border-l-4 border-md-sys-color-primary pl-6">
                    <h1 className="text-md-sys-typescale-display-small text-gray-900">
                        {collection.displayName || collection.name}
                    </h1>
                    <p className="text-gray-600">{collection.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MdFilledCard>
                    <div className="flex items-center justify-center w-full p-4">
                        <p className="text-md-sys-typescale-title-large">Collection Info</p>
                    </div>
                    <div className="p-1">
                        <div
                            className=" overflow-hidden rounded-md-sys-shape-corner-md bg-md-sys-color-surface-container-low">
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
                                <div>
                                    <dt className="font-medium text-gray-500 text-sm">Created</dt>
                                    <dd className="text-gray-900 text-sm">
                                        {collection.createTime.toString() || collection.createTime.toString()}
                                    </dd>
                                </div>
                            )}
                            {collection.updateTime && (
                                <div>
                                    <dt className="font-medium text-gray-500 text-sm">Updated</dt>
                                    <dd className="text-gray-900 text-sm">
                                        {collection.updateTime.toString() || collection.updateTime.toString()}
                                    </dd>
                                </div>
                            )}
                        </div>
                    </div>
                </MdFilledCard>
            </div>

            <MdFilledCard>
                <div className="flex items-center justify-center w-full p-4">
                    <p className="text-md-sys-typescale-title-large">Schema</p>
                </div>
                <div className="p-1">
                    {Object.keys(collection.fields).length === 0 ? (
                        <p className="text-gray-500 text-sm">No fields defined</p>
                    ) : (
                        <ul className="space-y-0.5" role="list">
                            {Object.entries(collection.fields).map(([fieldName, fieldDef]) => (
                                <li key={fieldName}
                                    className="flex items-center justify-between gap-2 bg-md-sys-color-surface-container-low p-2 rounded-md-sys-shape-corner-sm first:rounded-md-sys-shape-corner-t-xl last:rounded-md-sys-shape-corner-b-xl">
                                    <div className="flex items-center space-x-2">
                                        <MdOutlinedTextField>{fieldName}</MdOutlinedTextField>
                                        <MdOutlinedSelect>
                                            <MdSelectOption value={fieldDef.type.case}>
                                                <div slot="headline">{fieldDef.type.case}</div>
                                            </MdSelectOption>
                                        </MdOutlinedSelect>
                                    </div>
                                    <div slot="end" className="flex items-center space-x-2">
                                        <label>
                                            Required
                                            <MdSwitch selected={fieldDef.required}/>
                                        </label>
                                        <MdOutlinedIconButton>
                                            <MdIcon>delete</MdIcon>
                                        </MdOutlinedIconButton>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <MdOutlinedButton className="mx-auto my-4">
                    <MdIcon slot="icon">add</MdIcon>
                    Add Field
                </MdOutlinedButton>
            </MdFilledCard>

            <MdFilledCard>
                <h3 className="mb-4 font-medium text-gray-900 text-lg">Rules</h3>
                {collection.rules.length === 0 ? (
                    <p className="text-gray-500 text-sm">No rules defined</p>
                ) : (
                    <div className="space-y-3">
                        {collection.rules.map((rule, index) => (
                            <div key={index} className="rounded border p-3">
                                <p className="font-mono text-sm">{rule.expression}</p>
                            </div>
                        ))}
                    </div>
                )}
            </MdFilledCard>
        </div>
    );
}
