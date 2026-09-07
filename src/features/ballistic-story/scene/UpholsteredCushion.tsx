import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useSurfaceMaps } from "./materials/textile-maps";
function seamCurve(w: number, h: number, z: number) {
  const points: THREE.Vector3[] = [];
  const r = 0.15;
  for (let corner = 0; corner < 4; corner++) {
    const cx = corner === 0 || corner === 3 ? w / 2 - r : -w / 2 + r;
    const cy = corner < 2 ? h / 2 - r : -h / 2 + r;
    for (let j = 0; j < 12; j++) {
      const a = (corner * Math.PI) / 2 + ((j / 11) * Math.PI) / 2;
      points.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z));
    }
  }
  return new THREE.CatmullRomCurve3(points, true, "centripetal");
}
export function UpholsteredCushion({
  height = 2.6,
  seat = false,
  selected = false,
}: {
  height?: number;
  seat?: boolean;
  selected?: boolean;
}) {
  const maps = useSurfaceMaps("upholstery"),
    stitches = useRef<THREE.InstancedMesh>(null);
  const { geometry, piping, stitchCurve } = useMemo(() => {
    const width = 3.25,
      depth = seat ? 0.39 : 0.4;
    const geometry = new RoundedBoxGeometry(width, height, depth, 10, 0.16);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const nx = x / (width / 2),
        ny = y / (height / 2),
        front = Math.max(0, z / (depth / 2));
      const tension = Math.pow(Math.max(0, 1 - nx * nx), 1.5) * Math.max(0, 1 - ny * ny) * 0.075;
      const sideCrease = Math.exp(-Math.pow((Math.abs(x) - 1.39) / 0.022, 2)) * 0.012;
      const edgeCrease =
        Math.exp(-Math.pow((Math.abs(y) - (height / 2 - 0.19)) / 0.028, 2)) * 0.012;
      const channel = seat
        ? Math.exp(-Math.pow((y + 0.13) / 0.55, 2)) * 0.018
        : Math.exp(-Math.pow((y + 0.4) / 0.55, 2)) * 0.022;
      pos.setXYZ(
        i,
        x * (seat ? 1 : 1 - 0.032 * Math.max(0, ny)),
        y,
        z + (tension - sideCrease - edgeCrease - channel) * front,
      );
    }
    geometry.computeVertexNormals();
    const curve = seamCurve(3.12, height - 0.13, depth / 2 - 0.015);
    return {
      geometry,
      piping: new THREE.TubeGeometry(curve, 160, 0.012, 6, true),
      stitchCurve: seamCurve(2.93, height - 0.32, depth / 2 + 0.017),
    };
  }, [height, seat]);
  useEffect(
    () => () => {
      geometry.dispose();
      piping.dispose();
    },
    [geometry, piping],
  );
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D(),
      up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 150; i++) {
      dummy.position.copy(stitchCurve.getPointAt(i / 150));
      dummy.quaternion.setFromUnitVectors(up, stitchCurve.getTangentAt(i / 150).normalize());
      dummy.updateMatrix();
      stitches.current?.setMatrixAt(i, dummy.matrix);
    }
    if (stitches.current) stitches.current.instanceMatrix.needsUpdate = true;
  }, [stitchCurve]);
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          {...maps}
          color={selected ? "#777570" : "#494a47"}
          normalScale={[0.23, 0.23]}
          roughness={0.8}
          clearcoat={0.14}
          clearcoatRoughness={0.65}
          sheen={0.15}
          sheenColor="#a6adb3"
        />
      </mesh>
      <mesh geometry={piping} castShadow>
        <meshStandardMaterial color="#343a3c" roughness={0.75} />
      </mesh>
      <instancedMesh ref={stitches} args={[undefined, undefined, 150]}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.019, 4]} />
        <meshStandardMaterial color="#8f918b" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}
