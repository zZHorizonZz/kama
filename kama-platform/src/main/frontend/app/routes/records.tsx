import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { client } from "~/lib/client";
import type { Record } from "~/client/dev/cloudeko/kama/record/v1/resources_pb";
import type { JsonObject } from "@bufbuild/protobuf";
import type { Collection, CollectionField } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";

function toLocalDatetimeInput(rfc3339: string): string {
  try {
    const d = new Date(rfc3339);
    if (isNaN(d.getTime())) return "";
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

export default function Records() {
  const { collectionId } = useParams();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRecord, setNewRecord] = useState<JsonObject>({});
  const [collection, setCollection] = useState<Collection | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  useEffect(() => {
    if (collectionId) {
      loadRecords();
      loadCollectionSchema();
    }
  }, [collectionId]);

  const loadCollectionSchema = async () => {
    if (!collectionId) return;
    try {
      setSchemaLoading(true);
      const res = await client.getCollectionService().getCollection({ name: `collections/${collectionId}` });
      setCollection(res);
    } catch (err) {
      // do not block, just set error banner
      setError(err instanceof Error ? err.message : "Failed to load collection schema");
    } finally {
      setSchemaLoading(false);
    }
  };

  const loadRecords = async () => {
    if (!collectionId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await client.getRecordService().listRecords({
        parent: `collections/${collectionId}`,
      });
      setRecords(response.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId) return;

    try {
      await client.getRecordService().createRecord({
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
      setShowCreateForm(false);
      setNewRecord({});
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create record");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      await client.getRecordService().deleteRecord({
        name: `collections/${collectionId}/records/${recordId}`,
      });
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center space-x-3">
            <Link to="/collections" className="text-blue-600 text-sm hover:text-blue-800">
              ← Collections
            </Link>
            <span className="text-gray-400">/</span>
            <Link to={`/collections/${collectionId}`} className="text-blue-600 text-sm hover:text-blue-800">
              Collection Details
            </Link>
          </div>
          <h1 className="font-bold text-2xl text-gray-900">Records</h1>
          <p className="text-gray-600">Collection: {collectionId}</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setNewRecord(buildDefaultsFromSchema(collection));
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Create Record
        </button>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      {showCreateForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-medium text-lg">Create New Record</h3>
          <form onSubmit={handleCreateRecord} className="space-y-4">
            {schemaLoading ? (
              <div className="text-sm text-gray-600">Loading schema...</div>
            ) : collection && Object.keys(collection.fields).length > 0 && !hasComplexFields(collection.fields) ? (
              <div className="space-y-4">
                {Object.entries(collection.fields).map(([name, field]) => {
                  const kind = getFieldKind(field);
                  const required = !!field.required;
                  return (
                    <div key={name}>
                      <label className="mb-1 block font-medium text-gray-700 text-sm">
                        {name}
                        {required && <span className="text-red-600"> *</span>}
                      </label>
                      {kind === "stringType" || kind === "referenceType" || kind === "bytesType" ? (
                        <input
                          type="text"
                          value={(newRecord as any)[name] ?? ""}
                          onChange={(e) => setNewRecord({ ...(newRecord as any), [name]: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : kind === "integerType" || kind === "doubleType" ? (
                        <input
                          type="number"
                          value={(newRecord as any)[name] ?? 0}
                          onChange={(e) => setNewRecord({ ...(newRecord as any), [name]: e.target.valueAsNumber })}
                          step={kind === "doubleType" ? "any" : 1}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : kind === "boolType" ? (
                        <input
                          type="checkbox"
                          checked={!!(newRecord as any)[name]}
                          onChange={(e) => setNewRecord({ ...(newRecord as any), [name]: e.target.checked })}
                          className="h-4 w-4"
                        />
                      ) : kind === "timestampType" ? (
                        <input
                          type="datetime-local"
                          value={
                            (newRecord as any)[name] ? toLocalDatetimeInput((newRecord as any)[name] as string) : ""
                          }
                          onChange={(e) =>
                            setNewRecord({ ...(newRecord as any), [name]: fromLocalDatetimeInput(e.target.value) })
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
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
                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                      )}
                      <p className="mt-1 text-xs text-gray-500">Type: {kind?.replace(/Type$/, "")}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="mb-1 block font-medium text-gray-700 text-sm">Record Data (JSON)</label>
                <textarea
                  value={JSON.stringify(newRecord, null, 2)}
                  onChange={(e) => {
                    try {
                      setNewRecord(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, keep the current value
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  placeholder='{"key": "value"}'
                />
              </div>
            )}
            <div className="flex space-x-3">
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewRecord({});
                }}
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="mt-2 text-gray-600">Loading records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-4xl text-gray-400">📄</div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg">No records yet</h3>
          <p className="text-gray-600">Create your first record to get started</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-900 text-sm">{record.id}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">
                      <pre className="max-w-md overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                        {JSON.stringify(record.values, null, 2)}
                      </pre>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                      {record.createTime ? record.createTime.toString() || record.createTime.toString() : "—"}
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-6 py-4 text-right font-medium text-sm">
                      <Link
                        to={`/collections/${collectionId}/records/${record.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <button onClick={() => handleDeleteRecord(record.id)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
