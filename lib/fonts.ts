import { Lora, Plus_Jakarta_Sans } from "next/font/google";

// Placeholder pair taken from the reference mood (calm serif headings, clean sans body).
// The final fonts come from the design direction.
export const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const serif = Lora({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-lora",
});
