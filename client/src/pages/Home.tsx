import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Capabilities } from "@/components/Capabilities";
import { Metrics } from "@/components/Metrics";

export default function Home() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <main>
        <Hero />
        <Capabilities />
        <Metrics />
      </main>
      <Footer />
    </div>
  );
}
