"use client";

import { useMutation } from "@tanstack/react-query";
import { api, type ContactResponse, type CreateContactInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

const contactFields = ["firstName", "lastName", "email", "company", "phone", "message"] as const;

function isContactField(value?: string): value is keyof CreateContactInput {
  return !!value && contactFields.includes(value as (typeof contactFields)[number]);
}

export class ContactSubmissionError extends Error {
  field?: keyof CreateContactInput;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ContactSubmissionError";
    this.field = isContactField(field) ? field : undefined;
  }
}

export function useContactForm() {
  const { toast } = useToast();

  return useMutation<ContactResponse, Error, CreateContactInput>({
    mutationFn: async (data: CreateContactInput) => {
      // Validate input on client before sending
      const validated = api.contact.submit.input.parse(data);
      
      const res = await fetch(api.contact.submit.path, {
        method: api.contact.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        // Try to parse known error schema
        const parsedError = api.contact.submit.responses[400].safeParse(errorData);
        if (parsedError.success) {
          throw new ContactSubmissionError(parsedError.data.message, parsedError.data.field);
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
      if (error instanceof ContactSubmissionError && error.field) {
        return;
      }

      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
