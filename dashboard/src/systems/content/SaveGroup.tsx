"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import SaveBar from "@/kit/SaveBar";

// One Save for a whole screen. A screen is made of parts (the words of the page, its photos). Each part tells the group whether it has
// unsaved changes and how to save itself; the group shows one bar with one button. Pressing it saves every part that changed, one
// after another, and shows one plain message. Nothing that did not change is sent.
type Save = () => Promise<string | null>; // resolves to a problem in plain words, or null when it worked
type Registry = {
  set: (id: string, dirty: boolean, save: Save) => void;
  remove: (id: string) => void;
};

const Ctx = createContext<Registry | null>(null);

// Called by each part. `dirty` is whether the part has changes that are not saved; `save` saves just that part.
export function useSavePart(id: string, dirty: boolean, save: Save) {
  const group = useContext(Ctx);
  const latest = useRef(save);
  useEffect(() => {
    latest.current = save;
  });
  useEffect(() => {
    group?.set(id, dirty, () => latest.current());
  }, [group, id, dirty]);
  useEffect(() => () => group?.remove(id), [group, id]);
}

export function SaveGroup({
  children,
  label = "Save changes",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const parts = useRef(new Map<string, { dirty: boolean; save: Save }>());
  const [count, setCount] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad: boolean } | null>(
    null,
  );

  const refresh = useCallback(
    () => setCount([...parts.current.values()].filter((p) => p.dirty).length),
    [],
  );
  const registry = useRef<Registry>({
    set: (id, dirty, save) => {
      parts.current.set(id, { dirty, save });
      refresh();
      if (dirty) setMessage(null);
    },
    remove: (id) => {
      parts.current.delete(id);
      refresh();
    },
  }).current;

  const saveAll = async () => {
    setPending(true);
    setMessage(null);
    const problems: string[] = [];
    for (const part of [...parts.current.values()]) {
      if (!part.dirty) continue;
      const problem = await part.save();
      if (problem) problems.push(problem);
    }
    setPending(false);
    setMessage(
      problems.length
        ? { text: problems[0], bad: true }
        : { text: process.env.NODE_ENV === "production" ? "Saved. Press Publish to put it on your website." : "Saved. Refresh the website to see it.", bad: false },
    );
  };

  return (
    <Ctx.Provider value={registry}>
      {children}
      <SaveBar dirty={count > 0} pending={pending} label={label} onSave={saveAll} message={message} />
    </Ctx.Provider>
  );
}
