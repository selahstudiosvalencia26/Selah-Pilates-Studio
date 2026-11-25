// Images in the website's code that are NOT meant to be changed from the dashboard, with the reason. Every other image must be a
// <PhotoSlot slot="..."> with a place in ./slots.ts, so the owner can replace it. `npm run check` fails for an image that is
// neither (photoCoverage.test.ts), so a photo can never be forgotten when the CMS is set up for a new website.
// List a file here only when its image truly should not change: a logo, an icon, or a photo that comes from the data of a list.
export const FIXED_IMAGES: readonly { file: string; why: string }[] = [
  { file: "components/InstructorStack.tsx", why: "Each instructor's photo comes from the instructor data, not from a fixed place on the page." },
  { file: "components/OnlineBooking.tsx", why: "The payment QR comes from Bookings, Settings, How customers pay." },
];
