import {
  handleCheckoutSessionCompleted,
  handleSubscriptionDeleted,
} from "@/lib/payment-helpers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  //webhook functionality
  const payload = await req.text();

  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event; // Define event type

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          {
            expand: ["line_items"],
          }
        );
        console.log("Webhook received: checkout.session.completed", { session });
        

        //connect to the db create or update user
        await handleCheckoutSessionCompleted({ session, stripe });
        console.log("Webhook handled: checkout.session.completed");
        break;
      }
      case "customer.subscription.deleted": {
        // connect to db
        const subscriptionId = event.data.object.id;
        console.log("Webhook received: customer.subscription.deleted", { subscriptionId })

        await handleSubscriptionDeleted({ subscriptionId, stripe });
        console.log("Webhook handled: customer.subscription.deleted")
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    return NextResponse.json({ received: true });
    
  } catch (err) {
    console.error(`Webhook Error: ${(err as Error).message}`, { error: err });
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json({ status: "Failed", error: "Webhook signature verification failed." }, { status: 400 });
  } else {
      return NextResponse.json({ status: "Failed", error: "Webhook handler failed." }, { status: 500 });
  }
  }
}
