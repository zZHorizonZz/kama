import { useEffect, useState } from "react";
import { Link } from "react-router";
import { client } from "~/lib/client";
import type { Collection, CollectionField, Rule } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollection, setNewCollection] = useState({
    displayName: "",
  });
  const [schemaText, setSchemaText] = useState<string>(`{
  "title": { "type": "string", "required": true },
  "createdAt": { "type": "timestamp" }
}`);
  const [rulesText, setRulesText] = useState<string>(
    "true // Everyone can read/write by default. Replace with CEL expressions, one per line",
  );

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.getCollectionService().listCollections({});
      setCollections(response.collections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  function mapTypeStringToField(type: string, required: boolean): CollectionField {
    const t = type.toLowerCase();
    if (t === "string") return { required, type: { case: "stringType", value: "" } };
    if (t === "integer" || t === "int" || t === "int64") return { required, type: { case: "integerType", value: 0n } };
    if (t === "bool" || t === "boolean") return { required, type: { case: "boolType", value: false } };
    if (t === "double" || t === "number" || t === "float") return { required, type: { case: "doubleType", value: 0 } };
    if (t === "timestamp" || t === "time" || t === "datetime")
      return { required, type: { case: "timestampType", value: { seconds: BigInt(0), nanos: 0 } as any } };
    if (t === "reference") return { required, type: { case: "referenceType", value: "" } };
    if (t === "bytes") return { required, type: { case: "bytesType", value: new Uint8Array() } };
    // Default to string
    return { required, type: { case: "stringType", value: "" } };
  }

  function parseSchema(jsonText: string): Record<string, CollectionField> {
    const obj = JSON.parse(jsonText || "{}");
    if (obj == null || typeof obj !== "object" || Array.isArray(obj)) {
      throw new Error("Schema must be a JSON object mapping field name to { type, required? }");
    }
    const fields: Record<string, CollectionField> = {};
    for (const [key, val] of Object.entries<any>(obj)) {
      if (!val || typeof val !== "object") throw new Error(`Field '${key}' must be an object`);
      const type = (val as any).type as string;
      const required = !!(val as any).required;
      if (!type) throw new Error(`Field '${key}' is missing 'type'`);
      fields[key] = mapTypeStringToField(type, required);
    }
    return fields;
  }

  function parseRules(text: string): Rule[] {
    const lines = (text || "").split(/\r?\n/).map((l) => l.trim());
    const expressions = lines.filter((l) => l.length > 0 && !l.startsWith("//"));
    return expressions.map((expression) => ({ expression }));
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse schema and rules
      const fields = parseSchema(schemaText);
      const rules = parseRules(rulesText);

      await client.getCollectionService().createCollection({
        collection: {
          displayName: newCollection.displayName,
          fields,
          rules,
          id: "",
          name: "",
          createTime: undefined,
          updateTime: undefined,
        },
      });
      setShowCreateForm(false);
      setNewCollection({ displayName: "" });
      setSchemaText('{\n  "title": { "type": "string", "required": true },\n  "createdAt": { "type": "timestamp" }\n}');
      setRulesText("true // Everyone can read/write by default. Replace with CEL expressions, one per line");
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">Collections</h1>
          <p className="text-gray-600">Manage your data collections</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          New Collection
        </button>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      {showCreateForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-medium text-lg">Create New Collection</h3>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">Display Name</label>
              <input
                type="text"
                value={newCollection.displayName}
                onChange={(e) => setNewCollection({ ...newCollection, displayName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">Schema (JSON)</label>
              <p className="mb-2 text-gray-500 text-xs">
                Define fields like Firebase: {`{ "field": { "type": "string", "required": true } }`}
              </p>
              <textarea
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                rows={8}
                className="font-mono w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-gray-700 text-sm">Rules (CEL Expressions)</label>
              <p className="mb-2 text-gray-500 text-xs">
                One expression per line, // comments allowed. Examples: user.roles.exists(r, r == 'admin')
              </p>
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={5}
                className="font-mono w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
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
          <p className="mt-2 text-gray-600">Loading collections...</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 text-4xl text-gray-400">📁</div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg">No collections yet</h3>
          <p className="text-gray-600">Create your first collection to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 font-medium text-gray-900 text-lg">
                    {collection.displayName || collection.name}
                  </h3>
                  <p className="mb-3 text-gray-600 text-sm">ID: {collection.id}</p>
                  <div className="flex space-x-2">
                    <Link
                      to={`/collections/${collection.id}`}
                      className="rounded bg-blue-50 px-3 py-1 font-medium text-blue-700 text-sm hover:bg-blue-100"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/collections/${collection.id}/records`}
                      className="rounded bg-green-50 px-3 py-1 font-medium text-green-700 text-sm hover:bg-green-100"
                    >
                      View Records
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
