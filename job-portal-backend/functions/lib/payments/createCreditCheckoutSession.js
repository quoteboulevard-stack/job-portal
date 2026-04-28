"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreditCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
const validateEnv_1 = require("../shared/validateEnv");
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const stripe = new stripe_1.default(validateEnv_1.config.STRIPE_SECRET, { apiVersion: "2024-06-20" });
const CREDIT_PACKAGES = {
    starter: { name: "Starter", credits: 10, unitAmount: 900 },
    growth: { name: "Growth", credits: 25, unitAmount: 1900 },
    pro: { name: "Pro", credits: 60, unitAmount: 3900 },
};
exports.createCreditCheckoutSession = functions
    .runWith({ timeoutSeconds: 30, memory: "256MB" })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const packageId = String(data?.packageId ?? "").trim();
    const origin = String(data?.origin ?? "").trim();
    const selectedPackage = CREDIT_PACKAGES[packageId];
    if (!selectedPackage) {
        throw new functions.https.HttpsError("invalid-argument", "Unknown credit package.");
    }
    if (!origin || !/^https?:\/\//.test(origin)) {
        throw new functions.https.HttpsError("invalid-argument", "A valid origin is required.");
    }
    const userSnap = await (0, firebaseAdmin_1.getFirestore)()
        .collection("users")
        .doc(context.auth.uid)
        .get();
    const user = userSnap.exists
        ? userSnap.data()
        : {};
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${origin}/credits?checkout=success`,
        cancel_url: `${origin}/credits?checkout=cancelled`,
        customer_email: typeof user["email"] === "string"
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
        throw new functions.https.HttpsError("internal", "Stripe did not return a checkout URL.");
    }
    return { success: true, url: session.url };
});
//# sourceMappingURL=createCreditCheckoutSession.js.map