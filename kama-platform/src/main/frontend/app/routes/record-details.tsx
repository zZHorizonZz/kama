import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { client } from "~/lib/client";
import type { Record } from "~/client/dev/cloudeko/kama/record/v1/resources_pb";
import type { JsonObject } from "@bufbuild/protobuf";

export default function RecordDetails() {
  const { collectionId, recordId } = useParams();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<JsonObject>({});

  useEffect(() => {
    if (collectionId && recordId) {
      loadRecord();
    }
  }, [collectionId, recordId]);

  const loadRecord = async () => {
    if (!collectionId || !recordId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await client.getRecordService().getRecord({
        name: `collections/${collectionId}/records/${recordId}`,
      });
      setRecord(response);
      setEditData(response.values || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId || !recordId || !record) return;

    try {
      const updatedRecord = await client.getRecordService().updateRecord({
        record: {
          ...record,
          values: editData,
        },
        updateMask: "values",
      });
      setRecord(updatedRecord);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update record");
    }
  };

  const handleDeleteRecord = async () => {
    if (!collectionId || !recordId || !confirm("Are you sure you want to delete this record?")) return;

    try {
      await client.getRecordService().deleteRecord({
        name: `collections/${collectionId}/records/${recordId}`,
      });
      window.location.href = `/collections/${collectionId}/records`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record");
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <p className="mt-2 text-gray-600">Loading record...</p>
      </div>
    );
  }

  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>;
  }

  if (!record) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-semibold text-gray-900 text-xl">Record not found</h2>
        <Link to={`/collections/${collectionId}/records`} className="text-blue-600 hover:text-blue-800">
          Back to Records
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center space-x-3 text-sm">
            <Link to="/collections" className="text-blue-600 hover:text-blue-800">
              Collections
            </Link>
            <span className="text-gray-400">/</span>
            <Link to={`/collections/${collectionId}`} className="text-blue-600 hover:text-blue-800">
              Collection
            </Link>
            <span className="text-gray-400">/</span>
            <Link to={`/collections/${collectionId}/records`} className="text-blue-600 hover:text-blue-800">
              Records
            </Link>
          </div>
          <h1 className="font-bold text-2xl text-gray-900">Record Details</h1>
          <p className="text-gray-600">ID: {record.id}</p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setEditData(record.values || {});
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleDeleteRecord}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">Record Info</h3>
          <dl className="space-y-3">
            <div>
              <dt className="font-medium text-gray-500 text-sm">Name</dt>
              <dd className="text-gray-900 text-sm">{record.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 text-sm">ID</dt>
              <dd className="font-mono text-gray-900 text-sm">{record.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500 text-sm">Collection</dt>
              <dd className="text-gray-900 text-sm">{record.collection}</dd>
            </div>
            {record.createTime && (
              <div>
                <dt className="font-medium text-gray-500 text-sm">Created</dt>
                <dd className="text-gray-900 text-sm">
                  {record.createTime.toString() || record.createTime.toString()}
                </dd>
              </div>
            )}
            {record.updateTime && (
              <div>
                <dt className="font-medium text-gray-500 text-sm">Updated</dt>
                <dd className="text-gray-900 text-sm">
                  {record.updateTime.toString() || record.updateTime.toString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 font-medium text-gray-900 text-lg">Record Data</h3>
          {isEditing ? (
            <form onSubmit={handleUpdateRecord}>
              <div className="mb-4">
                <label className="mb-2 block font-medium text-gray-700 text-sm">Data (JSON)</label>
                <textarea
                  value={JSON.stringify(editData, null, 2)}
                  onChange={(e) => {
                    try {
                      setEditData(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, keep the current value
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={12}
                />
              </div>
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Save Changes
              </button>
            </form>
          ) : (
            <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
              {JSON.stringify(record.values, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
