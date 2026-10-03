import { App, getEnv } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import campaign from "#app/pages/campaign";
import signin from "#app/pages/signin";
import signup from "#app/pages/signup";
import dashboard from "#app/pages/dashboard";
import campaignNew from "#app/pages/campaign-new";
import campaignManage from "#app/pages/campaign-manage";
import checkoutTest from "#app/pages/checkout-test";
import serveImage from "#app/routes/images";
import donationsCsv from "#app/routes/donations-csv";
import donateReturn from "#app/routes/donate-return";
import stripeWebhook from "#app/routes/stripe-webhook";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";
import { stripeConfigured } from "#app/shared/stripe";

// Production never runs without a key; development uses the test checkout.
if (getEnv() === "production" && !stripeConfigured()) {
  throw new Error("STRIPE_SECRET_KEY is required in production.");
}

const app = new App();

app.route("/", home);
app.route("/c/:slug", campaign);
app.route("/signin", signin);
app.route("/signup", signup);
app.route("/dashboard", dashboard);
app.route("/campaigns/new", campaignNew);
app.route("/dashboard/c/:id", campaignManage);
app.route("/dashboard/c/:id/donations.csv", donationsCsv);
app.route("/images/:id/:hash", serveImage);
app.route("/checkout/test/:checkoutId", checkoutTest);
app.route("/donate/return", donateReturn);
app.route({ method: "post", path: "/stripe/webhook", handler: stripeWebhook });

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
