import { index, layout, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/layout.tsx", [
    route("/profile", "routes/profile.tsx"),
    ...prefix("/collections/", [
      index("routes/collections.tsx"),
      route("/new", "routes/collections.new.tsx"),
      layout("routes/collection.detail.layout.tsx", [
        route("/:collectionId", "routes/collection.detail.tsx"),
        route("/:collectionId/schema", "routes/collection.detail.schema.tsx"),
        route("/:collectionId/rules", "routes/collection.detail.rules.tsx"),
      ]),
      route("/:collectionId/records", "routes/records.tsx"),
      route("/:collectionId/records/new", "routes/records.new.tsx"),
      route("/:collectionId/records/:recordId", "routes/record-details.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
