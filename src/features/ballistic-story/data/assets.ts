// Null uses the procedural concept model. Populate with approved GLB assets at the same origin.
// Models retain their component's transforms; normalize replacements to the documented bounds.
export const modelAssets: Record<
  "firearm" | "projectile" | "glass" | "standardFabric" | "protectiveFabric" | "seat",
  string | null
> = {
  firearm: null,
  projectile: null,
  glass: null,
  standardFabric: null,
  protectiveFabric: null,
  seat: null,
};
export const assetDirectories = {
  models: "/models/",
  textures: "/textures/",
  posters: "/images/product/",
} as const;

export const seatPartAssets: Record<
  "upholstery" | "comfort" | "protective" | "structure",
  string | null
> = { upholstery: null, comfort: null, protective: null, structure: null };
