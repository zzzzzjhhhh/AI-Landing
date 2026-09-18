import clothingEpisode from "../../../public/rerun/episodes/20260911_170529/manifest.json";
import clothingDepth from "../../../public/rerun/episodes/20260911_170529/foundation-stereo-depth.json";
import clothingHands from "../../../public/rerun/episodes/20260911_170529/right-hand-pressure.json";
import clothingTracking from "../../../public/rerun/episodes/20260911_170529/tracking-override.json";
import clothingMovementHold from "../../../public/rerun/episodes/20260911_170529/movement-hold.json";
import clothingPressureV4 from "../../../public/rerun/episodes/20260911_170529/visual-pressure-v4-smooth.json";
import waterEpisode from "../../../public/rerun/episodes/20260911_165650/manifest.json";
import waterDepth from "../../../public/rerun/episodes/20260911_165650/foundation-stereo-depth.json";
import waterHands from "../../../public/rerun/episodes/20260911_165650/right-hand-pressure.json";
import waterTracking from "../../../public/rerun/episodes/20260911_165650/tracking-override.json";
import waterMovementHold from "../../../public/rerun/episodes/20260911_165650/movement-hold.json";
import waterPressureOverride from "../../../public/rerun/episodes/20260911_165650/visual-pressure-override.json";
import fiveCamera from "../../../public/rerun/episodes/20260910_150529/manifest.json";
import fiveCameraHands from "../../../public/rerun/episodes/20260910_150529/right-hand-pressure.json";
import recordedFiveCamera from "../../../public/rerun/episodes/20260910_153529/manifest.json";
import recordedFiveCameraHands from "../../../public/rerun/episodes/20260910_153529/right-hand-pressure.json";
import recordedFiveCameraDepth from "../../../public/rerun/episodes/20260910_153529/foundation-stereo-depth.json";
import recordedFiveCameraImu from "../../../public/rerun/episodes/20260910_153529/head-imu-estimates.json";
import foldingEpisode from "../../../public/rerun/episodes/20260910_161737/manifest.json";
import foldingHands from "../../../public/rerun/episodes/20260910_161737/right-hand-pressure.json";
import foldingImu from "../../../public/rerun/episodes/20260910_161737/head-imu-estimates.json";
import objectTransfer from "../../../public/rerun/episodes/20260911_155825/manifest.json";
import objectTransferHands from "../../../public/rerun/episodes/20260911_155825/right-hand-pressure.json";
import objectTransferTracking from "../../../public/rerun/episodes/20260911_155825/tracking-override.json";
import objectTransferImu from "../../../public/rerun/episodes/20260911_155825/head-imu-estimates.json";
import objectTransferDepth from "../../../public/rerun/episodes/20260911_155825/foundation-stereo-depth.json";
import { glovePressureRecording, type HandRecording } from "./glove-pressure-recording";

export interface SampleEpisode {
  id: string;
  label: string;
  title: string;
  cameraLabel: string;
  durationLabel: string;
  recordingUrl: string;
  hands: HandRecording;
  flexionTitle: string;
  flexionNote: string;
  synchronizationNote?: string;
  pressureCsvUrl?: string;
  depthNote?: string;
  depthVideoUrl?: string;
  imuNote?: string;
  imuCsvUrl?: string;
}

