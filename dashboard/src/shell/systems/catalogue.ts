// The ready-made systems you can offer: eight, so an owner takes them in at a glance. Anything smaller is a part of one
// of these, switched on when a client asks (docs/product/features.md, "The eight systems").
// Words are plain English: this is what you would tell a client.

// `ready` means the system has code and can be added today. The others are planned: the plan is written, the code is not. Keep it
// in step with `npm run list-systems` (the master dashboard): when a system gets code, set ready to true here.
export type Offer = {
  id: string;
  name: string;
  icon: string;
  line: string;
  details: string[]; // what it does, shown when the card is opened
  extras: string[]; // parts that can be switched on for a client
  group: "first" | "asked";
  ready: boolean;
  points?: string[]; // up to three things it does, shown on its card on Today
  soon?: boolean; // not built yet, so the card does not suggest it can be added now
  // For special industries: not a button to press, a conversation.
  byHand?: boolean;
};

export const CATALOGUE: Offer[] = [
  {
    id: "content",
    name: "Website",
    icon: "globe",
    line: "Change the words and photos on your website.",
    details: ["Change your hours, address and announcements", "Update your menu or services, with prices and photos", "Manage your photo gallery"],
    extras: ["Forms on your website", "Blog posts", "A second language"],
    points: ["Contact details", "Photos", "Opening hours"],
    group: "first",
    ready: true,
  },
  {
    id: "booking",
    name: "Bookings",
    icon: "calendar",
    line: "Customers book a date or a class. A full time cannot be booked again.",
    details: ["Customers pick a date or a class on your website", "You confirm or decline event requests", "See everything booked on a calendar", "Mark a deposit paid after you check it"],
    extras: ["A waiting list"],
    points: ["Event dates", "Classes", "Deposits you check yourself"],
    group: "first",
    ready: true,
  },
  {
    id: "orders",
    name: "Orders",
    icon: "cart",
    line: "Orders from start to finish, including requests from a link.",
    details: ["Add an order from Messenger, phone or walk-in", "Follow it from new to done", "See what is due today", "Copy the order into Messenger"],
    extras: ["Price quotes", "Delivery", "Selling at the counter"],
    points: ["Track progress", "Due dates", "Copy to Messenger"],
    group: "first",
    ready: false,
  },
  {
    id: "payments",
    name: "Money",
    icon: "wallet",
    line: "Money in and money out, and who still owes you.",
    details: ["Record each payment with its proof", "See who still owes you", "See totals by day and month"],
    extras: ["Expenses", "Bills you send", "Sales and simple reports"],
    points: ["Payments received", "Expenses", "Who still owes"],
    soon: true,
    group: "first",
    ready: true,
  },
  {
    id: "customers",
    name: "Customers",
    icon: "users",
    line: "People who buy from you: names, contact details and notes.",
    details: ["Keep names, phone numbers and notes", "See their past bookings and orders", "Add a whole list at once"],
    extras: ["Memberships", "Rewards and gift codes", "Customer feedback"],
    points: ["Contact details", "Past visits and orders", "Add a whole list"],
    group: "first",
    ready: false,
  },
  {
    id: "inventory",
    name: "Stock",
    icon: "box",
    line: "What you have, and when it runs low.",
    details: ["List what you have", "Record what comes in and goes out", "Know when something runs low", "Count your items"],
    extras: ["Buying from suppliers", "Your equipment"],
    points: ["What you have", "Alerts when low", "Count your items"],
    group: "first",
    ready: false,
  },
  {
    id: "staff",
    name: "Staff",
    icon: "user",
    line: "Who works when, and their details.",
    details: ["Keep your team's details", "Plan who works each week", "Approve time off"],
    extras: ["Attendance"],
    points: ["Your team", "Weekly schedule", "Time off requests"],
    group: "asked",
    ready: false,
  },
  {
    id: "tasks",
    name: "Tasks",
    icon: "list",
    line: "Jobs to do, who does them and when they are due.",
    details: ["Give a job a due date and a person", "Get reminders", "See what is late"],
    extras: ["Bigger projects in steps"],
    points: ["Due dates", "Reminders", "Late jobs"],
    group: "asked",
    ready: false,
  },
];

// A client's own system that does the job of a ready-made one, under another word.
const SAME: Record<string, string> = { website: "content" };
const word = (id: string) => SAME[id] ?? id;

// The card words of an installed system.
export const offerFor = (id: string): Offer | undefined => CATALOGUE.find((o) => o.id === word(id));

// The ones that are not in this dashboard yet.
export const notAdded = (installed: readonly string[]): Offer[] => {
  const have = new Set(installed.map(word));
  return CATALOGUE.filter((o) => !have.has(o.id));
};
