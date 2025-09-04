import { index, layout, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  ...prefix("/collections/", [
    layout("routes/layout.tsx", [
      index("routes/collections.tsx"),
      route("/:collectionId", "routes/collection-details.tsx"),
      route("/:collectionId/records", "routes/records.tsx"),
      route("/:collectionId/records/:recordId", "routes/record-details.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
