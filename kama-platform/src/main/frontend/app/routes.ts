import { index, layout, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/auth/auth.tsx"),
  ...prefix("/worlds/:world/", [
    layout("routes/layout.tsx", [index("routes/home.tsx"), route("/quests/:quest", "routes/quests/result.tsx")]),
  ]),
] satisfies RouteConfig;
