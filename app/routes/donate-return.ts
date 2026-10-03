import { Request, Response, redirect } from "@elements/app";
import { fulfillDonation } from "#app/shared/services/checkout";

/** Where Stripe sends a donor after Checkout. */
export default async function donateReturn(req: Request, res: Response) {
  let result = await fulfillDonation(String(req.query.session_id ?? ""));

  if (!result) {
    redirect("/");
    return;
  }

  redirect(`/c/${result.slug}?${result.paid ? "thanks" : "pending"}=1`);
}
