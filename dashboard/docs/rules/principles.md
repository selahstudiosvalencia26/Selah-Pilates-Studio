# Design principles

Added 2026-11-22. They sit beside rule zero in `CLAUDE.md` ("less is more") and are checked the same way: before you show a screen. If a rule here and a design skill disagree, this file wins.

## 1. Less is more: ask why before you add

Every feature, element, animation and line of code has a cost. Before adding one, ask why it is there and whether the result is better with it. Removing is harder than adding, so treat a removal as a deliberate act and think through what it changes.

- A menu opened 200 times a day, with a 300 ms animation, costs a person about six hours of waiting in a year. Understand how often something is used before you decide it should move, glow or exist.
- Judge code by quality, not by how much of it there is. Fewer lines that do the job are better.
- Knowing what not to build is the skill that matters most when adding things is cheap.

Source: Jakub, "Less is more, more or less" (https://jakub.kr/writing/less-is-more).

## 2. One clear task on every page

When someone opens a page they know in a few seconds what to do there.

- Every page answers one question: **what is the one thing to do here?** If you cannot answer it in a sentence, split the page or remove something.
- The title names the place or the task. The line under it says what to do, in plain words.
- One primary button, repeated if the page is long. Other actions can exist, but they look quieter (a link or a plain button), so priority is clear from how they look.
- A button says what it does ("Save the price", not "Submit"). A label that would fit on any page is too vague.
- Forms ask for one thing at a time. If a form feels long, break it into steps or hide the rarely used fields.

This is a guide to priority, not a ban on a second button. What it forbids is a page where five things compete for attention.

## 3. Every task takes the fewest steps

Count the clicks for each task, from where the person already is.

- **Bad example:** to sign out, open Settings, then Security, then Sign out. Three clicks, and Security is the last place anyone would look.
- **Good example:** Sign out is one click in the side menu, where the person's name and role already are.
- Things people do often (sign out, add, save, search, change a status, call or message someone) are **one click** from where they are, or two at most. Things they do rarely can be deeper.
- Show what people need most up front and hide the rest. **Hide at most two levels deep**; with three, people get lost. If you need three, simplify first.
- Never hide something people use all the time behind "More". That only adds a step.
- Give each thing **one way** to be reached. If it must be in two places, label both clearly.
- Make the way to the hidden part obvious (a clear button or link) and say what is behind it ("More details", not "...").
- The number of clicks is not the only measure. A clear path with obvious labels beats a low count with a confusing one, and the old "three clicks" rule has no science behind it.
- Write the top tasks of every system in its `design.md` with their click counts (see `docs/systems/_template/design.md`, "Tasks and steps"). A task of more than two clicks needs a reason written next to it.

Source: Jakob Nielsen, "Progressive Disclosure" (https://www.nngroup.com/articles/progressive-disclosure/).

## 4. Familiar and forgiving

The laws of UX in one line each (https://lawsofux.com):

- **Hick:** the more choices, the slower the decision. Offer fewer.
- **Fitts:** big and close is quicker to hit. Targets are at least 44 px, and the main action sits near where the eye already is.
- **Jakob:** people expect what other apps do. Put account, name and sign out where people look for them; do not invent a new place.
- **Miller:** people hold only a few things in mind. Keep a group of menu items or tabs short (about seven).
- **Postel:** accept what people type in any reasonable form (spaces in a phone number, capital letters), and ask for less in the first place.

## 5. Always show what is happening

After every click the person can see the result. No silent buttons.

- A button that saves, sends or deletes shows that it is working (the button itself changes, with a spinner or "Saving..."), then says what happened ("Saved", "Not saved: the price is too high").
- Anything that takes more than a moment shows a loading state at once, in the shape of what is coming (`kit/Skeleton`). A blank page is never the answer.
- Success is quiet and short (a small message that fades). Failure stays until the person has read it.
- A screen that is waiting on something says what it is waiting for.

## 6. Undo instead of "Are you sure?"

Let people take an action back, instead of asking them first. It is fewer clicks and a safer result.

- Deleting moves the thing to the recycle bin and shows "Deleted. Undo" for a few seconds. Money is never deleted at all (`docs/rules/rules.md`).
- Ask first only when an action cannot be undone, and then say what will happen in plain words ("Remove Sculpt from the class list? Its photo is removed too."), with a button that names the action, not "OK".
- A dangerous button never sits next to the main one.

## 7. An empty page tells you the next step

A page with nothing on it is not blank. It says what belongs here and offers the one action to start.

- "No classes yet. Add your first class." with an **Add a class** button. This is the page's one clear task (rule 2).
- A search or filter with no result says so and offers to clear it.
- Never show an empty table with only headings.

## 8. Plain errors, next to the problem

- Say what went wrong and how to fix it, in everyday words: "The price is too high. Use 99,999 or less." Never a code, never "Something went wrong".
- Show the message next to the field it belongs to, and keep what the person typed.
- Do not blame the person. Do not show technical details on the screen; they go in the log.
- Where a mistake can be prevented, prevent it: a date picker instead of typed dates, a dropdown instead of free text.

Based on Nielsen's usability heuristics (https://www.nngroup.com/articles/ten-usability-heuristics/): visibility of system status, user control and freedom, and help with errors.

## Before you show a screen

1. What is the one thing to do here? Is it obvious?
2. What can I remove? Does it still feel complete?
3. How many clicks does each common task take? Can it be one?
4. Is anything people use daily hidden behind another click?
5. After each click, can the person see that something happened, and what?
6. Can the person undo it? If not, does the question say plainly what will happen?
7. If the page is empty, does it say what to do next?
8. If it fails, does the message say how to fix it, next to the problem?

## Further reading

- Nielsen Norman Group, "10 Usability Heuristics for User Interface Design" (https://www.nngroup.com/articles/ten-usability-heuristics/)
- Christopher Butler, "Simplification Takes Courage" (https://chrbutler.com/simplification-takes-courage)
- Smashing Magazine, "Better Form Design: One Thing Per Page" (https://www.smashingmagazine.com/2017/05/better-form-design-one-thing-per-page/)
- UX Magazine, "One main call to action per task" (https://uxmag.com/articles/usability-tip-one-main-call-to-action-item-per-task)
