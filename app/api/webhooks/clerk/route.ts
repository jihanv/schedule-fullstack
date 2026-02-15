import { Webhook } from "svix";
import { db } from "@/app/db"; // adjust path if yours is different
import { Users } from "@/app/db/schema"; // adjust path if yours is different

type ClerkUserCreatedEvent = {
  type: "user.created";
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: { email_address: string }[];
  };
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", {
      status: 500,
    });
  }

  // Clerk sends a signed raw payload. We must read it as text (NOT json).
  const payload = await req.text();

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const wh = new Webhook(secret);

  let evt: unknown;
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // For now, just log it so we know it works.
  if (typeof evt === "object" && evt !== null && "type" in evt) {
    console.log("✅ Clerk webhook received:", (evt as { type: string }).type);
  } else {
    console.log("✅ Clerk webhook received (no type field):", evt);
  }

  if (
    typeof evt === "object" &&
    evt !== null &&
    "type" in evt &&
    (evt as { type: unknown }).type === "user.created"
  ) {
    const event = evt as ClerkUserCreatedEvent;

    const userId = event.data.id;
    const email = event.data.email_addresses?.[0]?.email_address;

    const firstName = event.data.first_name ?? "";
    const lastName = event.data.last_name ?? "";

    if (!email) {
      console.error("No email found on Clerk user.created payload");
      return new Response("Missing email", { status: 400 });
    }

    await db.insert(Users).values({
      user_id: userId,
      firstName,
      lastName,
      email,
    });
  }
  return new Response("ok", { status: 200 });
}
