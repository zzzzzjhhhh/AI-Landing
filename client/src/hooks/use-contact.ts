import { useMutation } from "@tanstack/react-query";
import { api, type CreateContactInput, type ContactResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useContactForm() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateContactInput) => {
      // Validate input on client before sending
      const validated = api.contact.submit.input.parse(data);
      
      const res = await fetch(api.contact.submit.path, {
        method: api.contact.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Try to parse known error schema
        const parsedError = api.contact.submit.responses[400].safeParse(errorData);
        if (parsedError.success) {
          throw new Error(parsedError.data.message);
        }
        throw new Error("Something went wrong. Please try again.");
      }

      return api.contact.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "We've received your request and will get back to you shortly.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
