import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { client } from "~/lib/client";
import type { Collection, CollectionField } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { CollectionFieldSchema, CollectionSchema } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import { create } from "@bufbuild/protobuf";
import {
  MdFilledButton,
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
import { CelEditor } from "~/components/CelEditor";

export default function Page() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Basic collection info
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");

  // Schema fields
  const [fields, setFields] = useState<Record<string, CollectionField>>({});
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);

  // Rules
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");

  // Form state for adding new fields
  const [newField, setNewField] = useState({
    name: "",
    type: "stringType" as const,
    required: false,
    referenceCollection: "",
  });

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

  const generateNameFromDisplayName = (displayName: string): string => {
    const baseName = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric chars except spaces and dashes
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .replace(/--+/g, "-") // Replace multiple dashes with single dash
      .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

    // Generate a short hash from the display name
    const hash = displayName
      .split("")
      .reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) & 0x7fffffff;
      }, 0)
      .toString(36)
      .substring(0, 6);

    return baseName ? `${baseName}-${hash}` : hash;
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    // Always generate name from display name
    setName(generateNameFromDisplayName(value));
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

  const addField = () => {
    if (!newField.name.trim()) return;
    if (newField.type === "referenceType" && !newField.referenceCollection) {
      setError("Reference collection is required when field type is Reference");
      return;
    }

    const field = create(CollectionFieldSchema, {
      required: newField.required,
      type: {
        case: newField.type,
        value: newField.type === "referenceType" ? newField.referenceCollection : getDefaultValueForType(newField.type),
      },
    });

    setFields({ ...fields, [newField.name]: field });
    setNewField({ name: "", type: "stringType", required: false, referenceCollection: "" });
    setError(null);
  };

  const removeField = (fieldName: string) => {
    const updatedFields = { ...fields };
    delete updatedFields[fieldName];
    setFields(updatedFields);
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setRules([...rules, newRule.trim()]);
    setNewRule("");
  };

  const updateRule = (index: number, value: string) => {
    const updatedRules = [...rules];
    updatedRules[index] = value;
    setRules(updatedRules);
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      // Filter out empty rules
      const validRules = rules.filter((rule) => rule.trim()).map((rule) => rule.trim());

      const collection = create(CollectionSchema, {
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        fields,
        rules: validRules,
        id: "",
        createTime: undefined,
        updateTime: undefined,
      });

      const response = await client.getCollectionService().createCollection({
        collection,
      });

      navigate(`/collections/${response.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    }
  };

  return (
    <div className="space-y-6">
      <div className="container flex w-full flex-row items-center justify-between pb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Link to="/collections">
              <MdTextButton>
                <MdIcon slot="icon">apps</MdIcon>
                Collections
              </MdTextButton>
            </Link>
            <MdIcon>chevron_forward</MdIcon>
            <MdTextButton disabled>New</MdTextButton>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-md-sys-color-on-surface text-md-sys-typescale-display-medium">New Collection</h1>
        <p className="text-md-sys-color-on-surface-variant text-md-sys-typescale-body-medium">
          Create a new data collection with custom fields and validation rules
        </p>
      </div>

      {error && (
        <div className="rounded-md-sys-shape-corner-md border border-md-sys-color-error bg-md-sys-color-error-container px-4 py-3 text-md-sys-color-on-error-container">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <MdFilledCard>
          <div className="flex w-full items-center justify-center p-4">
            <p className="text-md-sys-typescale-title-large">Basic Information</p>
          </div>
          <div className="space-y-4 p-4">
            <MdOutlinedTextField
              label="Name"
              value={name}
              readOnly
              disabled
              supporting-text="Auto-generated from display name (lowercase, alphanumeric, dashes only)"
            />
            <MdOutlinedTextField
              label="Display Name"
              value={displayName}
              onInput={(e) => handleDisplayNameChange((e.target as HTMLInputElement)?.value || "")}
              supporting-text="Human-readable name (optional)"
            />
          </div>
        </MdFilledCard>

        {/* Schema Definition */}
        <MdFilledCard>
          <div className="flex w-full items-center justify-between p-4">
            <p className="text-md-sys-typescale-title-large">Schema Fields</p>
          </div>
          <div className="p-4">
            {/* Existing Fields */}
            {Object.keys(fields).length > 0 && (
              <div className="mb-6 overflow-x-auto">
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
                    {Object.entries(fields).map(([fieldName, fieldDef], index) => (
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
                          <MdOutlinedIconButton onClick={() => removeField(fieldName)}>
                            <MdIcon>delete</MdIcon>
                          </MdOutlinedIconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Field Form */}
            <div className="space-y-4 border-md-sys-color-outline border-t pt-4">
              <h3 className="text-md-sys-color-on-surface text-md-sys-typescale-title-medium">Add New Field</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <MdOutlinedTextField
                  label="Field Name"
                  value={newField.name}
                  onInput={(e) =>
                    setNewField({
                      ...newField,
                      name: (e.target as HTMLInputElement)?.value || "",
                    })
                  }
                />

                <MdOutlinedSelect
                  label="Field Type"
                  value={newField.type}
                  onInput={(e) =>
                    setNewField({
                      ...newField,
                      type: (e.target as HTMLSelectElement)?.value as any,
                      referenceCollection: "",
                    })
                  }
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
              </div>

              {newField.type === "referenceType" && (
                <MdOutlinedSelect
                  label="Reference Collection"
                  value={newField.referenceCollection}
                  onInput={(e) =>
                    setNewField({
                      ...newField,
                      referenceCollection: (e.target as HTMLSelectElement)?.value || "",
                    })
                  }
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
                  selected={newField.required}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      required: (e.target as any)?.selected || false,
                    })
                  }
                />
                <label>Required field</label>
              </div>

              <div onClick={addField} style={{ cursor: "pointer" }}>
                <MdOutlinedButton type="button">
                  <MdIcon slot="icon">add</MdIcon>
                  Add Field
                </MdOutlinedButton>
              </div>
            </div>
          </div>
        </MdFilledCard>

        {/* Rules Section */}
        <MdFilledCard>
          <div className="flex w-full items-center justify-between p-4">
            <p className="text-md-sys-typescale-title-large">Validation Rules</p>
          </div>
          <div className="p-4">
            <p className="mb-4 text-md-sys-color-on-surface-variant text-md-sys-typescale-body-small">
              Define CEL (Common Expression Language) rules to validate records in this collection
            </p>

            {/* Existing Rules */}
            {rules.length > 0 && (
              <div className="mb-4">
                {rules.map((rule, index) => (
                  <div key={`rule-${index}`} className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-md-sys-color-on-surface text-md-sys-typescale-body-medium">
                        Rule {index + 1}
                      </span>
                      <div onClick={() => removeRule(index)} style={{ cursor: "pointer" }}>
                        <MdOutlinedIconButton>
                          <MdIcon>delete</MdIcon>
                        </MdOutlinedIconButton>
                      </div>
                    </div>
                    <CelEditor
                      value={rule}
                      onChange={(value) => updateRule(index, value)}
                      placeholder={`Enter CEL expression for rule ${index + 1}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add New Rule */}
            <div className={rules.length > 0 ? "border-md-sys-color-outline border-t pt-4" : ""}>
              <div className="space-y-4">
                <h3 className="text-md-sys-color-on-surface text-md-sys-typescale-title-medium">Add New Rule</h3>
                <CelEditor value={newRule} onChange={setNewRule} placeholder="Enter new CEL validation rule..." />
                <div onClick={addRule} style={{ cursor: "pointer" }}>
                  <MdOutlinedButton>
                    <MdIcon slot="icon">add</MdIcon>
                    Add Rule
                  </MdOutlinedButton>
                </div>
              </div>
            </div>
          </div>
        </MdFilledCard>

        {/* Actions */}
        <div className="flex space-x-4">
          <MdFilledButton type="submit">Create Collection</MdFilledButton>
          <Link to="/collections">
            <MdOutlinedButton>Cancel</MdOutlinedButton>
          </Link>
        </div>
      </form>
    </div>
  );
}
