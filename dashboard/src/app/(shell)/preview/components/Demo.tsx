"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/kit/Input";
import SaveBar from "@/kit/SaveBar";
import Select from "@/kit/Select";
import Tick from "@/kit/Tick";
import TimeSelect from "@/kit/TimeSelect";
import Toggle from "@/kit/Toggle";

// Every form control of the toolbox in one form, to look at and try, on a computer and on a phone. Nothing here is saved.
const COLORS = [
  { value: "chinese", label: "Chinese Violet" },
  { value: "dodger", label: "Dodger blue" },
  { value: "golden", label: "Golden Gate Bridge", hint: "A warm orange red" },
  { value: "veronica", label: "Veronica" },
  { value: "sugus", label: "Sugus green" },
  { value: "gone", label: "Retired colour", disabled: true },
];

export default function Demo() {
  const [name, setName] = useState("");
  const [place, setPlace] = useState("Sai Gon, Vietnam");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("dodger");
  const [opens, setOpens] = useState("09:00");
  const [deposit, setDeposit] = useState(true);
  const [ticks, setTicks] = useState({ news: true, invites: true, mentions: false });
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const nameProblem = name.trim() === "" && message ? "Enter a name." : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(name.trim() === "" ? { text: "Enter a name.", bad: true } : { text: "Saved. (Nothing is really saved here.)" });
      }}
      aria-label="Controls"
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="grid content-start gap-5">
          <Field label="Name" error={nameProblem}>
            {(p) => <Input {...p} icon="user" value={name} onChange={(e) => setName(e.target.value)} placeholder="Username or email" autoComplete="off" />}
          </Field>
          <Field label="Location" hint="Where you are based.">
            {(p) => <Input {...p} icon="globe" value={place} onChange={(e) => setPlace(e.target.value)} />}
          </Field>
          <Field label="Bio" hint="A short line about you.">
            {(p) => <Textarea {...p} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Short bio" />}
          </Field>
        </div>

        <div className="grid content-start gap-5">
          <Field label="Colour">{(p) => <Select id={p.id} label="Colour" value={color} onChange={setColor} options={COLORS} invalid={p.invalid} />}</Field>
          <Field label="Opens at" hint="On a phone this opens as a sheet from the bottom.">
            {(p) => <TimeSelect id={p.id} label="Opens at" value={opens} onChange={setOpens} from="06:00" to="22:00" />}
          </Field>
          <div className="rounded-xl border border-border bg-card px-4 py-1">
            <Toggle checked={deposit} onChange={setDeposit} label="A deposit holds the date" hint="Paying it reserves the date." />
          </div>
          <fieldset className="grid gap-0.5">
            <legend className="mb-1 text-[13px] font-medium">Tell me about</legend>
            <Tick label="New notifications" checked={ticks.news} onChange={(v) => setTicks({ ...ticks, news: v })} />
            <Tick label="Someone invites me to a chat" checked={ticks.invites} onChange={(v) => setTicks({ ...ticks, invites: v })} />
            <Tick label="I am mentioned" checked={ticks.mentions} onChange={(v) => setTicks({ ...ticks, mentions: v })} />
          </fieldset>
        </div>
      </div>
      <SaveBar dirty={name !== "" || bio !== "" || color !== "dodger" || opens !== "09:00" || !deposit} message={message} />
    </form>
  );
}
