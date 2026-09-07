import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createSurfaceData,
  type SurfaceKind,
} from "../src/features/ballistic-story/scene/materials/surface-data";

// Captured from the original main-thread generator before moving it to a worker.
const originalPixels: Record<SurfaceKind, string> = {
  floor: "fbc41e12256310ddb3a9ddeac88fed308ca94cffe10bffea8dba7d0fd301c016",
  ordinary: "f5be242dddff8bb1f956095060c3613439e3a47394154d9516d565064020f592",
  protective: "f9077386408f808e91b2508dd94adc6ee59208a51a272b08316815c1fba031c3",
  upholstery: "3dfedd16536ab43a97e6109cfd3af1f6fca53482e6cdec6a29882bd4a970db51",
};
describe("worker surface pixels", () => {
  it.each(Object.entries(originalPixels))(
    "preserves every %s color, normal and roughness byte",
    (kind, hash) => {
      const { color, normal, rough, size } = createSurfaceData(kind as SurfaceKind);
      expect(size).toBe(512);
      expect(createHash("sha256").update(color).update(normal).update(rough).digest("hex")).toBe(
        hash,
      );
    },
  );
});
