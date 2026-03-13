import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  phone: text("phone"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
const baseInsertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  createdAt: true,
});

const requiredText = (fieldLabel: string, maxLength: number) =>
  z
    .string({ required_error: `${fieldLabel} is required.` })
    .trim()
    .min(1, `${fieldLabel} is required.`)
    .max(maxLength, `${fieldLabel} must be ${maxLength} characters or fewer.`);

const personalEmailDomains = new Set([
  "126.com",
  "163.com",
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "me.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "qq.com",
  "yahoo.com",
]);

const optionalPhone = z
  .string()
  .trim()
  .max(32, "Phone number must be 32 characters or fewer.")
  .refine(
    (value) => value === "" || /^[0-9+().\-\s]+$/.test(value),
    "Enter a valid phone number.",
  )
  .refine(
    (value) => value === "" || value.replace(/\D/g, "").length >= 7,
    "Enter a valid phone number.",
  )
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const insertContactRequestSchema = baseInsertContactRequestSchema.extend({
  firstName: requiredText("First name", 80),
  lastName: requiredText("Last name", 80),
  email: z
    .string({ required_error: "Work email is required." })
    .trim()
    .min(1, "Work email is required.")
    .max(254, "Work email must be 254 characters or fewer.")
    .email("Enter a valid work email address.")
    .refine((value) => {
      const domain = value.split("@")[1]?.toLowerCase();
      return domain ? !personalEmailDomains.has(domain) : false;
    }, "Please use your company email address."),
  company: requiredText("Company", 120),
  phone: optionalPhone,
  message: z
    .string({ required_error: "Project details are required." })
    .trim()
    .min(10, "Project details must be at least 10 characters.")
    .max(2000, "Project details must be 2000 characters or fewer."),
});

// === EXPLICIT API CONTRACT TYPES ===
export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;

// Request types
export type CreateContactRequest = InsertContactRequest;

// Response types
export type ContactRequestResponse = ContactRequest;
