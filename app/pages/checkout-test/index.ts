import { NotFoundError, Request, Response, redirect } from "@elements/app";
import { testCheckout } from "#app/shared/stripe";
import { getTestCheckout } from "./services";
import html from "./template";

/** Stands in for Stripe Checkout in development, until a key is added. */
export default function route(req: Request, res: Response) {
  if (!testCheckout()) {
    throw new NotFoundError();
  }

  let checkout = getTestCheckout(req.params.checkoutId);

  if (!checkout) {
    throw new NotFoundError();
  }

  if (checkout.status === "paid") {
    redirect(`/c/${checkout.campaignSlug}?thanks=1`);
    return;
  }

  return new html({ checkout });
}
