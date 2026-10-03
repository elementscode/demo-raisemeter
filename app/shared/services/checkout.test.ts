import { test, equal, errorf, ValidationError } from "@elements/app";
import { checkDonation, DonateForm } from "./checkout";

function form(overrides: Partial<DonateForm>): DonateForm {
  return { campaignId: "x", amount: 50, name: "Ada", anonymous: false, message: "", ...overrides };
}

function fieldError(f: DonateForm): string {
  try {
    checkDonation(f);
  } catch (err) {
    if (err instanceof ValidationError) {
      return Object.keys(err.errors ?? {}).join(",");
    }

    throw err;
  }

  return "";
}

test("checkDonation", () => {
  test("converts dollars to cents", () => {
    equal(checkDonation(form({ amount: 12.5 })).amountCents, 1250);
  });

  test("anonymous gifts drop the name", () => {
    let gift = checkDonation(form({ anonymous: true, name: "Ada" }));
    equal(gift.donorName, null);
  });

  test("trims the name and message", () => {
    let gift = checkDonation(form({ name: "  Ada  ", message: " hi " }));
    equal(gift.donorName, "Ada");
    equal(gift.message, "hi");
  });

  test("rejects amounts out of range", () => {
    equal(fieldError(form({ amount: 0.5 })), "amount");
    equal(fieldError(form({ amount: 50_001 })), "amount");
    equal(fieldError(form({ amount: NaN })), "amount");
  });

  test("needs a name unless anonymous", () => {
    equal(fieldError(form({ name: "  " })), "name");
    equal(fieldError(form({ name: "", anonymous: true })), "");
  });

  test("caps the message length", () => {
    if (fieldError(form({ message: "x".repeat(281) })) !== "message") {
      errorf("expected a 281-character message to be rejected");
    }
  });
});
