import { useState } from "react";
import { Link, useParams } from "react-router";
import { client } from "~/lib/client";
import type { Record } from "~/client/dev/cloudeko/kama/record/v1/resources_pb";
import type { JsonObject } from "@bufbuild/protobuf";
import type { Collection, CollectionField } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { MdFilledCard, MdIcon, MdOutlinedButton, MdOutlinedIconButton, MdTextButton } from "react-material-web";
import type { Route } from "../../.react-router/types/app/routes/+types/records";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { collectionId } = params;

  const collection = await client.getCollectionService().getCollection({
    name: `collections/${collectionId}`,
  });

  const list = await client.getRecordService().listRecords({
    parent: `collections/${collectionId}`,
  });

  return { collection, list };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { collectionId } = useParams();

  const { collection, list } = loaderData;

  const [error, setError] = useState<string | null>(null);

  function getFieldKind(field: CollectionField): CollectionField["type"]["case"] | undefined {
    return field.type?.case as any;
  }

  function hasComplexFields(fields: Record<string, CollectionField>): boolean {
    return Object.values(fields).some((f) => {
      const k = getFieldKind(f);
      return k === "arrayType" || k === "mapType";
    });
  }

  function defaultValueForField(field: CollectionField): any {
    const k = getFieldKind(field);
    switch (k) {
      case "stringType":
      case "referenceType":
        return "";
      case "integerType":
      case "doubleType":
        return 0;
      case "boolType":
        return false;
      case "timestampType":
        // use RFC3339; empty by default
        return "";
      case "bytesType":
        return ""; // base64 string
      default:
        return null;
    }
  }

  function buildDefaultsFromSchema(col?: Collection | null): JsonObject {
    if (!col) return {};
    const out: any = {};
    for (const [name, field] of Object.entries(col.fields)) {
      out[name] = defaultValueForField(field);
    }
    return out;
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await client.getRecordService().deleteRecord({
        name: `collections/${collectionId}/records/${recordId}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  return (
    <div className="space-y-6">
      <div className="container flex w-full flex-row items-center justify-between pb-8">
        <div className="flex items-center">
          <Link to="/collections">
            <MdTextButton>
              <MdIcon slot="icon">apps</MdIcon>
              Collections
            </MdTextButton>
          </Link>
          <MdIcon>chevron_forward</MdIcon>
          <Link to={`/collections/${collectionId}`}>
            <MdTextButton>{collection.displayName || collection.name}</MdTextButton>
          </Link>
          <MdIcon>chevron_forward</MdIcon>
          <MdTextButton disabled>Records</MdTextButton>
        </div>
        <div className="flex space-x-3">
          <Link to={`/collections/${collectionId}/records/new`}>
            <MdOutlinedButton>
              <MdIcon slot="icon">add</MdIcon>
              New Record
            </MdOutlinedButton>
          </Link>
        </div>
      </div>

      <div className="border-md-sys-color-primary border-l-4 pl-6">
        <h1 className="text-md-sys-color-on-surface text-md-sys-typescale-display-small">Records</h1>
        <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
          {collection?.displayName || collection?.name || collectionId}
        </p>
      </div>

      {error && (
        <div className="rounded-md-sys-shape-corner-md border border-md-sys-color-error bg-md-sys-color-error-container px-4 py-3 text-md-sys-color-on-error-container">
          {error}
        </div>
      )}

      <MdFilledCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-md-sys-color-outline border-b">
                <th className="px-6 py-4 text-left text-md-sys-color-on-surface text-md-sys-typescale-title-medium">
                  ID
                </th>
                {collection && Object.keys(collection.fields).length > 0 && (
                  <>
                    {Object.entries(collection.fields)
                      .slice(0, 3)
                      .map(([fieldName]) => (
                        <th
                          key={fieldName}
                          className="px-6 py-4 text-left text-md-sys-color-on-surface text-md-sys-typescale-title-medium"
                        >
                          {fieldName}
                        </th>
                      ))}
                    {Object.keys(collection.fields).length > 3 && (
                      <th className="px-6 py-4 text-left text-md-sys-color-on-surface text-md-sys-typescale-title-medium">
                        More
                      </th>
                    )}
                  </>
                )}
                <th className="px-6 py-4 text-left text-md-sys-color-on-surface text-md-sys-typescale-title-medium">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-md-sys-color-on-surface text-md-sys-typescale-title-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {list.records.map((record, index) => (
                <tr key={record.id} className={index % 2 === 0 ? "bg-md-sys-color-surface-container-low" : ""}>
                  <td className="px-6 py-4 font-mono text-md-sys-color-on-surface text-sm">{record.id}</td>
                  {collection && Object.keys(collection.fields).length > 0 ? (
                    <>
                      {Object.entries(collection.fields)
                        .slice(0, 3)
                        .map(([fieldName, field]) => {
                          const value = (record.values as any)?.[fieldName];
                          const fieldType = field.type?.case;
                          return (
                            <td key={fieldName} className="max-w-48 px-6 py-4 text-md-sys-color-on-surface text-sm">
                              {fieldType === "boolType" ? (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                                    value
                                      ? "bg-md-sys-color-primary-container text-md-sys-color-on-primary-container"
                                      : "bg-md-sys-color-surface-container text-md-sys-color-on-surface"
                                  }`}
                                >
                                  {value ? "True" : "False"}
                                </span>
                              ) : fieldType === "timestampType" ? (
                                <span className="text-md-sys-color-on-surface-variant">
                                  {value ? new Date(value).toLocaleDateString() : "—"}
                                </span>
                              ) : (
                                <span className="block truncate" title={JSON.stringify(value)}>
                                  {value !== null && value !== undefined ? String(value) : "—"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      {Object.keys(collection.fields).length > 3 && (
                        <td className="px-6 py-4 text-md-sys-color-on-surface-variant text-sm">
                          +{Object.keys(collection.fields).length - 3} more
                        </td>
                      )}
                    </>
                  ) : (
                    <td className="px-6 py-4 text-md-sys-color-on-surface text-sm">
                      <pre className="max-w-md overflow-x-auto rounded-md-sys-shape-corner-md bg-md-sys-color-surface-container p-2 text-xs">
                        {JSON.stringify(record.values, null, 2)}
                      </pre>
                    </td>
                  )}
                  <td className="px-6 py-4 text-md-sys-color-on-surface-variant text-sm">
                    {record.createTime ? new Date(record.createTime.seconds * 1000).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link to={`/collections/${collectionId}/records/${record.id}`}>
                        <MdOutlinedIconButton>
                          <MdIcon>visibility</MdIcon>
                        </MdOutlinedIconButton>
                      </Link>
                      <MdOutlinedIconButton onClick={() => handleDeleteRecord(record.id)}>
                        <MdIcon>delete</MdIcon>
                      </MdOutlinedIconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MdFilledCard>
    </div>
  );
}
