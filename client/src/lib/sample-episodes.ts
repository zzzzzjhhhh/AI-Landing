import fiveCamera from "../../../public/rerun/episodes/20260910_150529/manifest.json";
import fiveCameraHands from "../../../public/rerun/episodes/20260910_150529/right-hand-pressure.json";
import recordedFiveCamera from "../../../public/rerun/episodes/20260910_153529/manifest.json";
import recordedFiveCameraHands from "../../../public/rerun/episodes/20260910_153529/right-hand-pressure.json";
import recordedFiveCameraDepth from "../../../public/rerun/episodes/20260910_153529/foundation-stereo-depth.json";
import recordedFiveCameraImu from "../../../public/rerun/episodes/20260910_153529/head-imu-estimates.json";
import foldingEpisode from "../../../public/rerun/episodes/20260910_161737/manifest.json";
import foldingHands from "../../../public/rerun/episodes/20260910_161737/right-hand-pressure.json";
import foldingImu from "../../../public/rerun/episodes/20260910_161737/head-imu-estimates.json";
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
  depthDataUrl?: string;
  imuNote?: string;
  imuCsvUrl?: string;
}

export const sampleEpisodes: readonly SampleEpisode[] = [
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
    depthDataUrl: `${recordedFiveCameraDepth.depth_archive.path}?v=${recordedFiveCameraDepth.depth_archive.sha256.slice(0, 12)}`,
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
