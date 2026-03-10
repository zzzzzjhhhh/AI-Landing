import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, type CreateContactInput } from "@shared/routes";
import { useContactForm } from "@/hooks/use-contact";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import bgMain from "@assets/bg_main_1768281613638.jpg";

const caseStudyVideos = [
  {
    id: 1,
    title: "Autonomous Navigation",
    description: "Real-world trajectory data for self-driving systems",
    videoUrl: "/videos/1.mp4",
  },
  {
    id: 2,
    title: "Robotic Manipulation",
    description: "Expert-annotated grasping and assembly sequences",
    videoUrl: "/videos/2.mp4",
  },
  {
    id: 3,
    title: "Warehouse Automation",
    description: "Large-scale pick-and-place dataset pipelines",
    videoUrl: "/videos/3.mp4",
  },
  {
    id: 4,
    title: "Drone Intelligence",
    description: "Aerial perception and obstacle avoidance data",
    videoUrl: "/videos/4.mp4",
  },
  {
    id: 5,
    title: "Human-Robot Interaction",
    description: "Behavioral datasets for collaborative robotics",
    videoUrl: "/videos/5.mp4",
  },
];

function VideoCard({ video }: { video: typeof caseStudyVideos[0] }) {
  return (
    <div
      className="group"
      data-testid={`card-video-${video.id}`}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-navy-900 rounded-2xl shadow-lg shadow-black/30">
        <video
          src={video.videoUrl}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="pt-4 px-1">
        <h4 className="font-display text-white text-lg font-medium mb-1">{video.title}</h4>
        <p className="text-white/50 text-sm">{video.description}</p>
      </div>
    </div>
  );
}

function CaseStudyCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 400);
    }
  }, [checkScroll]);

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-6 px-5 md:px-20 lg:px-28">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 h-10 w-10"
          data-testid="button-carousel-prev"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 h-10 w-10"
          data-testid="button-carousel-next"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-6 overflow-x-auto pb-4 px-5 md:px-20 lg:px-28 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
        onMouseDown={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          const startX = e.pageX - el.offsetLeft;
          const scrollLeft = el.scrollLeft;
          const onMove = (ev: MouseEvent) => {
            const x = ev.pageX - el.offsetLeft;
            el.scrollLeft = scrollLeft - (x - startX);
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            setTimeout(checkScroll, 100);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      >
        {caseStudyVideos.map((video) => (
          <div
            key={video.id}
            className="flex-shrink-0 snap-start w-[calc((100%-1.5rem)/1.2)] md:w-[calc((100%-4.5rem)/3.2)]"
          >
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmationSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full"
    >
      <div className="text-center max-w-3xl mx-auto mb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-[28px] sm:text-[36px] md:text-[48px] font-display font-medium text-white mb-6 tracking-tight leading-[1.2]" data-testid="text-confirmation-heading">
            We received your request.
            <br />
            <span style={{ color: '#8bdaef' }}>Our team will contact you soon.</span>
          </h1>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full"
      >
        <div className="text-center max-w-3xl mx-auto mb-12 px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-white mb-5 font-medium tracking-tight" data-testid="text-case-studies-heading">
            Case Studies
          </h2>
          <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-[700px] mx-auto font-light">
            See how creators and teams are using OceanVeo to produce high-quality AI video content.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <CaseStudyCarousel />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function BookCall() {
  const contactMutation = useContactForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCaseStudies, setShowCaseStudies] = useState(false);

  const form = useForm<CreateContactInput>({
    resolver: zodResolver(api.contact.submit.input),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: CreateContactInput) => {
    contactMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        setIsSubmitted(true);
        setTimeout(() => {
          setShowCaseStudies(true);
        }, 2000);
      }
    });
  };

  return (
    <div className="bg-navy-950 min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={bgMain} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-950" />
      </div>
      
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center pt-32 pb-24 relative z-10">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center px-6"
            >
              <div className="w-full max-w-2xl text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-[36px] sm:text-[48px] md:text-[70px] font-display font-medium text-white mb-6 tracking-tight leading-[1.1]"
                >
                  Let's talk about <br/><span style={{ color: '#8bdaef' }}>your data.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-lg md:text-xl text-steel-400 leading-relaxed font-light"
                >
                  The future is embodied. Give your models a world to learn from.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-xl"
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-steel-400 text-sm font-medium">First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-steel-400 text-sm font-medium">Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-steel-400 text-sm font-medium">Work Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane@company.com" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-steel-400 text-sm font-medium">Company</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme AI" {...field} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-steel-400 text-sm font-medium">Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ''} className="h-12 bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all rounded-none px-0" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-steel-400 text-sm font-medium">Message (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about your project requirements..." 
                              className="bg-transparent border-0 border-b border-white/20 text-white/60 placeholder:text-white/20 min-h-[120px] focus:border-[#8bdaef] focus:text-white ring-0 outline-none shadow-none transition-all resize-none rounded-none px-0 py-4" 
                              {...field} 
                              value={field.value || ''}
                              data-testid="input-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-start">
                      <Button 
                        type="submit" 
                        disabled={contactMutation.isPending}
                        className="bg-white text-navy-900 hover:bg-sky-100 hover:scale-105 h-14 px-8 rounded-xl font-medium text-lg mt-4 shadow-xl shadow-blue-900/20 transition-all duration-300 active:scale-[0.98] flex items-center gap-2 group"
                        data-testid="button-submit"
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Request</span>
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </motion.div>
            </motion.div>
          ) : !showCaseStudies ? (
            <motion.div
              key="confirmation-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex items-center justify-center min-h-[40vh]"
            >
              <div className="text-center max-w-3xl mx-auto px-6">
                <h1 className="text-[28px] sm:text-[36px] md:text-[48px] font-display font-medium text-white tracking-tight leading-[1.2]" data-testid="text-confirmation-heading">
                  We received your request.
                  <br />
                  <span style={{ color: '#8bdaef' }}>Our team will contact you soon.</span>
                </h1>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="case-studies"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full mt-[140px]"
            >
              <div className="px-5 md:px-20 lg:px-28 mb-10">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-display text-white mb-5 font-medium tracking-tight text-left" data-testid="text-case-studies-heading">
                  Case Studies
                </h2>
                <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-[700px] font-light text-left">
                  See how creators and teams are using OceanVeo to produce high-quality AI video content.
                </p>
                <div className="border-b border-white/20 mt-8" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full pb-[160px]"
              >
                <CaseStudyCarousel />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
