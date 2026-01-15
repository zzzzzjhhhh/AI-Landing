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

export default function BookCall() {
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
      }
    });
  };

  return (
    <div className="bg-navy-950 min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient matching main page */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 opacity-50 pointer-events-none" />
      
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center pt-32 pb-24 px-6 md:px-12 relative z-10">
        <div className="w-full max-w-2xl text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight"
          >
            Let's talk about <br/><span className="text-white/40">your data.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-steel-400 leading-relaxed font-light"
          >
            We'll discuss your specific labeling needs, quality requirements, and how our expert-in-the-loop pipelines can accelerate your roadmap.
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
                        <Input placeholder="Jane" {...field} className="h-12 bg-navy-900/50 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-colors rounded-xl" />
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
                        <Input placeholder="Doe" {...field} className="h-12 bg-navy-900/50 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-colors rounded-xl" />
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
                      <Input type="email" placeholder="jane@company.com" {...field} className="h-12 bg-navy-900/50 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-colors rounded-xl" />
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
                        <Input placeholder="Acme AI" {...field} className="h-12 bg-navy-900/50 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-colors rounded-xl" />
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
                        <Input placeholder="+1 (555) 000-0000" {...field} value={field.value || ''} className="h-12 bg-navy-900/50 border-white/5 text-white placeholder:text-white/10 focus:border-blue-500/50 transition-colors rounded-xl" />
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
                        className="bg-navy-900/50 border-white/5 text-white placeholder:text-white/10 min-h-[120px] focus:border-blue-500/50 transition-colors resize-none rounded-xl p-4" 
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-xl font-medium text-lg mt-4 shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98]"
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
      </main>

      <Footer />
    </div>
  );
}
