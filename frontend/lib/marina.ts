/** Marina branding — set via NEXT_PUBLIC_* env vars at build time. */
export const marinaConfig = {
  name: process.env.NEXT_PUBLIC_MARINA_NAME ?? "Your Dealership Name",
  slug: process.env.NEXT_PUBLIC_MARINA_SLUG ?? "your-dealership-name",
  subtitle: process.env.NEXT_PUBLIC_MARINA_SUBTITLE ?? "Service & storage portal",
} as const;