export const sampleEpisodes: readonly SampleEpisode[] = [
  {
    id: clothingEpisode.episode_id,
    label: "20260911 · 170529",
    title: "Fold and stack clothing",
    cameraLabel: "5 camera views",
    durationLabel: `${clothingEpisode.duration_seconds.toFixed(1)}s`,
    recordingUrl: `${clothingEpisode.recording.path}?v=${clothingEpisode.recording.sha256.slice(0, 12)}`,
    hands: { ...clothingHands, tracking_override: clothingTracking.overlay, movement_hold_override: clothingMovementHold.data, pressure_override: clothingPressureV4.data },
    flexionTitle: "Right-hand flexion from recorded pose.",
    flexionNote: "Stereo keypoints use provisional ACE raw tracking; 3D flexion retains the original pose. Pressure uses the original animated hand heatmap with V4 stereo contact audits every 0.5 s, 15 finger zones and 7 palm zones, and 120 ms display transitions. Color is inferred contact intensity, not measured force. Uncolored regions may be unknown or no-contact. Movement holds the last pose during tracking gaps.",
    depthNote: "FoundationStereo estimate from 1,419 synchronized PICO stereo pairs. Fixed 0.2–3.0 m color scale; black marks invalid regions. Original pair timestamps are preserved.",
    depthVideoUrl: `${clothingDepth.video.path}?v=${clothingDepth.video.sha256.slice(0, 12)}`,
    imuNote: "Accel and gyro derived from the recorded head pose; source hardware IMU is unavailable.",
    synchronizationNote: `Five views share the task-clip timeline. External-camera alignment is estimated at ~${clothingEpisode.external_alignment_estimate_seconds} s; these three views have no spatial calibration for keypoint overlays.`,
  },
  {
    id: waterEpisode.episode_id,
    label: "20260911 · 165650",
    title: "Pour water and place the cup in the microwave",
    cameraLabel: "5 camera views",
    durationLabel: `${waterEpisode.duration_seconds.toFixed(1)}s`,
    recordingUrl: `${waterEpisode.recording.path}?v=${waterEpisode.recording.sha256.slice(0, 12)}`,
    hands: { ...waterHands, tracking_override: waterTracking.overlay, movement_hold_override: waterMovementHold.data, pressure_override: waterPressureOverride.data },
    flexionTitle: "Right-hand flexion from recorded pose.",
    flexionNote: "Stereo left/right keypoints use the provisional left V5 and right V4 tracking. Flexion uses the original pose. Pressure is an estimated, unmeasured right-glove contact map from 86 reviewed stereo samples, interpolated only during contact on the original right-camera timeline. Movement stays blank before the first tracked pose.",
    depthNote: "FoundationStereo estimate from 526 synchronized PICO stereo pairs. Fixed 0.2–3.0 m color scale; black marks invalid regions. Original pair timestamps are preserved.",
    depthVideoUrl: `${waterDepth.video.path}?v=${waterDepth.video.sha256.slice(0, 12)}`,
    imuNote: "Accel and gyro derived from the recorded head pose; source hardware IMU is unavailable.",
    synchronizationNote: `Five views share the task-clip timeline. External-camera alignment is estimated at ~${waterEpisode.external_alignment_estimate_seconds} s; these three views have no spatial calibration for keypoint overlays.`,
  },
  {
    id: objectTransfer.episode_id,
    label: "20260911 · 155825",
    title: "Tabletop object transfer",
    cameraLabel: "5 camera views",
    durationLabel: `${objectTransfer.duration_seconds.toFixed(1)}s`,
    recordingUrl: `${objectTransfer.recording.path}?v=${objectTransfer.recording.sha256.slice(0, 12)}`,
    hands: { ...objectTransferHands, tracking_override: objectTransferTracking.overlay },
    flexionTitle: "Right-hand flexion from recorded pose.",
    flexionNote: "Stereo left/right keypoints use the provisional left and right V10 tracking. The 3D flexion and pressure panels still use the original pose and reviewed object contacts.",
    pressureCsvUrl: `${objectTransferHands.pressure_csv.path}?v=${objectTransferHands.pressure_csv.sha256.slice(0, 12)}`,
    depthNote: "FoundationStereo estimate from 738 synchronized PICO stereo pairs. Fixed 0.2–3.0 m color scale; black marks invalid regions. Original pair timestamps are preserved.",
    depthVideoUrl: `${objectTransferDepth.video.path}?v=${objectTransferDepth.video.sha256.slice(0, 12)}`,
    imuNote: "Pose-derived accel and gyro estimates; the source hardware IMU stream is empty. Head-local axes: X right, Y up, Z back; accel is specific force in m/s² and gyro is in rad/s.",
    imuCsvUrl: `${objectTransferImu.csv.path}?v=${objectTransferImu.csv.sha256.slice(0, 12)}`,
    synchronizationNote: `Five views share the task-clip timeline. External-camera alignment is estimated at ~${objectTransfer.external_alignment_estimate_seconds} s; these three views have no spatial calibration for keypoint overlays.`,
  },
  {
    id: foldingEpisode.episode_id,
    label: "20260910 · 161737",
    title: "Clothing folding replay",
    cameraLabel: "5 camera views",
    durationLabel: `${foldingEpisode.duration_seconds.toFixed(1)}s`,
    recordingUrl: `${foldingEpisode.recording.path}?v=${foldingEpisode.recording.sha256.slice(0, 12)}`,
    hands: foldingHands,
    flexionTitle: "Right-hand flexion from recorded pose.",
    flexionNote: "Original hand pose with estimated right-camera intrinsics; left-camera calibration is unchanged. Missing tracking is unavailable. Pressure follows reviewed folding contacts and finger bends: ESTIMATED, relative 0–100, not measured. VIDEO ONLY marks pressure without valid pose.",
    pressureCsvUrl: `${foldingHands.pressure_csv.path}?v=${foldingHands.pressure_csv.sha256.slice(0, 12)}`,
    imuNote: "IMU · ESTIMATED from recorded head motion. Accel includes gravity (m/s²); gyro is angular velocity (rad/s). Head-local axes: X right, Y up, Z back. Depth and Gaussian Splat are placeholders.",
    imuCsvUrl: `${foldingImu.csv.path}?v=${foldingImu.csv.sha256.slice(0, 12)}`,
    synchronizationNote: `Five views share the task-clip timeline. External-camera alignment is estimated at ~${foldingEpisode.external_alignment_estimate_seconds} s; these three views have no spatial calibration for keypoint overlays.`,
  },
  {
    id: recordedFiveCamera.episode_id,
    label: "20260910 · 153529",
    title: recordedFiveCamera.title,
    cameraLabel: "5 camera views",
    durationLabel: `${recordedFiveCamera.duration_seconds.toFixed(1)}s`,
    recordingUrl: `${recordedFiveCamera.recording.path}?v=${recordedFiveCamera.recording.sha256.slice(0, 12)}`,
    hands: recordedFiveCameraHands,
    flexionTitle: "Right-hand flexion from recorded pose.",
    flexionNote: "Original hand pose with refined camera intrinsics (estimated). Missing tracking is shown as unavailable. Pressure follows video contact phases and recorded finger bends: ESTIMATED, relative 0–100, not measured. VIDEO ONLY marks pressure inferred without valid pose.",
    pressureCsvUrl: `${recordedFiveCameraHands.pressure_csv.path}?v=${recordedFiveCameraHands.pressure_csv.sha256.slice(0, 12)}`,
    depthNote: "Depth · FoundationStereo estimate from synchronized PICO stereo pairs. Fixed 0.2–3.0 m color scale; black marks invalid regions. Each depth frame holds until the next captured pair. Glass and reflections can be unreliable.",
    depthVideoUrl: `${recordedFiveCameraDepth.video.path}?v=${recordedFiveCameraDepth.video.sha256.slice(0, 12)}`,
    imuNote: "IMU · ESTIMATED from recorded head motion. Accel includes gravity (m/s²); gyro shows angular velocity (rad/s). Head-local axes: X right, Y up, Z back. Smoothed pose estimates, not raw sensor measurements.",
    imuCsvUrl: `${recordedFiveCameraImu.csv.path}?v=${recordedFiveCameraImu.csv.sha256.slice(0, 12)}`,
    synchronizationNote: `Five views share the task-clip timeline. External-camera alignment is estimated at ~${recordedFiveCamera.external_alignment_estimate_seconds} s; these three views have no spatial calibration for keypoint overlays.`,
  },
  {
    id: fiveCamera.episode_id,
    label: "20260910 · 150529",
    title: fiveCamera.title,
    cameraLabel: "5 camera views",
    durationLabel: `${fiveCamera.duration_seconds.toFixed(1)}s`,
    recordingUrl: `${fiveCamera.recording.path}?v=${fiveCamera.recording.sha256.slice(0, 12)}`,
    hands: fiveCameraHands,
    flexionTitle: "Right-hand flexion · coarse video estimate.",
    flexionNote: "Missing glove tracking is approximated from visible video keyframes; valid recorded poses take precedence. Pressure uses mock data (DEMO).",
    synchronizationNote: `Five views share the task-clip timeline. External-camera alignment is estimated at ~${fiveCamera.external_alignment_estimate_seconds} s.`,
  },
  {
    id: "20260803_133948",
    label: "20260803 · Stereo",
    title: "Stereo PICO replay",
    cameraLabel: "Left + right RGB",
    durationLabel: "1m 30.5s",
    recordingUrl: "/api/rerun-demo/recording.rrd?v=94fc1ccc",
    hands: glovePressureRecording,
    flexionTitle: "Right-hand flexion from recorded pose.",
    flexionNote: "Finger motion follows the right-camera keypoints. Pressure remains simulated (DEMO).",
  },
];
