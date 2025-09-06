import { useLoaderData, useNavigate } from "react-router";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { client } from "~/lib/client";
import type { Collection, CollectionField } from "~/client/dev/cloudeko/kama/collection/v1/resources_pb";
import {MdFilledButton, MdFilledCard, MdFilledIconButton, MdIcon, MdOutlinedIconButton} from "react-material-web";

export async function clientLoader(): Promise<{ collections: Collection[] }> {
  try {
    const response = await client.getCollectionService().listCollections({});
    return { collections: response.collections || [] };
  } catch (error) {
    console.error("Failed to load collections:", error);
    return { collections: [] };
  }
}

interface Position {
  x: number;
  y: number;
}

interface CollectionNode extends Collection {
  position: Position;
}

interface Connection {
  from: string;
  to: string;
  fieldName: string;
}

export default function Schematic() {
  const { collections } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [didPan, setDidPan] = useState(false);

  // Hierarchical layout algorithm similar to IntelliJ JPA viewer
  const calculateHierarchicalLayout = useCallback((collections: Collection[]): CollectionNode[] => {
    if (collections.length === 0) return [];

    // Build relationship graph
    const graph = new Map<string, { 
      node: Collection; 
      references: Set<string>; 
      referencedBy: Set<string>;
      level: number;
      position?: Position;
    }>();

    // Initialize nodes
    collections.forEach(collection => {
      graph.set(collection.id, {
        node: collection,
        references: new Set(),
        referencedBy: new Set(),
        level: 0,
      });
    });

    // Build reference relationships
    collections.forEach(collection => {
      Object.entries(collection.fields || {}).forEach(([, field]) => {
        if (field.type.case === "referenceType") {
          const refValue = field.type.value;
          const match = refValue.match(/collections\/([^\/]+)/);
          if (match) {
            const targetCollectionName = match[1];
            const targetCollection = collections.find(c => 
              c.name.includes(targetCollectionName) || c.displayName === targetCollectionName
            );
            if (targetCollection && targetCollection.id !== collection.id) {
              graph.get(collection.id)?.references.add(targetCollection.id);
              graph.get(targetCollection.id)?.referencedBy.add(collection.id);
            }
          }
        }
      });
    });

    // Calculate hierarchy levels (topological sort)
    const visited = new Set<string>();
    const temp = new Set<string>();
    const levels = new Map<string, number>();

    const calculateLevel = (nodeId: string): number => {
      if (temp.has(nodeId)) return 0; // Cycle detected, assign level 0
      if (visited.has(nodeId)) return levels.get(nodeId) || 0;

      temp.add(nodeId);
      const node = graph.get(nodeId);
      if (!node) return 0;

      let maxLevel = 0;
      for (const refId of node.references) {
        maxLevel = Math.max(maxLevel, calculateLevel(refId) + 1);
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      levels.set(nodeId, maxLevel);
      node.level = maxLevel;
      
      return maxLevel;
    };

    // Calculate levels for all nodes
    collections.forEach(collection => {
      if (!visited.has(collection.id)) {
        calculateLevel(collection.id);
      }
    });

    // Group nodes by level
    const levelGroups = new Map<number, string[]>();
    graph.forEach((data, nodeId) => {
      const level = data.level;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)?.push(nodeId);
    });

    // Layout configuration
    const LEVEL_HEIGHT = 350; // Vertical spacing between levels
    const NODE_WIDTH = 320;
    const MIN_HORIZONTAL_SPACING = 50;
    const TOP_MARGIN = 100;
    const LEFT_MARGIN = 100;

    // Position nodes
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    sortedLevels.forEach((level, levelIndex) => {
      const nodesInLevel = levelGroups.get(level) || [];
      const totalWidth = nodesInLevel.length * NODE_WIDTH + (nodesInLevel.length - 1) * MIN_HORIZONTAL_SPACING;
      const startX = LEFT_MARGIN;
      const y = TOP_MARGIN + level * LEVEL_HEIGHT;

      // Sort nodes in level by number of connections for better visual balance
      nodesInLevel.sort((a, b) => {
        const aConnections = (graph.get(a)?.references.size || 0) + (graph.get(a)?.referencedBy.size || 0);
        const bConnections = (graph.get(b)?.references.size || 0) + (graph.get(b)?.referencedBy.size || 0);
        return bConnections - aConnections;
      });

      nodesInLevel.forEach((nodeId, index) => {
        const x = startX + index * (NODE_WIDTH + MIN_HORIZONTAL_SPACING);
        const nodeData = graph.get(nodeId);
        if (nodeData) {
          nodeData.position = { x, y };
        }
      });
    });

    // Convert back to CollectionNode array
    const nodes: CollectionNode[] = [];
    graph.forEach((data, nodeId) => {
      if (data.position) {
        nodes.push({
          ...data.node,
          position: data.position,
        });
      }
    });

    return nodes;
  }, []);

  // Initialize collections with hierarchical positions
  const [collectionNodes, setCollectionNodes] = useState<CollectionNode[]>(() => {
    const nodes = calculateHierarchicalLayout(collections);
    return nodes;
  });

  // Calculate bounds and set initial zoom to fit all collections
  const calculateFitView = useCallback((nodes: CollectionNode[]) => {
    if (nodes.length === 0) return { zoom: 1, pan: { x: 0, y: 0 } };

    // Find bounds of all nodes
    const minX = Math.min(...nodes.map(n => n.position.x)) - 50;
    const maxX = Math.max(...nodes.map(n => n.position.x + 300)) + 50;
    const minY = Math.min(...nodes.map(n => n.position.y)) - 50;
    const maxY = Math.max(...nodes.map(n => n.position.y + 200)) + 50;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Get viewport dimensions (assuming canvas takes up most of the screen)
    const viewportWidth = window.innerWidth - 100;
    const viewportHeight = window.innerHeight - 200;

    // Calculate zoom to fit content
    const zoomX = viewportWidth / contentWidth;
    const zoomY = viewportHeight / contentHeight;
    const zoom = Math.min(zoomX, zoomY, 1); // Don't zoom in more than 100%

    // Calculate pan to center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const pan = {
      x: viewportWidth / 2 - centerX * zoom,
      y: viewportHeight / 2 - centerY * zoom,
    };

    return { zoom, pan };
  }, []);

  // Set initial zoom and pan to fit all collections
  useEffect(() => {
    if (collectionNodes.length > 0) {
      const { zoom: fitZoom, pan: fitPan } = calculateFitView(collectionNodes);
      setZoom(fitZoom);
      setPan(fitPan);
    }
  }, [collectionNodes, calculateFitView]);

  // Find connections between collections
  const connections = useMemo<Connection[]>(() => {
    const conns: Connection[] = [];

    collectionNodes.forEach((collection) => {
      Object.entries(collection.fields || {}).forEach(([fieldName, field]) => {
        if (field.type.case === "referenceType") {
          const refValue = field.type.value;
          // Try to extract collection name from reference
          const match = refValue.match(/collections\/([^\/]+)/);
          if (match) {
            const targetCollectionName = match[1];
            const targetCollection = collectionNodes.find(
              (c) => c.name.includes(targetCollectionName) || c.displayName === targetCollectionName,
            );
            if (targetCollection && targetCollection.id !== collection.id) {
              conns.push({
                from: collection.id,
                to: targetCollection.id,
                fieldName,
              });
            }
          }
        }
      });
    });

    return conns;
  }, [collectionNodes]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Only canvas panning now
      setIsPanning(true);
      setDidPan(false);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        // Canvas panning only
        const newPan = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        };
        
        // Check if we actually moved significantly
        const panDistance = Math.sqrt(
          Math.pow(newPan.x - pan.x, 2) + Math.pow(newPan.y - pan.y, 2)
        );
        
        if (panDistance > 5) {
          setDidPan(true);
        }
        
        setPan(newPan);
      }
    },
    [isPanning, panStart, pan],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    // Reset didPan after a short delay to allow click events
    setTimeout(() => setDidPan(false), 100);
  }, []);

  const handleCollectionClick = useCallback((collection: Collection) => {
    // Don't navigate if user was panning
    if (didPan) return;
    
    // Extract collection name from the resource name (e.g., "collections/users" -> "users")
    const collectionName = collection.name.split('/').pop();
    if (collectionName) {
      navigate(`/collections/${collectionName}`);
    }
  }, [didPan, navigate]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 3);

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom towards mouse position
        const zoomFactor = newZoom / zoom;
        setPan({
          x: mouseX - (mouseX - pan.x) * zoomFactor,
          y: mouseY - (mouseY - pan.y) * zoomFactor,
        });
      }

      setZoom(newZoom);
    },
    [zoom, pan],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev * 0.8, 0.1));
  }, []);

  const relayoutNodes = useCallback(() => {
    const newLayout = calculateHierarchicalLayout(collections);
    setCollectionNodes(newLayout);
  }, [collections, calculateHierarchicalLayout]);

  const fitToView = useCallback(() => {
    const { zoom: fitZoom, pan: fitPan } = calculateFitView(collectionNodes);
    setZoom(fitZoom);
    setPan(fitPan);
  }, [collectionNodes, calculateFitView]);

  const getConnectionPath = (from: CollectionNode, to: CollectionNode) => {
    const fromCenter = {
      x: from.position.x + 150 + 1000, // card width / 2 + SVG offset
      y: from.position.y + 100 + 1000, // card height / 2 + SVG offset
    };
    const toCenter = {
      x: to.position.x + 150 + 1000,
      y: to.position.y + 100 + 1000,
    };

    // Simple straight line for now
    return `M ${fromCenter.x} ${fromCenter.y} L ${toCenter.x} ${toCenter.y}`;
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 rounded-md-sys-shape-corner-lg border border-md-sys-color-outline opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, var(--md-sys-color-outline) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative h-full w-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {/* Transform container for zoom and pan */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* SVG for connection lines - large container to prevent clipping */}
          <svg 
            className="pointer-events-none absolute" 
            style={{ 
              zIndex: 5,
              left: '-1000px',
              top: '-1000px',
              width: '4000px',
              height: '3500px',
              overflow: 'visible'
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgb(var(--md-sys-color-primary))" />
              </marker>
            </defs>
            {connections.map((connection) => {
              const fromNode = collectionNodes.find((c) => c.id === connection.from);
              const toNode = collectionNodes.find((c) => c.id === connection.to);
              if (!fromNode || !toNode) return null;

              return (
                <g key={`${connection.from}-${connection.to}-${connection.fieldName}`}>
                  {/* White background for the line to make it more visible */}
                  <path
                    d={getConnectionPath(fromNode, toNode)}
                    stroke="var(--md-sys-color-primary)"
                    strokeWidth="6"
                    fill="none"
                    opacity="0.8"
                  />
                  <path
                    d={getConnectionPath(fromNode, toNode)}
                    stroke="var(--md-sys-color-primary-container)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="8,4"
                    markerEnd="url(#arrowhead)"
                  />
                  <rect
                    x={(fromNode.position.x + toNode.position.x + 300) / 2 - 30 + 1000}
                    y={(fromNode.position.y + toNode.position.y + 200) / 2 - 15 + 1000}
                    width="60"
                    height="20"
                    fill="var(--md-sys-color-surface)"
                    stroke="var(--md-sys-color-outline)"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x={(fromNode.position.x + toNode.position.x + 300) / 2 + 1000}
                    y={(fromNode.position.y + toNode.position.y + 200) / 2 - 2 + 1000}
                    fill="var(--md-sys-color-on-surface)"
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {connection.fieldName}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Collection cards */}
          {collectionNodes.map((collection) => (
            <div
              key={collection.id}
              className="absolute select-none transition-all duration-500 ease-out cursor-pointer"
              style={{
                left: collection.position.x,
                top: collection.position.y,
                width: 300,
                zIndex: 10,
              }}
              onClick={() => handleCollectionClick(collection)}
            >
              <MdFilledCard className="min-h-[200px] p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                <div className="flex h-full flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-md text-md-sys-color-on-surface">
                      {collection.displayName || collection.name}
                    </h3>
                    <div className="rounded bg-md-sys-color-surface-variant px-2 py-1 text-md-sys-color-outline text-xs">
                      Database
                    </div>
                  </div>
                  <p className="mb-3 font-mono text-md-sys-color-on-surface-variant text-sm">{collection.id}</p>

                  {/* Fields */}
                  <div className="flex-1">
                    <h4 className="mb-2 font-medium text-md-sys-color-on-surface-variant text-xs">
                      Fields ({Object.keys(collection.fields || {}).length})
                    </h4>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {Object.entries(collection.fields || {}).map(([fieldName, field]) => (
                        <div key={fieldName} className="flex items-center justify-between text-xs">
                          <div className="flex items-center">
                            <span className="font-mono text-md-sys-color-on-surface">{fieldName}</span>
                            {field.required && <span className="ml-1 text-md-sys-color-error">*</span>}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-md-sys-color-on-surface-variant">{getFieldTypeDisplay(field)}</span>
                            {field.type.case === "referenceType" && (
                              <span className="rounded bg-md-sys-color-primary-container px-1 text-md-sys-color-on-primary-container text-xs">
                                ref
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rules indicator */}
                  {collection.rules && collection.rules.length > 0 && (
                    <div className="mt-3 border-md-sys-color-outline-variant border-t pt-2">
                      <div className="text-md-sys-color-on-surface-variant text-xs">
                        {collection.rules.length} rule{collection.rules.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </div>
              </MdFilledCard>
            </div>
          ))}

          {/* Empty state */}
          {collectionNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-md-sys-color-on-surface-variant">
                <p className="mb-2 text-lg">No collections found</p>
                <p className="text-sm">Connect to a server with collections to see the schema</p>
              </div>
            </div>
          )}
        </div>

        {/* Zoom controls - outside transform container */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <MdOutlinedIconButton
            type="button"
            onClick={zoomIn}
            title="Zoom In"
          >
              <MdIcon>
                  zoom_in
              </MdIcon>
          </MdOutlinedIconButton>
          <MdOutlinedIconButton
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
          >
              <MdIcon>
                  zoom_out
              </MdIcon>
          </MdOutlinedIconButton>
          <MdOutlinedIconButton
            type="button"
            onClick={resetView}
            title="Reset View"
          >
              <MdIcon>
                  view_real_size
              </MdIcon>
          </MdOutlinedIconButton>
          <MdOutlinedIconButton
            type="button"
            onClick={fitToView}
            title="Fit to View"
          >
              <MdIcon>
                  fit_page
              </MdIcon>
          </MdOutlinedIconButton>
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 left-4 rounded-lg border border-md-sys-color-outline-variant bg-md-sys-color-surface p-2 shadow-lg">
          <span className="text-md-sys-color-on-surface text-xs">Zoom: {Math.round(zoom * 100)}%</span>
        </div>

        {/* Legend - outside transform container */}
        {collectionNodes.length > 0 && (
          <div className="absolute top-4 right-4 rounded-lg border border-md-sys-color-outline-variant bg-md-sys-color-surface p-4 shadow-lg">
            <h4 className="mb-2 font-semibold text-md-sys-color-on-surface text-sm">Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="h-0.5 w-4 bg-md-sys-color-primary opacity-60"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, transparent, transparent 2px, rgb(var(--md-sys-color-primary)) 2px, rgb(var(--md-sys-color-primary)) 4px)",
                  }}
                />
                <span className="text-md-sys-color-on-surface-variant">Reference connection</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="rounded bg-md-sys-color-primary-container px-1 text-md-sys-color-on-primary-container text-xs">
                  ref
                </span>
                <span className="text-md-sys-color-on-surface-variant">Reference field</span>
              </div>
              <div className="text-md-sys-color-on-surface-variant">Click: Navigate to collection</div>
              <div className="text-md-sys-color-on-surface-variant">Pan: Click and drag canvas</div>
              <div className="text-md-sys-color-on-surface-variant">Zoom: Mouse wheel</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getFieldTypeDisplay(field: CollectionField): string {
  switch (field.type.case) {
    case "identifierType":
      return "identifier";
    case "stringType":
      return "string";
    case "integerType":
      return "integer";
    case "boolType":
      return "boolean";
    case "doubleType":
      return "double";
    case "timestampType":
      return "timestamp";
    case "referenceType":
      return "reference";
    case "bytesType":
      return "bytes";
    case "arrayType":
      return "array";
    case "mapType":
      return "map";
    default:
      return "unknown";
  }
}
