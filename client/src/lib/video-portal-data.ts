export type VideoPortalItem = {
  id: string;
  title: string;
  summary: string;
  poster?: string;
  videoUrl: string;
  visibilityLabel: string;
  duration: string;
  track: string;
  tags: string[];
};

export type VideoPortalCollection = {
  title: string;
  summary: string;
  items: VideoPortalItem[];
};

const egocentricDemoFiles = [
  "demo-01.mp4",
  "demo-02.mov",
  "demo-03.mov",
  "demo-04.mp4",
  "demo-05.mov",
  "demo-06.mp4",
  "demo-07.mp4",
  "demo-08.mp4",
  "demo-09.mp4",
  "demo-10.mp4",
  "demo-11.mov",
  "demo-12.mp4",
  "demo-13.mov",
  "demo-14.mp4",
  "demo-15.mov",
  "demo-16.mov",
  "demo-17.mp4",
  "demo-18.mp4",
  "demo-19.mp4",
  "demo-20.mp4",
  "demo-21.mp4",
  "demo-22.mov",
  "demo-23.mp4",
  "demo-24.mov",
  "demo-25.mov",
  "demo-26.mp4",
  "demo-27.mp4",
  "demo-28.mp4",
  "demo-29.mp4",
  "demo-30.mp4",
  "demo-31.mp4",
  "demo-32.mp4",
  "demo-33.mp4",
  "demo-34.mov",
  "demo-35.mp4",
  "demo-36.mp4",
  "demo-37.mp4",
  "demo-38.mp4",
  "demo-39.mp4",
  "demo-40.mp4",
  "demo-41.mov",
] as const;

export const videoCollections: VideoPortalCollection[] = [
  {
    title: "Egocentric Demo",
    summary:
      "Egocentric point-of-view clips for direct review in the protected gallery.",
    items: egocentricDemoFiles.map((fileName, index) => ({
      id: `egocentric-demo-${String(index + 1).padStart(2, "0")}`,
      title: `Egocentric Demo ${index + 1}`,
      summary: "Egocentric point-of-view demonstration clip.",
      videoUrl: `/videos/egocentric-demo/${fileName}`,
      visibilityLabel: "Authenticated preview",
      duration: "",
      track: "egocentric-demo",
      tags: ["egocentric", "pov"],
    })),
  },
];
