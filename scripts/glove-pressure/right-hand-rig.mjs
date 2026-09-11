import { readFile } from "node:fs/promises";
import { Vector3, Quaternion, BufferGeometry, BufferAttribute } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { inferRightHand, palmBasis } from "./pose-retargeting.mjs";

const fingerBones = ["little", "ring", "middle", "index"].flatMap((finger) =>
  [1, 2, 3].map((joint) => `${finger}0${joint}`),
).concat(["thumb02", "thumb03"]);
const openSpread = { little01: -10, ring01: -2, middle01: 0, index01: 5, thumb02: 0 };

/** Same joint names and degree convention as WebHand's exported angle columns. */
export function gripAngles(amount) {
  if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new RangeError("Grip must be between 0 and 1");
  // WebHand's open/fist calibration poses use 0/85 degrees on these joints.
  return Object.fromEntries(fingerBones.map((bone) => [`${bone}_z_deg`, 85 * amount]));
}

export function simulatedGrip(seconds) {
  return (1 - Math.cos(2 * Math.PI * seconds / 8)) / 2;
}

/** Bake timestamped bone poses for a native Rerun mesh, without a second web renderer. */
export async function loadRightHandRig() {
  const bytes = await readFile(new URL("./vendor/Hand_R2.glb", import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  const scene = gltf.scene;
  scene.position.set(-0.5, -0.2, 0);
  scene.scale.setScalar(1.1);
  const bones = new Map(), openRotations = new Map(), parts = [];
  scene.traverse((object) => {
    if (object.isBone) {
      if (fingerBones.includes(object.name)) object.rotation.z = 0;
      if (object.name in openSpread) object.rotation.y = openSpread[object.name] * Math.PI / 180;
      bones.set(object.name, object);
      openRotations.set(object.name, object.rotation.clone());
    }
    if (!object.isMesh) return;
    const attribute = object.geometry.getAttribute("position");
    const indices = Array.from(object.geometry.index?.array ?? Array.from({ length: attribute.count }, (_, i) => i));
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(attribute.count * 3), 3));
    geometry.setIndex(indices);
    parts.push({ object, attribute, indices, geometry });
  });
  for (const name of fingerBones) {
    if (!bones.has(name)) throw new Error(`Right-hand model is missing bone ${name}`);
  }
  const vector = new Vector3();
  let disposed = false;
  scene.updateMatrixWorld(true);
  const restPalm = palmBasis(...["hand_r", "index01", "middle01", "little01"].map((name) => bones.get(name).getWorldPosition(new Vector3())));
  function reset() {
    if (disposed) throw new Error("Right-hand rig has been disposed");
    for (const [name, bone] of bones) bone.rotation.copy(openRotations.get(name));
    scene.updateMatrixWorld(true);
  }
  function bake() {
    scene.updateMatrixWorld(true);
    return parts.map(({ object, attribute, geometry }) => {
      object.skeleton?.update();
      const position = geometry.getAttribute("position");
      for (let index = 0; index < attribute.count; index++) {
        vector.fromBufferAttribute(attribute, index);
        if (object.isSkinnedMesh) object.applyBoneTransform(index, vector);
        vector.applyMatrix4(object.matrixWorld);
        position.setXYZ(index, vector.x, vector.y, vector.z);
      }
      geometry.computeVertexNormals();
      return { positions: Array.from(position.array), normals: Array.from(geometry.getAttribute("normal").array) };
    });
  }
  return {
    topology: parts.map(({ indices }) => ({ indices })),
    sample(angles = {}) {
      reset();
      for (const [column, degrees] of Object.entries(angles)) {
        const match = /^(.+)_(x|y|z)_deg$/.exec(column);
        if (!match || !bones.has(match[1]) || !Number.isFinite(degrees)) throw new Error(`Invalid joint angle: ${column}`);
        bones.get(match[1]).rotation[match[2]] = degrees * Math.PI / 180;
      }
      return bake();
    },
    samplePose(joints) {
      reset();
      const inferred = inferRightHand(joints);
      const angles = {}, actualDirections = {};
      for (const [name, direction] of Object.entries(inferred.directions)) {
        const bone = bones.get(name);
        // Parent-first swing aligns the actual segment. Keep the rest pose's twist;
        // positions alone do not identify axial twist. Terminal bones point along -X.
        const axis = bone.children.find((child) => child.isBone)?.position.clone().normalize() ?? new Vector3(-1, 0, 0);
        const target = new Vector3(...direction).transformDirection(restPalm);
        const parentInverse = bone.parent.getWorldQuaternion(new Quaternion()).invert();
        const localTarget = target.clone().applyQuaternion(parentInverse);
        const restDirection = axis.clone().applyQuaternion(bone.quaternion);
        bone.quaternion.premultiply(new Quaternion().setFromUnitVectors(restDirection, localTarget)).normalize();
        scene.updateMatrixWorld(true);
        actualDirections[name] = axis.clone().applyQuaternion(bone.getWorldQuaternion(new Quaternion())).transformDirection(restPalm.clone().invert()).toArray();
        for (const component of ["x", "y", "z"]) angles[`${name}_${component}_deg`] = bone.rotation[component] * 180 / Math.PI;
      }
      return { meshes: bake(), angles, bends: inferred.bends, directions: actualDirections };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { geometry, object } of parts) {
        geometry.dispose();
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
      }
    },
  };
}
