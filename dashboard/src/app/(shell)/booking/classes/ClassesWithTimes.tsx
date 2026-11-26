"use client";

import { useState } from "react";
import ClassTimes from "@/systems/booking/ClassTimes";
import type { ClassEntry } from "@/systems/booking/schema";
import ClassesForm from "@/systems/content/ClassesForm";
import type { Photos } from "@/systems/content/photoRules";
import type { ClassList } from "@/systems/content/site/classList";

// The class list (the website editor's) with each class's weekly times (Bookings') inside it. They are joined here, in the app,
// because a system may not reach into another one.
export default function ClassesWithTimes({ classes, photos, timetable }: { classes: ClassList; photos: Photos; timetable: ClassEntry[] }) {
  const [times, setTimes] = useState(timetable);
  return <ClassesForm initial={classes} photos={photos} times={(facts) => <ClassTimes facts={facts} timetable={times} onSaved={setTimes} />} />;
}
