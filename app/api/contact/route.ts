import { track } from "@vercel/analytics/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { api } from "@shared/routes";
import { sendContactNotification } from "../../../server/email";
import { storage } from "../../../server/storage";

export const runtime = "nodejs";

const route = "/api/contact";

type LogLevel = "info" | "warn" | "error";

function writeLog(level: LogLevel, payload: Record<string, unknown>) {
  const message = JSON.stringify(payload);

  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.log(message);
}

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = request.headers.get("x-vercel-id");

  writeLog("info", {
    level: "info",
    msg: "contact_submit_start",
    route,
    requestId,
  });

  try {
    const input = api.contact.submit.input.parse(await request.json());
    const contact = await storage.createContactRequest(input);

    void track("Contact Submitted").catch((error) => {
      writeLog("error", {
        level: "error",
        msg: "contact_submit_tracking_failed",
        route,
        requestId,
        ms: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    void sendContactNotification(input).catch((error) => {
      writeLog("error", {
        level: "error",
        msg: "contact_notification_failed",
        route,
        requestId,
        ms: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    writeLog("info", {
      level: "info",
      msg: "contact_submit_success",
      route,
      requestId,
      ms: Date.now() - start,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      writeLog("warn", {
        level: "warn",
        msg: "contact_submit_validation_failed",
        route,
        requestId,
        ms: Date.now() - start,
        field: error.errors[0]?.path.join("."),
        message: error.errors[0]?.message ?? "Invalid request body",
      });

      return NextResponse.json(
        {
          message: error.errors[0]?.message ?? "Invalid request body",
          field: error.errors[0]?.path.join("."),
        },
        { status: 400 },
      );
    }

    writeLog("error", {
      level: "error",
      msg: "contact_submit_failed",
      route,
      requestId,
      ms: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
