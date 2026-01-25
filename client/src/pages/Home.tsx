import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Capabilities } from "@/components/Capabilities";
import { Workflow } from "@/components/Workflow";
import { Metrics } from "@/components/Metrics";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-navy-950 min-h-screen"
    >
      <Navbar />
      <main>
        <Hero />
        <Capabilities />
        <Workflow />
        <Metrics />
      </main>
      <Footer />
    </motion.div>
  );
}
