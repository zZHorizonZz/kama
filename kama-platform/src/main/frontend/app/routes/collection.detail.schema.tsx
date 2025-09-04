import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { client } from "~/lib/client";
import type { Collection, CollectionField } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { CollectionFieldSchema, CollectionSchema } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { create } from "@bufbuild/protobuf";
import {
  MdDialog,
  MdFilledCard,
  MdIcon,
  MdOutlinedButton,
  MdOutlinedIconButton,
  MdOutlinedSelect,
  MdOutlinedTextField,
  MdSelectOption,
  MdSwitch,
  MdTextButton,
} from "react-material-web";

type OutletContext = {
  collection: Collection;
  setCollection: (collection: Collection) => void;
  error: string | null;
  setError: (error: string | null) => void;
};

export default function Page() {
  const { collectionId } = useParams();
  const { collection, setCollection, error, setError } = useOutletContext<OutletContext>();

  // Field editing state
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<{ name: string; field: CollectionField } | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: "",
    type: "stringType" as const,
    required: false,
    referenceCollection: "",
  });
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);

  useEffect(() => {
    loadAvailableCollections();
  }, []);

  const loadAvailableCollections = async () => {
    try {
      const response = await client.getCollectionService().listCollections({});
      setAvailableCollections(response.collections);
    } catch (err) {
      console.error("Failed to load available collections:", err);
    }
  };

  const openAddFieldDialog = () => {
    setEditingField(null);
    setFieldForm({
      name: "",
      type: "stringType",
      required: false,
      referenceCollection: "",
    });
    setShowFieldDialog(true);
  };

  const openEditFieldDialog = (fieldName: string, field: CollectionField) => {
    setEditingField({ name: fieldName, field });
    setFieldForm({
      name: fieldName,
      type: field.type.case as any,
      required: field.required,
      referenceCollection: field.type.case === "referenceType" ? (field.type.value as string) : "",
    });
    setShowFieldDialog(true);
  };

  const closeFieldDialog = () => {
    setShowFieldDialog(false);
    setEditingField(null);
    setFieldForm({
      name: "",
      type: "stringType",
      required: false,
      referenceCollection: "",
    });
  };

  const saveField = async () => {
    if (!collection || !fieldForm.name.trim()) return;
    if (fieldForm.type === "referenceType" && !fieldForm.referenceCollection) {
      setError("Reference collection is required when field type is Reference");
      return;
    }

    try {
      const updatedCollection = create(CollectionSchema, {
        ...collection,
        fields: {
          ...collection.fields,
          [fieldForm.name]: create(CollectionFieldSchema, {
            required: fieldForm.required,
            type: {
              case: fieldForm.type,
              value:
                fieldForm.type === "referenceType"
                  ? fieldForm.referenceCollection
                  : getDefaultValueForType(fieldForm.type),
            },
          }),
        },
      });

      // If editing an existing field and the name changed, remove the old field
      if (editingField && editingField.name !== fieldForm.name) {
        delete updatedCollection.fields[editingField.name];
      }

      const response = await client.getCollectionService().updateCollection({
        collection: updatedCollection,
        updateMask: "fields",
      });

      setCollection(response);
      closeFieldDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save field");
    }
  };

  const deleteField = async (fieldName: string) => {
    if (!collection || !confirm(`Are you sure you want to delete the field "${fieldName}"?`)) return;

    try {
      const updatedFields = { ...collection.fields };
      delete updatedFields[fieldName];

      const updatedCollection = create(CollectionSchema, {
        ...collection,
        fields: updatedFields,
      });

      const response = await client.getCollectionService().updateCollection({
        collection: updatedCollection,
        updateMask: "fields",
      });

      setCollection(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete field");
    }
  };

  const getDefaultValueForType = (type: string): any => {
    switch (type) {
      case "stringType":
      case "referenceType":
        return "";
      case "integerType":
        return 0n;
      case "boolType":
        return false;
      case "doubleType":
        return 0.0;
      case "timestampType":
        return { seconds: 0n, nanos: 0 };
      case "bytesType":
        return new Uint8Array();
      case "arrayType":
        return { values: [] };
      case "mapType":
        return { values: {} };
      default:
        return "";
    }
  };

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
    <div>
      <MdFilledCard>
        <div className="flex w-full items-center justify-between p-4">
          <p className="text-md-sys-typescale-title-large">Fields</p>
          <MdOutlinedButton onClick={openAddFieldDialog}>
            <MdIcon slot="icon">add</MdIcon>
            Add Field
          </MdOutlinedButton>
        </div>
        <div className="p-4">
          {Object.keys(collection.fields).length === 0 ? (
            <p className="py-8 text-center text-gray-500 text-sm">No fields defined</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-md-sys-color-outline border-b">
                    <th className="px-4 py-3 text-left font-medium text-md-sys-color-on-surface">Field Name</th>
                    <th className="px-4 py-3 text-left font-medium text-md-sys-color-on-surface">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-md-sys-color-on-surface">Required</th>
                    <th className="px-4 py-3 text-left font-medium text-md-sys-color-on-surface">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(collection.fields).map(([fieldName, fieldDef], index) => (
                    <tr key={fieldName} className={index % 2 === 0 ? "bg-md-sys-color-surface-container-low" : ""}>
                      <td className="px-4 py-3 font-mono text-sm">{fieldName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-md-sys-color-primary-container px-2 py-1 text-md-sys-color-on-primary-container text-sm">
                          {getFieldTypeDisplayName(fieldDef.type.case)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {fieldDef.required ? (
                          <span className="inline-flex items-center rounded-md bg-md-sys-color-error-container px-2 py-1 text-md-sys-color-on-error-container text-sm">
                            Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-md-sys-color-surface-container px-2 py-1 text-md-sys-color-on-surface text-sm">
                            Optional
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <MdOutlinedIconButton onClick={() => openEditFieldDialog(fieldName, fieldDef)}>
                            <MdIcon>edit</MdIcon>
                          </MdOutlinedIconButton>
                          <MdOutlinedIconButton onClick={() => deleteField(fieldName)}>
                            <MdIcon>delete</MdIcon>
                          </MdOutlinedIconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </MdFilledCard>

      {/* Field Dialog */}
      <MdDialog open={showFieldDialog} onClose={closeFieldDialog}>
        <div slot="headline">{editingField ? "Edit Field" : "Add Field"}</div>
        <div slot="content" className="space-y-4">
          <MdOutlinedTextField
            label="Field Name"
            value={fieldForm.name}
            onInput={(e) => setFieldForm({ ...fieldForm, name: (e.target as HTMLInputElement)?.value || "" })}
            required
          />

          <MdOutlinedSelect
            label="Field Type"
            value={fieldForm.type}
            onInput={(e) =>
              setFieldForm({
                ...fieldForm,
                type: (e.target as HTMLSelectElement)?.value as any,
                referenceCollection: "",
              })
            }
            required
          >
            <MdSelectOption value="stringType">
              <div slot="headline">String</div>
            </MdSelectOption>
            <MdSelectOption value="integerType">
              <div slot="headline">Integer</div>
            </MdSelectOption>
            <MdSelectOption value="boolType">
              <div slot="headline">Boolean</div>
            </MdSelectOption>
            <MdSelectOption value="doubleType">
              <div slot="headline">Double</div>
            </MdSelectOption>
            <MdSelectOption value="timestampType">
              <div slot="headline">Timestamp</div>
            </MdSelectOption>
            <MdSelectOption value="referenceType">
              <div slot="headline">Reference</div>
            </MdSelectOption>
            <MdSelectOption value="bytesType">
              <div slot="headline">Bytes</div>
            </MdSelectOption>
            <MdSelectOption value="arrayType">
              <div slot="headline">Array</div>
            </MdSelectOption>
            <MdSelectOption value="mapType">
              <div slot="headline">Map</div>
            </MdSelectOption>
          </MdOutlinedSelect>

          {fieldForm.type === "referenceType" && (
            <MdOutlinedSelect
              label="Reference Collection"
              value={fieldForm.referenceCollection}
              onInput={(e) =>
                setFieldForm({
                  ...fieldForm,
                  referenceCollection: (e.target as HTMLSelectElement)?.value || "",
                })
              }
              required
            >
              {availableCollections.map((col) => (
                <MdSelectOption key={col.id} value={col.name}>
                  <div slot="headline">{col.displayName || col.name}</div>
                </MdSelectOption>
              ))}
            </MdOutlinedSelect>
          )}

          <div className="flex items-center space-x-2">
            <MdSwitch
              selected={fieldForm.required}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  required: (e.target as any)?.selected || false,
                })
              }
            />
            <label htmlFor="">Required field</label>
          </div>
        </div>
        <div slot="actions">
          <MdTextButton onClick={closeFieldDialog}>Cancel</MdTextButton>
          <MdTextButton onClick={saveField}>{editingField ? "Update" : "Add"}</MdTextButton>
        </div>
      </MdDialog>
    </div>
  );
}
