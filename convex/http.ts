import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  method: "POST",
  path: "./clerk-webhook",
  handler: httpAction(async (ctx, req) => {
    const body = await validateRequest(req);
    if (!body) {
      return new Response("Unthaurized", { status: 401 });
    }
    switch (body.type) {
      case "user.created":
        await ctx.runMutation(internal.functions.user.upsert, {
          username: body.data.username!,
          image: body.data.image_url,
          clerkId: body.data.id,
        });
        break;
      case "user.updated":
        await ctx.runMutation(internal.functions.user.upsert, {
          username: body.data.username!,
          image: body.data.image_url,
          clerkId: body.data.id,
        });
        break;
      case "user.deleted":
        break;
    }
    return new Response("OK", { status: 200 });
  }),
});

const validateRequest = async (req: Request) => {
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  const text = await req.text();

  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    return webhook.verify(text, {
      id: svix_id!,
      timestamp: svix_timestamp!,
      signature: svix_signature!,
    }) as unknown as WebhookEvent;
  } catch (error) {
    return null;
  }
};

export default http;
