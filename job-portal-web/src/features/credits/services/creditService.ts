import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../shared/services/firebaseService";
import { callCreateCreditCheckoutSession } from "../../../shared/services/functionsService";
import type { CreditPackageRecord, CreditSummary } from "../types";

export const creditPackages: CreditPackageRecord[] = [
  { id: "starter", name: "Starter", credits: 10, price: "$9" },
  { id: "growth", name: "Growth", credits: 25, price: "$19" },
  { id: "pro", name: "Pro", credits: 60, price: "$39" },
];

export async function fetchCreditSummary(userId: string): Promise<CreditSummary> {
  const snap = await getDoc(doc(db, "users", userId));
  const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
  return {
    available:
      typeof data["balance"] === "number" ? data["balance"] : 0,
    totalAdded:
      typeof data["totalAdded"] === "number" ? data["totalAdded"] : 0,
  };
}

export async function purchaseCredits(
  userId: string,
  selectedPackage: CreditPackageRecord
): Promise<void> {
  if (!userId) {
    throw new Error("Sign in to purchase credits.");
  }

  const origin = window.location.origin;
  const { url } = await callCreateCreditCheckoutSession({
    packageId: selectedPackage.id,
    origin,
  });

  if (!url) {
    throw new Error("Stripe checkout session could not be created.");
  }

  window.location.assign(url);
}
