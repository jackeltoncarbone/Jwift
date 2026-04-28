# Apple Wizards & Multi-Step Flows — Research

What Apple actually does for guided multi-step setup flows, and what the
HIG says about progress indicators in that context.

---

## The two patterns Apple distinguishes

Apple's HIG splits two concepts that are commonly conflated:

### Progress indicator (bar / spinner)
Strictly for **tasks with a duration that's processing** — file
conversion, loading, syncing, exporting. Either *determinate* (a known
duration with a filling bar) or *indeterminate* (a spinner). Not for
navigation, not for "you are 3 of 7 questions in."

### Page control (dots)
For navigating between **flat, equivalent pages** — short intro
carousels, image galleries. The "•••○••" you see at the bottom of a
3-to-5-screen onboarding intro. Each page is interchangeable in weight
and order doesn't strictly imply progress, just position.

---

## What Apple's own multi-step flows actually use

### iOS Setup Assistant (iPhone first-boot)
Hello → language → region → Wi-Fi → Apple ID → Face ID → privacy → ...

**No progress indicator at all.** No bar, no dots, no "Step 3 of 12."
Just the title, the content, and a primary action button. The user
goes step by step and the title tells them what they're doing.

### Apple Watch pairing
Same. Animated pairing screen, Apple Account, passcode, settings,
permissions. No progress bar. No step counter. Each screen stands on
its own.

### iCloud / Family Sharing / Focus mode setup
Same. Step → Step → Done. No orientation chrome.

### Short flat onboarding carousels (3-5 screens)
*This* is where Apple uses page-control dots — when there are a
handful of equivalent intro screens that the user swipes through.
Not for branching guided wizards.

### Photos shared library setup, Apple Music sign-up
Step → Continue → Continue → Done. No indicator.

---

## The takeaway

For a **short flat carousel** (3-5 informational screens of equal
weight): **page dots**.

For a **long guided wizard** (Setup Assistant shape — branching, 5+
steps, each step doing something different): **nothing**. The title
and content orient the user. Trust them to keep going.

Putting a progress bar at the top of each wizard step is technically
misusing the "progress indicator" pattern per HIG — that pattern is
for ongoing tasks, not for "you are partway through a question
sequence."

---

## Sources

- [Progress indicators — Apple HIG](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)
- [Page controls — Apple HIG](https://developer.apple.com/design/human-interface-guidelines/page-controls)
- [Onboarding — Apple HIG](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- [Page Control patterns — Mobbin](https://mobbin.com/glossary/page-control)
- [Set up your Apple Watch — Apple Support](https://support.apple.com/en-us/109015)
