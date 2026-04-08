import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { videoCollections } from "@/lib/video-portal-data";

const allVideos = videoCollections.flatMap((collection) => collection.items);
const totalVideos = allVideos.length;

export default async function PortalVideosPage() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <main className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(79,163,188,0.22),transparent_45%)]" />
        <div className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-sky-300/25 to-transparent" />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-10">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_28px_120px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-8">
            <div className="space-y-5">
              <div className="space-y-5">
                <div className="inline-flex items-center rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100">
                  Video Portal
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                    Private motion clips. Fast review.
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,30,50,0.92),rgba(6,14,24,0.82))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="grid gap-5 xl:grid-cols-3">
              {allVideos.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-navy-950">
                    <video
                      controls
                      preload="metadata"
                      poster={item.poster}
                      className="absolute inset-0 h-full w-full object-contain"
                    >
                      <source src={item.videoUrl} />
                    </video>
                  </div>

                  <div className="space-y-4 px-5 pb-5 pt-3">
                    <h3 className="max-w-[16rem] text-lg font-semibold text-white">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-sky-100/52">
                      <span className="rounded-full border border-white/10 px-3 py-1.5">
                        {item.track}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-sky-100/68"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
