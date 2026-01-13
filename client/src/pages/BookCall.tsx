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
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function BookCall() {
  const [, setLocation] = useLocation();
  const contactMutation = useContactForm();

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
        // Optionally redirect or show success state
      }
    });
  };

  return (
    <div className="bg-navy-950 min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4 md:px-6 relative">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-navy-900/50 hidden lg:block -z-0 clip-path-slant" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-navy-900 to-transparent -z-0" />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10">
          
          {/* Left Column: Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Let's talk about <br/><span className="text-gradient">your data.</span>
            </h1>
            <p className="text-lg text-steel-500 mb-8 leading-relaxed">
              We'll discuss your specific labeling needs, quality requirements, and how our expert-in-the-loop pipelines can accelerate your roadmap.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Consultation</h3>
                  <p className="text-sm text-steel-500">Free assessment of your current pipeline and bottlenecks.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Pilot Proposal</h3>
                  <p className="text-sm text-steel-500">Custom plan including volume, SLA, and pricing structure.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-navy-900 border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-500">First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" {...field} className="bg-navy-950 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500 transition-colors" />
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
                        <FormLabel className="text-steel-500">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} className="bg-navy-950 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500 transition-colors" />
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
                      <FormLabel className="text-steel-500">Work Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@company.com" {...field} className="bg-navy-950 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500 transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-steel-500">Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme AI" {...field} className="bg-navy-950 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500 transition-colors" />
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
                        <FormLabel className="text-steel-500">Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ''} className="bg-navy-950 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500 transition-colors" />
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
                      <FormLabel className="text-steel-500">Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your project requirements..." 
                          className="bg-navy-950 border-white/10 text-white placeholder:text-white/20 min-h-[100px] focus:border-blue-500 transition-colors resize-none" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-lg font-medium text-lg mt-4 shadow-lg shadow-blue-900/20"
                >
                  {contactMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
