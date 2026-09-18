import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const vendor = join(dirname(fileURLToPath(import.meta.url)), "vendor");

// Right-glove layout from WebHand's handleStaticHandThreeD (23 rows x 20 cols).
export const regions = [
  { name: "palm", x: 0, y: 0, width: 16, height: 15, position: [-0.55, 0.1, 0.65], size: [1.2, 1.1], rotation: [76, 0], curve: 0, spread: 0, fade: 4, resolution: 50 },
  { name: "index", x: 12, y: 15, width: 4, height: 8, position: [0.02, 1.46, 0.32], size: [0.3, 1.2], rotation: [88, -6], curve: 0.05, spread: 0.15, fade: 0, resolution: 40 },
  { name: "middle", x: 8, y: 15, width: 4, height: 8, position: [-0.43, 1.56, 0.32], size: [0.3, 1.3], rotation: [88, 0], curve: 0.05, spread: 0.15, fade: 0, resolution: 40 },
  { name: "ring", x: 4, y: 15, width: 4, height: 8, position: [-0.85, 1.46, 0.32], size: [0.3, 1.2], rotation: [88, 4], curve: 0.05, spread: 0.15, fade: 0, resolution: 40 },
  { name: "little", x: 0, y: 15, width: 4, height: 8, position: [-1.26, 1.22, 0.32], size: [0.24, 1], rotation: [84, 12], curve: 0.05, spread: 0.15, fade: 0, resolution: 40 },
  { name: "thumb", x: 16, y: 15, width: 4, height: 8, position: [0.5, 0.6, 0.56], size: [0.3, 1], rotation: [90, -30], curve: 0.05, spread: 0.15, fade: 0, resolution: 40 },
];

export const UNIFORM_TAXELS = Object.freeze({ spacing: 0.065, elevation: 0.025, inactiveAlpha: 85 });
const INACTIVE_TAXEL_COLOR = [78, 94, 112];

// Optional equal physical pitch, independent of each ROI's pixel resolution.
// Existing/default WebHand output remains untouched.
export function uniformTaxelSamples(region,cols,rows,spacing=UNIFORM_TAXELS.spacing) {
  const nx=Math.max(1,Math.round(region.size[0]/spacing));
  const ny=Math.max(1,Math.round(region.size[1]/spacing));
  return Array.from({length:ny},(_,y)=>Array.from({length:nx},(_,x)=>({
    col:(x+.5)/nx*(cols-1),row:(y+.5)/ny*(rows-1),
  }))).flat();
}

function bilinear(values,cols,rows,col,row,channels=1,channel=0) {
  const x0=Math.floor(col),y0=Math.floor(row),x1=Math.min(cols-1,x0+1),y1=Math.min(rows-1,y0+1);
  const fx=col-x0,fy=row-y0;
  const at=(x,y)=>values[(y*cols+x)*channels+channel];
  return (at(x0,y0)*(1-fx)+at(x1,y0)*fx)*(1-fy)+(at(x0,y1)*(1-fx)+at(x1,y1)*fx)*fy;
}

export async function createPressureProcessor() {
  const createDataHandler = require("./vendor/data-handler.cjs");
  const wasm = await createDataHandler({ locateFile: (name) => join(vendor, name) });
  return function processFrame(data, options = {}) {
    if (!(data instanceof Uint8Array) || data.length !== 460) {
      throw new Error("Right-hand pressure must be a Uint8Array with 23 × 20 = 460 values");
    }
    const { min = 1, max = 140, height = 2, threshold = 6, stride = 1, uniformTaxels = false } = options;
    if (!(max > min) || !Number.isFinite(height) || height < 0 || !Number.isInteger(stride) || stride < 1) {
      throw new Error("Invalid pressure rendering options");
    }
    const input = new wasm.VectorUint8t();
    const positions = [], colors = [];
    try {
      for (const value of data) input.push_back(value);
      for (const region of regions) {
        let roi, result, pressed, colored;
        try {
          const { x, y, width, height: roiHeight } = region;
          roi = wasm.fetchRoiData(input, 23, 20, { x, y, width, height: roiHeight });
          result = wasm.handleThreeD(roi, roiHeight, width, min, max, 0, 0, 0, region.resolution);
          pressed = result.get("pressedMat");
          colored = result.get("coloredMat");
          const bx = (pressed.cols - 1) / 2, bz = (pressed.rows - 1) / 2;
          const sx = region.size[0] / (pressed.cols - 1), sz = region.size[1] / (pressed.rows - 1);
          const [rx, ry] = region.rotation.map((degrees) => degrees * Math.PI / 180);
          const sinX = Math.sin(rx), cosX = Math.cos(rx), sinY = Math.sin(ry), cosY = Math.cos(ry);
          const samples=uniformTaxels?uniformTaxelSamples(region,pressed.cols,pressed.rows):
            Array.from({length:Math.ceil(pressed.rows/stride)},(_,y)=>
              Array.from({length:Math.ceil(pressed.cols/stride)},(_,x)=>({row:y*stride,col:x*stride}))).flat();
          for (const {row,col} of samples) {
              const pressure = uniformTaxels?bilinear(pressed.data,pressed.cols,pressed.rows,col,row):pressed.data[row * pressed.cols + col];
              if (!uniformTaxels && pressure < threshold) continue;
              const px = col - bx, pz = row - bz;
              const cornerX = Math.max(0, Math.abs(px) - (bx - 4));
              const cornerZ = Math.max(0, Math.abs(pz) - (bz - 4));
              if (cornerX > 0 && cornerZ > 0 && Math.hypot(cornerX, cornerZ) > 4) continue;
              const edgeDistance = Math.min(bx - Math.abs(px), bz - Math.abs(pz));
              const alpha = region.fade ? Math.max(0, Math.min(1, edgeDistance / region.fade)) : 1;
              if (alpha === 0) continue;
              const lateral = bx ? px / bx : 0;
              const elevation = uniformTaxels?UNIFORM_TAXELS.elevation:pressure / 255 * height;
              const localX = px * sx + (uniformTaxels?0:elevation * lateral * region.spread);
              const localY = (Math.cos(lateral * Math.PI / 2) - 1) * region.curve + elevation;
              const localZ = pz * sz;
              // Three.js Euler XYZ: scale, rotate Y, then rotate X, then translate.
              const rotatedX = cosY * localX + sinY * localZ;
              const rotatedZ = -sinY * localX + cosY * localZ;
              positions.push([
                rotatedX + region.position[0],
                cosX * localY - sinX * rotatedZ + region.position[1],
                sinX * localY + cosX * rotatedZ + region.position[2],
              ]);
              if(uniformTaxels){
                // Faint neutral sites remain visible: absence of a colored estimate
                // does not erase the glove lattice or assert measured zero force.
                const x=Math.max(0,Math.min(1,pressure/24)),blend=x*x*(3-2*x);
                const rgb=INACTIVE_TAXEL_COLOR.map((base,i)=>Math.round(base+(bilinear(colored.data,colored.cols,colored.rows,col,row,3,i)-base)*blend));
                colors.push([...rgb,Math.round(alpha*(UNIFORM_TAXELS.inactiveAlpha+(255-UNIFORM_TAXELS.inactiveAlpha)*blend))]);
              }else{
                const offset = (row * colored.cols + col) * 3;
                colors.push([colored.data[offset], colored.data[offset + 1], colored.data[offset + 2], Math.round(alpha * 255)]);
              }
          }
        } finally {
          colored?.delete(); pressed?.delete(); result?.delete(); roi?.delete();
        }
      }
    } finally { input.delete(); }
    return { positions, colors };
  };
}
