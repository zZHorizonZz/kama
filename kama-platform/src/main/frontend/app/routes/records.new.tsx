import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { client } from "~/lib/client";
import type { JsonObject } from "@bufbuild/protobuf";
import type { Collection, CollectionField } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import {
  MdFilledButton,
  MdFilledCard,
  MdIcon,
  MdOutlinedButton,
  MdOutlinedTextField,
  MdSwitch,
  MdTextButton,
} from "react-material-web";
import type { Route } from "../../.react-router/types/app/routes/+types/records.new";

function toLocalDatetimeInput(rfc3339: string): string {
  try {
    const d = new Date(rfc3339);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function fromLocalDatetimeInput(local: string): string {
  if (!local) return "";
  try {
    const d = new Date(local);
    return d.toISOString();
  } catch {
    return local;
  }
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { collectionId } = params;

  return await client.getCollectionService().getCollection({
    name: `collections/${collectionId}`,
  });
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { collectionId } = useParams();

  const collection = loaderData;

  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newRecord, setNewRecord] = useState<JsonObject>({});

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
      case "identifierType":
      case "stringType":
      case "referenceType":
        return "";
      case "integerType":
      case "doubleType":
        return 0;
      case "boolType":
        return false;
      case "timestampType":
        return "";
      case "bytesType":
        return "";
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

  const getFieldTypeDisplayName = (type: string): string => {
    switch (type) {
      case "identifierType":
        return "Identifier";
      case "stringType":
        return "String";
      case "integerType":
        return "Integer";
      case "boolType":
        return "Boolean";
      case "doubleType":
        return "Double";
      case "timestampType":
        return "Timestamp";
      case "referenceType":
        return "Reference";
      case "bytesType":
        return "Bytes";
      case "arrayType":
        return "Array";
      case "mapType":
        return "Map";
      default:
        return type;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await client.getRecordService().createRecord({
        parent: `collections/${collectionId}`,
        record: {
          id: "",
          name: "",
          collection: `collections/${collectionId}`,
          values: newRecord,
          createTime: undefined,
          updateTime: undefined,
        },
      });
      navigate(`/collections/${collectionId}/records/${response.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create record");
    } finally {
      setLoading(false);
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
          <Link to={`/collections/${collectionId}/records`}>
            <MdTextButton>Records</MdTextButton>
          </Link>
          <MdIcon>chevron_forward</MdIcon>
          <MdTextButton disabled>New</MdTextButton>
        </div>
      </div>

      <div className="border-md-sys-color-primary border-l-4 pl-6">
        <h1 className="text-md-sys-color-on-surface text-md-sys-typescale-display-small">New Record</h1>
        <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
          Create a new record in {collection?.displayName || collection?.name || collectionId}
        </p>
      </div>

      {error && (
        <div className="rounded-md-sys-shape-corner-md border border-md-sys-color-error bg-md-sys-color-error-container px-4 py-3 text-md-sys-color-on-error-container">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <MdFilledCard>
          <div className="flex w-full items-center justify-center p-4">
            <p className="text-md-sys-typescale-title-large">Record Data</p>
          </div>
          <div className="p-4">
            {collection && Object.keys(collection.fields).length > 0 && !hasComplexFields(collection.fields) ? (
              <div className="space-y-4">
                {Object.entries(collection.fields).map(([name, field]) => {
                  const kind = getFieldKind(field);
                  const required = !!field.required;
                  const system = field.system;
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-md-sys-color-on-surface text-md-sys-typescale-body-medium">
                          {name}
                          {required && <span className="text-md-sys-color-error"> *</span>}
                        </label>
                        <span className="inline-flex items-center rounded-md bg-md-sys-color-primary-container px-2 py-1 text-md-sys-color-on-primary-container text-xs">
                          {getFieldTypeDisplayName(kind || "")}
                        </span>
                      </div>

                      {kind === "identifierType" ||
                      kind === "stringType" ||
                      kind === "referenceType" ||
                      kind === "bytesType" ? (
                        <MdOutlinedTextField
                          label={name}
                          value={(newRecord as any)[name] ?? ""}
                          onInput={(e) =>
                            setNewRecord({
                              ...(newRecord as any),
                              [name]: (e.target as HTMLInputElement).value,
                            })
                          }
                          disabled={system}
                          required={required}
                        />
                      ) : kind === "integerType" ? (
                        <MdOutlinedTextField
                          label={name}
                          type="number"
                          value={String((newRecord as any)[name] ?? 0)}
                          onInput={(e) =>
                            setNewRecord({
                              ...(newRecord as any),
                              [name]: Number.parseInt((e.target as HTMLInputElement).value) || 0,
                            })
                          }
                          disabled={system}
                          required={required}
                        />
                      ) : kind === "doubleType" ? (
                        <MdOutlinedTextField
                          label={name}
                          type="number"
                          value={String((newRecord as any)[name] ?? 0)}
                          onInput={(e) =>
                            setNewRecord({
                              ...(newRecord as any),
                              [name]: Number.parseFloat((e.target as HTMLInputElement).value) || 0,
                            })
                          }
                          disabled={system}
                          required={required}
                        />
                      ) : kind === "boolType" ? (
                        <div className="flex items-center space-x-2">
                          <MdSwitch
                            selected={!!(newRecord as any)[name]}
                            onChange={(e) =>
                              setNewRecord({
                                ...(newRecord as any),
                                [name]: (e.target as any)?.selected || false,
                              })
                            }
                          />
                          <span className="text-md-sys-color-on-surface text-md-sys-typescale-body-medium">
                            {(newRecord as any)[name] ? "True" : "False"}
                          </span>
                        </div>
                      ) : kind === "timestampType" ? (
                        <MdOutlinedTextField
                          label={name}
                          type="datetime-local"
                          value={
                            (newRecord as any)[name] ? toLocalDatetimeInput((newRecord as any)[name] as string) : ""
                          }
                          disabled={system}
                          onInput={(e) =>
                            setNewRecord({
                              ...(newRecord as any),
                              [name]: fromLocalDatetimeInput((e.target as HTMLInputElement).value),
                            })
                          }
                          required={required}
                        />
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-md-sys-color-on-surface text-md-sys-typescale-body-small">
                            {name} (JSON)
                          </label>
                          <textarea
                            value={JSON.stringify((newRecord as any)[name] ?? null, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setNewRecord({ ...(newRecord as any), [name]: parsed });
                              } catch {
                                // ignore
                              }
                            }}
                            className="w-full rounded-md-sys-shape-corner-md border border-md-sys-color-outline bg-md-sys-color-surface px-3 py-2 font-mono text-md-sys-color-on-surface text-sm focus:border-md-sys-color-primary focus:outline-none"
                            rows={4}
                            placeholder={`Enter JSON for ${name}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-md-sys-color-on-surface text-md-sys-typescale-body-medium">
                  Record Data (JSON)
                </label>
                <textarea
                  value={JSON.stringify(newRecord, null, 2)}
                  onChange={(e) => {
                    try {
                      setNewRecord(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, keep the current value
                    }
                  }}
                  className="w-full rounded-md-sys-shape-corner-md border border-md-sys-color-outline bg-md-sys-color-surface px-3 py-2 font-mono text-md-sys-color-on-surface text-sm focus:border-md-sys-color-primary focus:outline-none"
                  rows={10}
                  placeholder='{"key": "value"}'
                />
              </div>
            )}
          </div>
        </MdFilledCard>

        <div className="flex space-x-4">
          <MdFilledButton type="submit">Create Record</MdFilledButton>
          <Link to={`/collections/${collectionId}/records`}>
            <MdOutlinedButton>Cancel</MdOutlinedButton>
          </Link>
        </div>
      </form>
    </div>
  );
}
