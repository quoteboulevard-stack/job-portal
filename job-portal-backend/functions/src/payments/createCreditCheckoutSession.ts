import * as functions from "firebase-functions";
import Stripe from "stripe";
import { config } from "../shared/validateEnv";
import { getFirestore } from "../shared/firebaseAdmin";

const stripe = new Stripe(config.STRIPE_SECRET, { apiVersion: "2024-06-20" });

const CREDIT_PACKAGES = {
  starter: { name: "Starter", credits: 10, unitAmount: 900 },
  growth: { name: "Growth", credits: 25, unitAmount: 1900 },
  pro: { name: "Pro", credits: 60, unitAmount: 3900 },
} as const;

type PackageId = keyof typeof CREDIT_PACKAGES;

export const createCreditCheckoutSession = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onCall(
    async (
      data: { packageId: PackageId; origin: string },
      context
    ) => {
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Authentication required."
        );
      }

      const packageId = String(data?.packageId ?? "").trim() as PackageId;
      const origin = String(data?.origin ?? "").trim();
      const selectedPackage = CREDIT_PACKAGES[packageId];

      if (!selectedPackage) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Unknown credit package."
        );
      }

      if (!origin || !/^https?:\/\//.test(origin)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "A valid origin is required."
        );
      }

      const userSnap = await getFirestore()
        .collection("users")
        .doc(context.auth.uid)
        .get();

      const user = userSnap.exists
        ? (userSnap.data() as Record<string, unknown>)
        : {};

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${origin}/credits?checkout=success`,
        cancel_url: `${origin}/credits?checkout=cancelled`,
        customer_email:
          typeof user["email"] === "string"
            ? user["email"]
            : context.auth.token.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: selectedPackage.unitAmount,
              product_data: {
                name: `${selectedPackage.name} credit pack`,
                description: `${selectedPackage.credits} job portal credits`,
              },
            },
          },
        ],
        payment_intent_data: {
          metadata: {
            userId: context.auth.uid,
            credits: String(selectedPackage.credits),
            plan: packageId,
          },
        },
        metadata: {
          userId: context.auth.uid,
          credits: String(selectedPackage.credits),
          plan: packageId,
        },
      });

      if (!session.url) {
        throw new functions.https.HttpsError(
          "internal",
          "Stripe did not return a checkout URL."
        );
      }

      return { success: true, url: session.url };
    }
  );
