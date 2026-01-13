import { db } from "./db";
import {
  contactRequests,
  type CreateContactRequest,
  type ContactRequestResponse
} from "@shared/schema";

export interface IStorage {
  createContactRequest(contact: CreateContactRequest): Promise<ContactRequestResponse>;
}

export class DatabaseStorage implements IStorage {
  async createContactRequest(contact: CreateContactRequest): Promise<ContactRequestResponse> {
    const [newContact] = await db.insert(contactRequests).values(contact).returning();
    return newContact;
  }
}

export const storage = new DatabaseStorage();
