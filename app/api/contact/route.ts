import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { api } from "@shared/routes";
import { sendContactNotification } from "../../../server/email";
import { storage } from "../../../server/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = api.contact.submit.input.parse(await request.json());
    const contact = await storage.createContactRequest(input);

    sendContactNotification(input).catch((error) => {
      console.error("Email notification failed:", error);
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: error.errors[0]?.message ?? "Invalid request body",
          field: error.errors[0]?.path.join("."),
        },
        { status: 400 },
      );
    }

    console.error("Contact submission failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
