export const plansMap = [
  {
    id: "basic",
    name: "Basic",
    description: "Get started with SpeakEasy!",
    price: process.env.BASIC_PLAN_PRICE || "10", // Default to "10" if not set
    items: ["3 Blog Posts", "3 Transcription"],
    paymentLink: process.env.BASIC_PLAN_PAYMENT_LINK || "https://buy.stripe.com/test_aEU9D35X65fH0MMeUW", // Default to test link
    priceId:
      process.env.NODE_ENV === "development"
        ? process.env.BASIC_PLAN_PRICE_ID_DEV || "price_1PtLVqBPnsISnc82CW4au1uq" // Default to test price ID
        : process.env.BASIC_PLAN_PRICE_ID_PROD || "", // Default to empty string if not set
  },
  {
    id: "pro",
    name: "Pro",
    description: "All Blog Posts, let’s go!",
    price: process.env.PRO_PLAN_PRICE || "19.99", // Default to "19.99" if not set
    items: ["Unlimited Blog Posts", "Unlimited Transcriptions"],
    paymentLink: process.env.PRO_PLAN_PAYMENT_LINK || "https://buy.stripe.com/test_cN26qRclufUl9jibIL", // Default to test link
    priceId:
      process.env.NODE_ENV === "development"
        ? process.env.PRO_PLAN_PRICE_ID_DEV || "price_1PtLVqBPnsISnc82bspCVu5e" // Default to test price ID
        : process.env.PRO_PLAN_PRICE_ID_PROD || "", // Default to empty string if not set
  },
];

export const ORIGIN_URL =
  process.env.NODE_ENV === "development"
    ? process.env.ORIGIN_URL_DEV || "http://localhost:3000" // Default to localhost if not set
    : process.env.ORIGIN_URL_PROD || "https://videotonotes.vercel.app"; // Default to production URL if not set