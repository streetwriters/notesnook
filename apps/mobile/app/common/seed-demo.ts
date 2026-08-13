/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * DEMO DATA SEEDER — for producing App Store / Play Store screenshots.
 *
 * NOT PART OF THE SHIPPING APP. Delete this file and its entry in
 * screens/settings/settings-data.tsx once the store assets are captured.
 * See audit/screenshot-content-spec.md on the website repo for the reasoning
 * behind the content.
 *
 * Kept byte-for-byte in step with apps/web/src/common/seed-demo.ts apart
 * from the db import. It is duplicated rather than shared because the whole
 * thing is temporary; if you edit one, edit the other.
 *
 * Run against a FRESH, EMPTY account. It does not clean up after itself.
 */

import { db } from "./database";

const VAULT_PASSWORD = "demo-vault-2026";

/** All dates land inside Jun–Oct 2026 so nothing reads as stale on camera. */
const D = (iso: string, time = "10:24") =>
  new Date(`${iso}T${time}:00`).getTime();

/**
 * Reminders the marketing site renders as "Today" / "Tomorrow" are computed
 * from the clock instead of pinned to a date, so a demo account seeded in
 * March still shows a reminder due today rather than one from last year.
 */
const REL = (dayOffset: number, time: string) => {
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
};

// ---------------------------------------------------------------------------
// content helpers — these emit the exact HTML the Notesnook editor parses back
// ---------------------------------------------------------------------------

const p = (...lines: string[]) => lines.map((l) => `<p>${l}</p>`).join("");
const h = (level: 2 | 3 | 4, text: string) =>
  `<h${level}>${text}</h${level}>`;
const quote = (text: string) => `<blockquote><p>${text}</p></blockquote>`;
const bullets = (...items: string[]) =>
  `<ul>${items.map((i) => `<li><p>${i}</p></li>`).join("")}</ul>`;
const numbered = (...items: string[]) =>
  `<ol>${items.map((i) => `<li><p>${i}</p></li>`).join("")}</ol>`;

/** Prefix an item with "x " to render it checked. */
const tasks = (...items: string[]) =>
  `<ul class="checklist">${items
    .map((i) => {
      const checked = i.startsWith("x ");
      const text = checked ? i.slice(2) : i;
      return `<li class="checklist--item${
        checked ? " checked" : ""
      }"><p>${text}</p></li>`;
    })
    .join("")}</ul>`;

/** type must be one of the editor's CALLOUT_TYPES (note/info/tip/important/…). */
const callout = (type: string, text: string) =>
  `<div class="callout" data-callout-type="${type}"><h4>${type.toUpperCase()}</h4><p>${text}</p></div>`;

const table = (head: string[], rows: string[][]) =>
  `<table><tbody><tr>${head
    .map((c) => `<th><p>${c}</p></th>`)
    .join("")}</tr>${rows
    .map((r) => `<tr>${r.map((c) => `<td><p>${c}</p></td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

/**
 * Note links. The real href needs a note id that does not exist until the note
 * is created, so authored content uses {{key}} and a second pass rewrites it.
 */
const link = (key: string, text: string) => `{{${key}|${text}}}`;
const LINK_RE = /\{\{([a-z0-9-]+)\|([^}]+)\}\}/g;

/**
 * A remote image.
 *
 * Seeding an attachment properly would mean encrypting a blob and writing the
 * key, hash and IV by hand. It is not necessary: the editor's image node sees
 * a non-data `src` on first render, downloads it, and calls updateAttachment
 * with the result — so a plain remote URL becomes a real, encrypted attachment
 * the first time the note is opened. Open every image note once before
 * capturing, and let the downloads settle.
 *
 * Picsum ids are stable, so the same seed produces the same pictures.
 */
const img = (id: number, w = 1200, h = 800) =>
  `<img src="https://picsum.photos/id/${id}/${w}/${h}" />`;

/** `<pre>` is parsed with preserveWhitespace: "full", so indentation is kept. */
const code = (language: string, ...lines: string[]) =>
  `<pre class="language-${language}"><code>${lines
    .join("\n")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</code></pre>`;

/** Collapsible outline list — `> ` on a child indents it one level. */
const outline = (...items: (string | string[])[]) =>
  `<ul data-type="outlineList">${items
    .map((item) =>
      Array.isArray(item)
        ? `<li data-type="outlineListItem"><p>${item[0]}</p>${
            item.length > 1
              ? `<ul data-type="outlineList">${item
                  .slice(1)
                  .map(
                    (c) => `<li data-type="outlineListItem"><p>${c}</p></li>`
                  )
                  .join("")}</ul>`
              : ""
          }</li>`
        : `<li data-type="outlineListItem"><p>${item}</p></li>`
    )
    .join("")}</ul>`;

const math = (latex: string) =>
  `<div class="math-block math-node">${latex}</div>`;

/**
 * Highlight.
 *
 * Not `<mark>` — this editor implements highlighting as a `backgroundColor`
 * attribute on TextStyle, which parses `<span>` with an inline style. A
 * `<mark>` tag has no parse rule, so the text would survive and the highlight
 * would silently vanish.
 */
const mark = (text: string, color = "#ffd60066") =>
  `<span style="background-color: ${color}">${text}</span>`;

// ---------------------------------------------------------------------------
// structure
// ---------------------------------------------------------------------------

/**
 * `Personal › Health` and `Personal › Admin` are the two paths the marketing
 * site puts on screen (the note cards in the opening section, and the source
 * note in the linked-notes thread), so Health, Admin and Money sit under
 * Personal here rather than at the top level.
 */
const NOTEBOOKS: { key: string; title: string; parent?: string }[] = [
  { key: "work", title: "Work" },
  { key: "work-clients", title: "Client Projects", parent: "work" },
  { key: "work-meetings", title: "Meetings", parent: "work" },
  { key: "work-1on1s", title: "1:1s", parent: "work" },
  { key: "masters", title: "Master's — Behavioural Science" },
  { key: "masters-lectures", title: "Lectures", parent: "masters" },
  { key: "masters-reading", title: "Reading Notes", parent: "masters" },
  { key: "masters-thesis", title: "Thesis", parent: "masters" },
  { key: "personal", title: "Personal" },
  { key: "personal-health", title: "Health", parent: "personal" },
  { key: "personal-admin", title: "Admin", parent: "personal" },
  { key: "personal-money", title: "Money", parent: "personal" },
  { key: "home", title: "Home & Life" },
  { key: "home-recipes", title: "Recipes", parent: "home" },
  { key: "home-travel", title: "Travel", parent: "home" },
  { key: "inbox", title: "Inbox" },
  { key: "journal", title: "Journal" }
];

/** colorCode values are Notesnook's own DefaultColors. */
const COLORS: { key: string; title: string; colorCode: string }[] = [
  { key: "blue", title: "Work", colorCode: "#2196F3" },
  { key: "purple", title: "Study", colorCode: "#673AB7" },
  { key: "yellow", title: "Travel", colorCode: "#FFD600" },
  { key: "red", title: "Health", colorCode: "#f44336" },
  { key: "green", title: "Money", colorCode: "#4CAF50" }
];

const TAGS = [
  "followup",
  "urgent",
  "q4-planning",
  "reading",
  "lisbon",
  "recipe",
  "idea",
  "admin"
];

type SeedNote = {
  key: string;
  title: string;
  notebook: string;
  content: string;
  date: string;
  tags?: string[];
  color?: string;
  pinned?: boolean;
  favorite?: boolean;
  vault?: boolean;
};

// ---------------------------------------------------------------------------
// the 14 hero notes — these are what the camera sees
// ---------------------------------------------------------------------------

const HERO_NOTES: SeedNote[] = [
  {
    key: "h1-campaign-brief",
    title: "Q4 campaign brief — Northwind rollout",
    notebook: "work-clients",
    tags: ["q4-planning", "followup"],
    color: "blue",
    pinned: true,
    date: "2026-07-29",
    content: [
      p(
        "Brief for the Q4 rollout, written up after three weeks of calls. This is the version Dara signs off, so everything contested is marked as such rather than smoothed over."
      ),
      h(2, "Where we landed"),
      p(
        "Northwind wants the rollout framed around reliability, not price. Their churn is coming from mid-size accounts who think we're a startup that might disappear. So: proof, not promises."
      ),
      quote('Positioning: "The boring one that never goes down."'),
      p(
        `The temptation is to answer the price objection because it is the one we hear out loud. It is not the one costing us renewals. Every churned account this year cited cost in the exit survey and something else in the exit call, and the something else was always ${mark(
          "\"we were not sure you would be here in two years\""
        )}.`
      ),
      h(2, "Who we are talking to"),
      table(
        ["Segment", "ARR band", "Churn (12mo)", "What they ask first"],
        [
          ["Enterprise", "250k+", "4%", "Compliance and SSO"],
          ["Mid-market", "40–250k", "19%", "Who else your size uses this"],
          ["SMB", "under 40k", "31%", "Price, then price again"],
          ["Education", "any", "6%", "Data residency"]
        ]
      ),
      p(
        "Mid-market is the whole problem. Enterprise is fine, SMB churn is structural and always has been, and education renews on autopilot. Nineteen percent in the band that pays most of the bills is the number this campaign exists to move."
      ),
      h(2, "The three proofs"),
      outline(
        [
          "<strong>Uptime, stated plainly</strong>",
          "18 months of raw numbers, not a nine-count",
          "Including the two incidents — hiding them is what makes people check",
          "Ops have the data, Sam is turning it into one chart"
        ],
        [
          "<strong>Customers on the record</strong>",
          "Halvorsen — the outage they avoided, quote pending legal",
          "Trelane — four years, no escalations, quote already cleared",
          "Fieldgate — happy but slow to reply, treat as optional"
        ],
        [
          "<strong>The boring roadmap</strong>",
          "What shipped in the last four quarters, dated",
          "Deliberately unexciting. That is the argument."
        ]
      ),
      h(2, "Open items"),
      tasks(
        "x Pull 18-month uptime numbers from ops",
        "x Confirm the three customers who'll go on record",
        "x Agree the positioning line with Dara",
        "Draft the case study outline — due Fri 7 Aug",
        "Get legal sign-off on the Halvorsen quote",
        "Book the studio for testimonial filming",
        "Rewrite the pricing page intro so it stops leading with cost",
        "Brief the agency, or decide not to use them"
      ),
      h(2, "Budget split"),
      table(
        ["Channel", "Q3 spend", "Q4 proposed", "Change", "Why"],
        [
          ["Paid search", "42,000", "38,000", "-9.5%", "Bidding against ourselves on brand"],
          ["Case studies", "8,000", "24,000", "+200%", "The whole thesis"],
          ["Events", "31,000", "18,000", "-42%", "June cost-per-lead was indefensible"],
          ["Content", "12,000", "19,000", "+58%", "Two writers instead of one"],
          ["Tooling", "4,000", "4,000", "0%", "Renewals only"]
        ]
      ),
      p(
        "Net movement is flat, which is the point — this is a reallocation, not a request. If it is presented as a request it gets cut."
      ),
      callout(
        "important",
        "Dara wants the full deck by 12 August, not the 19th. Everything above moves up a week."
      ),
      h(2, "How we will know it worked"),
      numbered(
        "Mid-market churn under 12% by the end of Q1. Anything else is noise.",
        "Case study pages in the top three landing pages by assisted conversions.",
        "Sales stops sending the reliability question to me, because the page answers it."
      ),
      p(
        `Tracking is already in place for the first two. The third is a feeling and I am going to measure it by asking Priya in January.`
      ),
      h(2, "Where this could go wrong"),
      bullets(
        "Legal sits on the Halvorsen quote and the whole thing runs on one customer",
        "Ops numbers come back worse than remembered — in which case we publish them anyway and change the framing to \"and here is what we did about it\"",
        "Northwind's own marketing team wants approval on the case study, which adds three weeks nobody has"
      ),
      h(2, "Next"),
      p(
        "Send the outline to Priya before Thursday standup. If legal drags on the Halvorsen quote, swap in the Trelane one — already cleared."
      ),
      p(
        `Handover context for anyone picking this up while I am away: ${link(
          "s10-handover",
          "Handover — Q3 accounts"
        )}.`
      )
    ].join("")
  },
  {
    key: "h2-weekly-review",
    title: "Weekly review — 24 July",
    notebook: "journal",
    pinned: true,
    favorite: true,
    date: "2026-07-24",
    content: [
      p(
        "Slept badly most of the week. Three nights under six hours and it showed by Thursday — snapped at Priya in standup over something that wasn't her fault. Apologised after. Still annoyed at myself."
      ),
      p("<strong>Good:</strong>"),
      bullets(
        "Finished the Northwind brief a day early",
        "Ran twice. First time since May.",
        "Actually cooked instead of ordering in, four nights out of seven"
      ),
      p("<strong>Less good:</strong>"),
      bullets(
        "Avoided the conversation with Dara about the promotion again",
        "Reading for the thesis has stalled at chapter 3"
      ),
      p("<strong>The week in numbers:</strong>"),
      table(
        ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        [
          ["Slept", "5h10", "6h20", "5h40", "5h00", "6h50", "7h30", "6h40"],
          ["Ran", "—", "3.2km", "—", "—", "—", "4.8km", "—"],
          ["Cooked", "yes", "yes", "no", "no", "yes", "yes", "no"],
          ["Good day", "no", "yes", "yes", "no", "yes", "yes", "yes"]
        ]
      ),
      p(
        `The two nights over seven hours were both weekends, which is the whole pattern in one line. ${mark(
          "Thursday was the worst night and Thursday was the day I snapped at Priya."
        )} I would like that to be a coincidence.`
      ),
      h(2, "The promotion thing"),
      p(
        'It is the one that matters. I keep telling myself I\'ll raise it "when the quarter settles" and the quarter never settles. Put it on the 1:1 agenda for the 4th. Written down, so now it\'s real.'
      ),
      p(
        `The number and the argument are already worked out in ${link(
          "h3-salary-prep",
          "Salary conversation — prep"
        )}. There is nothing left to prepare. That is what makes the delay embarrassing rather than sensible.`
      ),
      h(2, "Next week"),
      tasks(
        "Raise it on the 4th. First item, not last.",
        "Two runs, and one of them on a weekday",
        "Reading — get past chapter 3 or admit the book is not happening",
        "x Book the GP follow-up"
      ),
      p(
        "Dr. Ferris moved the follow-up to 19 August — need to bring the sleep log."
      ),
      quote(
        "Pattern I notice writing these: the weeks I describe as bad are the weeks I slept badly, not the weeks anything bad happened."
      )
    ].join("")
  },
  {
    key: "h3-salary-prep",
    title: "Salary conversation — prep",
    notebook: "personal-money",
    color: "green",
    favorite: true,
    date: "2026-07-27",
    content: [
      h(2, "The number"),
      p(
        "Asking for <strong>72,000</strong>. Floor is 66,000 — below that I start looking."
      ),
      p(
        "Current: 58,500. Last raise was 19 months ago (Jan 2025), 3% cost of living, which was a real-terms cut."
      ),
      h(2, "The case"),
      bullets(
        "Took over the whole campaign function when Ines left in March — no title change, no adjustment",
        "Northwind renewal (~340k ARR) closed on the back of the case study programme I built",
        "Two market comparables for this scope in this city: 68k and 76k"
      ),
      h(2, "What Dara will say"),
      callout("question", "\"The budget cycle doesn't open until January.\""),
      p(
        "Response: fine — agree the number now, effective January, in writing. The delay is acceptable. The vagueness is not."
      ),
      h(2, "The arithmetic, so I can say it without doing it in my head"),
      table(
        ["", "Now", "Ask", "Floor"],
        [
          ["Base", "58,500", "72,000", "66,000"],
          ["vs. last raise (Jan 2025)", "+3%", "+23%", "+13%"],
          ["Real terms since then", "-4.1%", "+14%", "+5%"],
          ["Market band, this scope", "—", "68–76k", "68–76k"]
        ]
      ),
      p(
        `Inflation over the period was 7.4%. A 3% raise against that is ${mark(
          "a 4.1% pay cut"
        )}, and I have been describing it as \"a small raise\" for eighteen months.`
      ),
      h(2, "The three sentences"),
      numbered(
        "I took on the campaign function in March and it has not been reflected in title or pay.",
        "The scope I am carrying pays 68 to 76 in this city, and I am at 58.5.",
        "I would like to agree 72 and the title, effective now, or agreed now and effective January."
      ),
      p(
        "Say them and stop. The mistake last time was filling the silence, and the silence is where the answer comes from."
      ),
      h(2, "What Dara will say"),
      outline(
        [
          "<strong>\"The budget cycle doesn't open until January.\"</strong>",
          "Fine — agree the number now, effective January, in writing",
          "The delay is acceptable. The vagueness is not.",
          "If it cannot be in writing, it is not an agreement, it is a mood"
        ],
        [
          "<strong>\"Let me see what I can do.\"</strong>",
          "Ask what the constraint actually is: budget, band, or approval",
          "Each has a different answer and I want to know which one we are in"
        ],
        [
          "<strong>\"You're already at the top of your band.\"</strong>",
          "Then the band is wrong for the scope, which is a title conversation",
          "Which is the conversation I am trying to have"
        ]
      ),
      h(2, "Not negotiable"),
      p(
        "Whatever the number lands at, I want the title changed at the same time. Doing the job without the title is what got me here."
      ),
      callout(
        "tip",
        "If the answer is no with no path attached, that is information rather than a defeat. Write it down the same evening, while it is still accurate."
      ),
      p(
        `Agenda for the day is in ${link(
          "h9-1on1-dara",
          "1:1 with Dara — 4 August"
        )}.`
      )
    ].join("")
  },
  {
    key: "h4-lisbon",
    title: "Lisbon — October",
    notebook: "home-travel",
    tags: ["lisbon"],
    color: "yellow",
    pinned: true,
    date: "2026-07-30",
    content: [
      p("<strong>11–18 October.</strong> Flights booked, LIS 09:40 out, 18:20 back."),
      img(417),
      h(2, "Staying"),
      p(
        "Alfama, two nights — then Príncipe Real for the rest. Splitting it because Alfama looks exhausting for a full week and the hills are not a joke."
      ),
      h(2, "Booked"),
      tasks(
        "x Flights",
        "x Alfama apartment (11–13 Oct)",
        "Príncipe Real — hold expires <strong>8 August</strong>",
        "Travel insurance",
        "Tell the bank about the card"
      ),
      h(2, "List"),
      bullets(
        "Time-out market — go early, it's a scrum by noon",
        "Day trip to Sintra, but on a weekday",
        "The tram everyone photographs, but at 7am",
        "Livraria Bertrand",
        "Pastéis de Belém, obviously"
      ),
      callout(
        "tip",
        "Miguel says skip the castle queue and go to the viewpoint above it instead — same view, no ticket."
      ),
      h(2, "Rough shape of the week"),
      table(
        ["Day", "Plan", "Booked"],
        [
          ["Sat 11", "Land 12:15, Alfama, nothing else", "Apartment"],
          ["Sun 12", "Time-out market early, then wander", "—"],
          ["Mon 13", "Move to Príncipe Real, Gulbenkian", "Hold expires 8 Aug"],
          ["Tue 14", "Sintra, weekday on purpose", "Train, buy on the day"],
          ["Wed 15", "Nothing. Deliberately nothing.", "—"],
          ["Thu 16", "Belém, the tram at 7am", "—"],
          ["Fri 17", "Livraria Bertrand, last things", "—"],
          ["Sat 18", "Fly 18:20", "Flight"]
        ]
      ),
      h(2, "Budget"),
      p(
        "Roughly 1,400 all in. Flights were 210, apartments about 620, so ~570 for everything else across seven days. Tight but fine."
      ),
      table(
        ["", "Budget", "Paid", "Left"],
        [
          ["Flights", "210", "210", "0"],
          ["Apartments", "620", "310", "310"],
          ["Food", "350", "—", "350"],
          ["Trains and trams", "60", "—", "60"],
          ["Everything else", "160", "—", "160"]
        ]
      ),
      callout(
        "note",
        "Card is fine abroad but the bank still needs telling, and the GHIC has expired — both on the list above and neither will be done until the week before."
      ),
      p(
        `Passport details for the booking forms are in ${link(
          "s9-passport",
          "Passport &amp; bank details"
        )}.`
      )
    ].join("")
  },
  {
    key: "h5-nudges",
    title: "Behavioural nudges — reading notes",
    notebook: "masters-reading",
    tags: ["reading"],
    color: "purple",
    date: "2026-07-26",
    content: [
      p("Third pass through the chapter. The distinction that finally clicked:"),
      quote(
        "A nudge changes the <em>architecture</em> of a choice without removing any of the options. The moment you remove an option it stops being a nudge and starts being a mandate."
      ),
      h(2, "Where the line actually falls"),
      p("Default enrolment is a nudge — you can opt out in one click."),
      p(
        "Opt-out buried in a settings sub-menu is not a nudge. It's friction dressed up as choice."
      ),
      p(
        `Which is the whole argument in ${link(
          "h7-dark-patterns",
          "Dark patterns — case collection"
        )} and the reason I want that as chapter 4 rather than an appendix.`
      ),
      h(2, "For the thesis"),
      p(
        "The gap in the literature is measurement. Everyone cites the pension studies because the outcome is a single number. Nobody has a clean design for nudges where the outcome is qualitative."
      ),
      p(
        `That's the opening — see ${link("h6-thesis-outline", "Thesis outline v3")}.`
      ),
      h(2, "The four levers, from lecture 9"),
      table(
        ["Lever", "Example", "Still a nudge?", "Why"],
        [
          ["Default", "Auto-enrolment", "Yes", "One click to leave"],
          ["Framing", "\"90% lean\" vs \"10% fat\"", "Yes", "Same options, same cost"],
          ["Friction", "Extra step to cancel", "No", "Cost is asymmetric by design"],
          ["Salience", "Bigger, earlier, brighter", "Usually", "Depends what is hidden"]
        ]
      ),
      p(
        `Friction is the interesting column. It is the only lever where the same mechanism produces a nudge or a dark pattern depending purely on which direction it points, which is ${mark(
          "the entire argument of chapter 4"
        )} compressed into one row.`
      ),
      h(2, "Follow up"),
      bullets(
        "Find the 2024 replication. Cited everywhere, I have never seen it.",
        "Ask Dr. Okafor whether the ethics board treats a nudge study differently from a straight A/B test",
        "Chase the original Thaler footnote — three papers cite it for a claim I cannot find in it"
      )
    ].join("")
  },
  {
    key: "h6-thesis-outline",
    title: "Thesis outline v3",
    notebook: "masters-thesis",
    color: "purple",
    date: "2026-07-18",
    content: [
      p("Restructured after the supervision meeting. v2 buried the argument."),
      numbered(
        "<strong>Introduction</strong> — the measurement gap, not the ethics debate",
        "<strong>Literature</strong> — why the pension studies dominate and what that costs us",
        "<strong>Method</strong> — mixed, 40 participants, diary study plus interviews",
        `<strong>Dark patterns as inverted nudges</strong> — see ${link(
          "h7-dark-patterns",
          "Dark patterns — case collection"
        )}`,
        "<strong>Findings</strong>",
        "<strong>Discussion</strong>",
        "<strong>Limitations</strong> — small n, single sector, self-selection"
      ),
      p(
        'Dr. Okafor\'s note: "Chapter 4 is the paper. Everything else is context."'
      ),
      h(2, "Method, in more detail than the outline needs"),
      p(
        "Mixed design. Forty participants, fourteen-day diary study with a daily prompt, then semi-structured interviews with a subset of twelve chosen for variation rather than representativeness."
      ),
      table(
        ["", "Diary", "Interviews"],
        [
          ["n", "40", "12"],
          ["Duration", "14 days", "45–60 min"],
          ["Prompt", "Daily, 8pm", "Semi-structured"],
          ["Analysis", "Descriptive + effect size", "Reflexive thematic"],
          ["Risk", "Attrition after day 5", "Interviewer effects"]
        ]
      ),
      p(
        "Powering it on the standardised mean difference, because the whole complaint in chapter 1 is that this literature reports significance and not magnitude:"
      ),
      math("d = \\frac{\\bar{x}_1 - \\bar{x}_2}{s_p} \\quad\\text{where}\\quad s_p = \\sqrt{\\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}}"),
      p(
        `At n=40 and the effect sizes reported in the pension literature (d ≈ 0.3) this is ${mark(
          "underpowered and I am going to say so in the limitations rather than pretend otherwise"
        )}. The diary data is the contribution; the comparison is secondary.`
      ),
      h(2, "Analysis, roughly"),
      code(
        "r",
        "# diary data: one row per participant per day",
        "diary <- read_csv(\"data/diary_clean.csv\")",
        "",
        "completion <- diary %>%",
        "  group_by(participant) %>%",
        "  summarise(days = n_distinct(day), .groups = \"drop\") %>%",
        "  mutate(complete = days >= 10)",
        "",
        "# attrition is the number that decides whether any of this holds up",
        "mean(completion$complete)",
        "",
        "effects <- diary %>%",
        "  filter(participant %in% completion$participant[completion$complete]) %>%",
        "  group_by(condition) %>%",
        "  summarise(m = mean(score), s = sd(score), n = n())"
      ),
      callout(
        "note",
        "Pre-register before collection, not after. Okafor asked twice and I have not done it."
      ),
      p("Draft of 1–3 due <strong>15 September</strong>. Full draft December.")
    ].join("")
  },
  {
    key: "h7-dark-patterns",
    title: "Dark patterns — case collection",
    notebook: "masters-reading",
    tags: ["reading"],
    color: "purple",
    date: "2026-07-25",
    content: [
      p(
        "Running collection for chapter 4. Screenshot everything — half of these get quietly fixed and then the evidence is gone."
      ),
      h(3, "Confirmshaming"),
      p(
        "\"No thanks, I don't like saving money.\" Ubiquitous, mild, and it works, which is the uncomfortable part."
      ),
      h(3, "Roach motel"),
      p(
        "Two clicks to subscribe, a phone call during business hours to cancel. The asymmetry <em>is</em> the design."
      ),
      h(3, "Pre-selected add-ons"),
      p(
        `Insurance and seat selection ticked by default at checkout. This is the cleanest inversion of ${link(
          "h5-nudges",
          "Behavioural nudges — reading notes"
        )} — same mechanism, opposite intent.`
      ),
      h(3, "Obscured pricing"),
      p("Base price large, mandatory fees at step four of five."),
      h(2, "Coding frame, first attempt"),
      table(
        ["Code", "Definition", "Cases", "Disputed"],
        [
          ["Asymmetric exit", "Leaving costs more than joining", "5", "0"],
          ["Manufactured urgency", "Scarcity that is not scarce", "3", "1"],
          ["Emotional framing", "Declining is worded as a flaw", "2", "0"],
          ["Deferred cost", "Price completes after commitment", "2", "1"]
        ]
      ),
      p(
        "The two disputed ones are disputed by me, a week apart, which is its own finding about the reliability of a single coder."
      ),
      quote(
        "A nudge you would be comfortable explaining to the person it was aimed at. That is the whole test, and it is not rigorous enough to publish."
      ),
      p("Twelve cases so far. Want thirty before I start coding them.")
    ].join("")
  },
  {
    key: "h8-prescription",
    title: "Repeat prescription + GP notes",
    notebook: "personal-health",
    color: "red",
    vault: true,
    date: "2026-07-22",
    content: [
      p("New practice: Fieldgate Surgery. Registered 3 June."),
      p("Dr. Ferris — Tues/Thurs only."),
      h(2, "Repeat"),
      bullets(
        "Levothyroxine 75mcg — daily, review every 6 months",
        "Next review: <strong>19 August</strong>",
        "Pharmacy: Bellamy's on Carrow St, they text when it's ready"
      ),
      h(2, "Bloods — 12 June"),
      p(
        "TSH back in range (2.1). Ferritin still low at 24, so iron continues for another three months and we re-test in September."
      ),
      h(2, "Sleep log"),
      p(
        "Started 14 July at Dr. Ferris's request. Two weeks of data by the follow-up. Averaging 5h40 which is worse than I thought before I started writing it down."
      ),
      h(2, "Family history"),
      p(
        "Mum — thyroid, diagnosed early 40s. Dad — high blood pressure from 50. Both on the form already, noting here so I stop re-deriving it in waiting rooms."
      )
    ].join("")
  },
  {
    key: "h9-1on1-dara",
    title: "1:1 with Dara — 4 August",
    notebook: "work-1on1s",
    tags: ["followup"],
    color: "blue",
    date: "2026-07-31",
    content: [
      h(2, "My agenda"),
      numbered(
        `<strong>The promotion conversation.</strong> Not hinting this time. See ${link(
          "h3-salary-prep",
          "Salary conversation — prep"
        )}.`,
        "Northwind deck moved to the 12th — need Priya for two days or it slips",
        "Contractor budget for Q4: yes or no by end of August"
      ),
      h(2, "Carried over from 21 July"),
      tasks(
        "x Ines's accounts formally reassigned",
        "Still no answer on the events budget"
      ),
      h(2, "Notes"),
      p("(fill in during)")
    ].join("")
  },
  {
    key: "h10-pasta",
    title: "Slow-roast tomato pasta",
    notebook: "home-recipes",
    tags: ["recipe"],
    favorite: true,
    date: "2026-07-19",
    content: [
      p("Adapted from Nonna Trelane's, minus the sugar. Feeds 4."),
      img(292),
      h(2, "You need"),
      bullets(
        "1kg cherry tomatoes",
        "1 whole head of garlic",
        "200ml olive oil — the good one, it's the whole sauce",
        "2 sprigs rosemary",
        "500g rigatoni",
        "Parmesan, a lot",
        "Chilli flakes"
      ),
      h(2, "Method"),
      numbered(
        "Oven to 160°C. Low and slow — this is the entire trick.",
        "Tomatoes in a dish, garlic cloves scattered whole and unpeeled, rosemary on top. Drown it in the oil.",
        "<strong>90 minutes.</strong> Do not rush it. At 60 it's fine, at 90 it's a different dish.",
        "Fish out the rosemary. Squeeze the garlic out of the skins, back in.",
        "Crush with a fork. Not a blender — you want it rough.",
        "Pasta, reserve a mug of the water, combine, loosen with the water."
      ),
      h(2, "Timings"),
      table(
        ["Time", "What"],
        [
          ["0:00", "Oven on. Tomatoes, garlic, rosemary, oil."],
          ["0:10", "In the oven. Walk away."],
          ["1:30", "Out. Rosemary out, garlic squeezed back in."],
          ["1:35", "Pasta on."],
          ["1:45", "Crush, combine, loosen, eat."]
        ]
      ),
      callout(
        "tip",
        "Doubles perfectly and the sauce freezes for three months. Make the full kilo even for two people."
      ),
      h(2, "What I have changed"),
      bullets(
        "No sugar. The original had a teaspoon and it does not need it at 90 minutes.",
        "Whole unpeeled garlic instead of sliced — sliced burns and turns bitter by the hour mark.",
        "Rigatoni not spaghetti. The sauce is rough and needs somewhere to sit.",
        "160°C, not 180. At 180 it roasts. At 160 it collapses, which is the point."
      ),
      h(2, "Log"),
      table(
        ["Date", "For", "Changed", "Verdict"],
        [
          ["19 Jul", "Priya, Sam", "Nothing", "Best yet. Froze half."],
          ["28 Jun", "Just me", "Half batch", "Do not half it, the oil ratio breaks"],
          ["3 Jun", "Mum", "Added chilli early", "Too hot by the end, add at the table"]
        ]
      ),
      p(
        "Made it 19 July for Priya and Sam — the second batch went in the freezer."
      )
    ].join("")
  },
  {
    key: "h11-boiler",
    title: "Boiler service + warranty",
    notebook: "personal-admin",
    tags: ["admin"],
    date: "2026-07-08",
    content: [
      p("Serviced 8 July, Halvorsen Heating, £94."),
      p(
        "Warranty runs to <strong>March 2029</strong>. Certificate photographed and attached."
      ),
      p(
        'Engineer said the pressure drop is the expansion vessel, not a leak. Fine for now, will need doing "within a couple of years".'
      ),
      p("Next service due July 2027 — reminder set."),
      p(
        "Landlord contact for anything structural: Trelane Property, 0161 496 0182."
      )
    ].join("")
  },
  {
    key: "h12-reading-list",
    title: "Reading list 2026",
    notebook: "masters-reading",
    tags: ["reading"],
    color: "purple",
    favorite: true,
    date: "2026-07-28",
    content: [
      tasks(
        "x The Rise of the Meritocracy — Young",
        "x Seeing Like a State — Scott",
        "x The Managed Heart — Hochschild",
        "Metaphors We Live By — Lakoff &amp; Johnson <em>(in progress, p.140)</em>",
        "The Body Keeps the Score — van der Kolk",
        "Debt: The First 5,000 Years — Graeber",
        "Thinking in Systems — Meadows"
      ),
      p(
        "Target was 24 for the year. On 11 at the end of July, so realistically this is an 18-book year. Fine."
      ),
      p(
        `Notes for anything relevant to chapter 4 go in ${link(
          "h7-dark-patterns",
          "Dark patterns — case collection"
        )}.`
      ),
      img(367)
    ].join("")
  },
  {
    key: "h13-standup",
    title: "Standup — 28 July",
    notebook: "work-meetings",
    color: "blue",
    date: "2026-07-28",
    content: [
      p("Present: Priya, Sam, Dara, me. Ines's replacement starts 11 August."),
      p("<strong>Priya</strong> — case study outline, blocked on legal for the Halvorsen quote"),
      p("<strong>Sam</strong> — landing page rebuild, live Thursday"),
      p("<strong>Me</strong> — Northwind brief done, moving to the deck"),
      h(3, "Decisions"),
      bullets(
        "Deck moves to 12 August",
        "Events budget stays frozen until the Q4 review",
        "Sam owns the landing page copy, not agency"
      ),
      h(3, "Actions"),
      tasks(
        "Me: chase legal by Wednesday",
        "Priya: outline to me before Thursday",
        "x Sam: staging link to the team"
      )
    ].join("")
  },
  {
    key: "h14-flat",
    title: "Things to remember about the new flat",
    notebook: "personal-admin",
    date: "2026-06-30",
    content: bullets(
      "Bin day is Tuesday. Recycling alternate Tuesdays.",
      "Radiator in the back room needs bleeding, key is in the drawer",
      "Window latch upstairs doesn't catch properly — push up then across",
      "Wifi: FIELDGATE-2G, password on the router",
      "Water stopcock is under the stairs, not the kitchen",
      "Neighbour on the left is Mrs Okonjo, has the spare key"
    )
  }
];


// ---------------------------------------------------------------------------
// site notes — every note the marketing site puts on screen
//
// notesnook.com renders real note titles, notebook paths, bodies and reminder
// rows in its illustrations. These exist so a demo account and the website
// show the same account rather than two different fictional people, and so the
// hero screenshot can be cut straight from the app.
// ---------------------------------------------------------------------------

const SITE_NOTES: SeedNote[] = [
  {
    // The note the site's editor mock is typing, and the one the opening
    // section names. It carries the whole argument, so it is the first thing
    // in the list.
    key: "s1-therapy",
    title: "Therapy — what to bring up",
    notebook: "personal-health",
    tags: ["followup"],
    color: "red",
    pinned: true,
    date: "2026-08-07",
    content: [
      p(
        "The promotion conversation again. And that I still haven't told anyone about the diagnosis — not Mum, not anyone at work. I keep deciding I'll say it out loud next week and then not saying it. Ask her whether that is avoidance or just not being ready yet, and what the difference is."
      ),
      h(2, "Things I actually want to get to"),
      bullets(
        "Why telling people feels like handing them something to manage",
        "The Sunday thing — it starts around four and I have stopped pretending it doesn't",
        "Whether the sleep is the cause or the symptom. I have had that argument with myself for a year.",
        "What I do if Dara says no on the 4th",
        "Whether \"I am fine\" counts as lying if I believe it at the time"
      ),
      h(2, "Since last time"),
      p(
        "Did the thing she suggested — wrote down the sentence I would say, word for word, before the call with Mum. Then did not call. But the sentence exists now, which is further than last month."
      ),
      quote(
        "\"You are allowed to tell one person and stop there.\" — from the last session, and the only thing I actually remember from it."
      ),
      p(
        "Three weeks of trying it her way. Writing it down here because I will otherwise report it as \"about the same\", which is what I said last time and was not true."
      ),
      table(
        ["Week", "Told anyone", "Slept (avg)", "Sunday dread", "Notes"],
        [
          ["15 Jul", "No", "5h20", "Bad", "Worst week. Deck deadline moved."],
          ["22 Jul", "No", "5h50", "Bad", "Wrote the sentence. Did not send it."],
          ["29 Jul", "Sam, sort of", "6h10", "Moderate", "Said \"health thing\". He did not push."],
          ["5 Aug", "No change", "5h40", "Moderate", "Better on the days I ran."]
        ]
      ),
      p(
        `The Sam conversation is the only data point that moved anything. It cost nothing. Nobody managed me. ${mark(
          "The thing I was afraid of did not happen and I still cannot generalise from it."
        )}`
      ),
      h(2, "What I keep doing instead"),
      numbered(
        "Deciding to say it next week, which converts a decision into a plan and a plan into nothing",
        "Rehearsing the worst version of the reply until the conversation feels already had",
        "Working late on the days it feels closest, then citing the work as the reason I did not"
      ),
      h(2, "For her, if there is time"),
      p(
        "Ask what the difference is between avoidance and not being ready, in a way I can actually test from the inside. I do not want a definition. I want a question I can ask myself on a Sunday at four."
      ),
      callout(
        "note",
        "Next session 21 August, 6pm. Bring this. Last time I brought nothing and we spent twenty minutes reconstructing the month."
      ),
      p(
        `Sleep log and the numbers are in ${link(
          "s5-blood-results",
          "Blood results &amp; what they mean"
        )} if she asks. Doses in ${link(
          "s6-meds",
          "Meds — current list and doses"
        )}.`
      )
    ].join("")
  },
  {
    // Source note of the linked-notes thread on the site: two notes reference
    // it, and it links out to two others.
    key: "s2-second-opinion",
    title: "Second opinion — what to ask",
    notebook: "personal-health",
    color: "red",
    favorite: true,
    date: "2026-08-10",
    content: [
      p(
        "Going back over what the consultant actually said in March, before Thursday."
      ),
      h(2, "Ask"),
      numbered(
        "Is the dose still right, or is it right for the person I was in March?",
        "What changed between the two blood panels and what would you expect by September?",
        "If we do nothing for six months, what does that cost me?",
        "Is there a reason not to get a second opinion? I would rather ask than go behind it."
      ),
      h(2, "Bring"),
      tasks(
        "x Print both blood panels",
        "x Sleep log, 14 July onward",
        "The list of what I actually take, including the things I forget to mention",
        "The March letter — the one with the handwritten bit at the bottom"
      ),
      callout(
        "important",
        "Do not leave without a written plan and a date. Last two appointments ended with \"let's see how you go\" and that is how six months went past."
      ),
      h(2, "The timeline, so I stop getting it wrong out loud"),
      table(
        ["When", "What happened", "What changed"],
        [
          ["Jan 2026", "GP, first bloods", "Nothing. \"Borderline.\""],
          ["4 Mar", "Consultant, 40 min", "Levothyroxine 50mcg started"],
          ["18 Apr", "Six-week review", "No change, felt no different"],
          ["9 May", "Phone call", "Increased to 75mcg"],
          ["12 Jun", "Second bloods", "TSH normal, ferritin still low"],
          ["14 Jul", "Sleep log started", "Ongoing"]
        ]
      ),
      p(
        "Six months, two dose changes, one number fixed and the tiredness roughly where it started. That is the sentence I want to open with, said flatly rather than as a complaint."
      ),
      h(2, "What I think is happening"),
      p(
        "Not a diagnosis, just the pattern I can see from the notes. The tiredness tracks ferritin more closely than it tracks TSH — the two worst weeks were both before the iron started, and the best fortnight was late June when the second panel came back. If that is real it changes what we are treating. If it is coincidence I would like to be told it is coincidence."
      ),
      quote(
        "\"The number tells you one thing has gone wrong, not that only one thing has gone wrong.\" — her own words, March"
      ),
      p(
        `Context from before: ${link(
          "s3-march-consultation",
          "March consultation — full notes"
        )}.`
      ),
      p(
        `Numbers: ${link(
          "s5-blood-results",
          "Blood results &amp; what they mean"
        )} · Current doses: ${link(
          "s6-meds",
          "Meds — current list and doses"
        )}`
      )
    ].join("")
  },
  {
    key: "s3-march-consultation",
    title: "March consultation — full notes",
    notebook: "personal-health",
    color: "red",
    date: "2026-03-04",
    content: [
      p(
        "Written on the train afterwards, so some of this is paraphrase. Dr. Ferris, 40 minutes, longer than I expected."
      ),
      h(2, "What she said"),
      p(
        "The tiredness is consistent with the thyroid result but not fully explained by it. Her words: the number tells you one thing has gone wrong, not that only one thing has gone wrong."
      ),
      p(
        "Started levothyroxine at 50mcg with a review at six weeks. Said most people feel a difference between weeks two and four and that if I felt nothing by week six she wanted to know rather than have me wait for the appointment."
      ),
      h(2, "The bit I keep coming back to"),
      quote(
        "\"You have been describing this as normal for about two years. It is common. It is not normal.\""
      ),
      h(2, "What I did not ask"),
      p(
        `Everything in ${link(
          "s4-questions-forgot",
          "Questions I forgot to ask last time"
        )} — I wrote it on the way home once the adrenaline wore off.`
      ),
      p(
        `Follow-up is now ${link(
          "s2-second-opinion",
          "Second opinion — what to ask"
        )}.`
      )
    ].join("")
  },
  {
    key: "s4-questions-forgot",
    title: "Questions I forgot to ask last time",
    notebook: "personal-health",
    color: "red",
    date: "2026-03-04",
    content: [
      p(
        "Written on the train home. Still unanswered, so they carry forward every time."
      ),
      bullets(
        "Does the dose change how the iron is absorbed, or is that unrelated?",
        "Is the six-week review a hard six weeks or a rough one?",
        "Am I meant to take it before food or is that folklore?",
        "What would make you want to see me sooner?",
        "Does any of this interact with the thing Mum had?"
      ),
      p(
        `Carried into ${link(
          "s2-second-opinion",
          "Second opinion — what to ask"
        )}.`
      )
    ].join("")
  },
  {
    key: "s5-blood-results",
    title: "Blood results & what they mean",
    notebook: "personal-health",
    color: "red",
    date: "2026-06-12",
    content: [
      p(
        "Two panels, March and June. Writing down what each number is so I stop looking it up every time."
      ),
      table(
        ["Marker", "March", "June", "Range", "Reading"],
        [
          ["TSH", "6.8", "2.1", "0.4–4.0", "Back in range"],
          ["Free T4", "11.2", "15.4", "12–22", "Bottom end, moving"],
          ["Ferritin", "19", "24", "30–200", "Still low"],
          ["Vitamin D", "34", "52", "50–125", "Fixed, keep the supplement"],
          ["B12", "410", "430", "200–900", "Fine, never was the problem"]
        ]
      ),
      h(2, "In plain words"),
      bullets(
        "TSH is the signal to the thyroid. High means the body is shouting. Mine has stopped shouting.",
        "Ferritin is stored iron, not iron in the blood. It is the one still dragging.",
        "The tiredness tracked ferritin better than it tracked TSH, which nobody mentioned and I only noticed by lining the dates up."
      ),
      h(2, "Sleep log"),
      p(
        "Started 14 July at Dr. Ferris's request. Averaging 5h40, which is worse than I thought before I started writing it down. The two nights over seven hours were both weekends."
      ),
      p("Re-test September. Iron continues until then.")
    ].join("")
  },
  {
    key: "s6-meds",
    title: "Meds — current list and doses",
    notebook: "personal-health",
    color: "red",
    date: "2026-06-20",
    content: [
      p("Kept current so I stop reciting it wrong in waiting rooms."),
      table(
        ["What", "Dose", "When", "Since"],
        [
          ["Levothyroxine", "75mcg", "Morning, empty stomach", "March 2026"],
          ["Ferrous fumarate", "210mg", "Evening, with orange juice", "March 2026"],
          ["Vitamin D", "1000 IU", "Morning", "Jan 2025"]
        ]
      ),
      callout(
        "note",
        "Iron and levothyroxine four hours apart. The pharmacist flagged this, not the letter."
      ),
      h(2, "Stopped"),
      bullets(
        "Levothyroxine 50mcg — increased to 75 in May",
        "Multivitamin — pointless alongside the two above"
      ),
      p(
        `Repeat prescription details are in ${link(
          "h8-prescription",
          "Repeat prescription + GP notes"
        )}.`
      )
    ].join("")
  },
  {
    // The site's opening section shows this card next to the therapy note.
    key: "s7-bank-details",
    title: "Bank details & backup codes",
    notebook: "personal-admin",
    tags: ["admin"],
    vault: true,
    date: "2026-08-08",
    content: [
      p(
        "New account number, sort code, and the 2FA recovery codes. Not writing these down anywhere else."
      ),
      h(2, "Current account"),
      bullets(
        "Sort code 20-45-11",
        "Account 60418822",
        "Switched from the old one on 2 June, direct debits moved with it except the gym, which took three calls"
      ),
      h(2, "Backup codes"),
      p("Email — used 2 of 10:"),
      bullets(
        "<s>4f9c-2a71</s>",
        "<s>8b03-de4a</s>",
        "1c77-9052",
        "a304-6fe1",
        "77bd-01c9"
      ),
      callout(
        "important",
        "These are the codes that get me back in if the phone goes. Which is exactly why they are in here and not in a screenshot."
      )
    ].join("")
  },
  {
    key: "s8-recovery-codes",
    title: "Recovery codes",
    notebook: "personal-admin",
    tags: ["admin"],
    vault: true,
    date: "2026-07-02",
    content: [
      p(
        "Password manager and work SSO. Regenerated 2 July after the laptop swap — anything printed before that date is dead."
      ),
      bullets(
        "Password manager — 8 unused",
        "Work SSO — 5 unused",
        "Cloud storage — 10 unused, never touched"
      ),
      p(
        "Second copy is on paper in the folder at Mum's. If both of those are gone at the same time I have bigger problems."
      )
    ].join("")
  },
  {
    key: "s9-passport",
    title: "Passport & bank details",
    notebook: "personal-admin",
    tags: ["admin"],
    vault: true,
    date: "2026-07-16",
    content: [
      p("For Lisbon, and for the next time a form wants all of it at once."),
      table(
        ["Field", "Value"],
        [
          ["Passport", "5427 8891 6"],
          ["Expires", "14 February 2029"],
          ["Issued", "Liverpool, 2019"],
          ["EHIC/GHIC", "Expired — renew before October"]
        ]
      ),
      p(
        `Travel dates and the rest of it are in ${link(
          "h4-lisbon",
          "Lisbon — October"
        )}.`
      )
    ].join("")
  },
  {
    // The note the site publishes as a monograph.
    key: "s10-handover",
    title: "Handover — Q3 accounts",
    notebook: "work",
    tags: ["followup", "admin"],
    color: "blue",
    date: "2026-08-05",
    content: [
      p(
        "Published as a link for Priya and the two contractors, password on the note. Everything they need for the four accounts I am handing over, and nothing else from my account goes with it."
      ),
      h(2, "Accounts"),
      table(
        ["Account", "Renews", "Owner from 1 Sep", "Watch out for"],
        [
          ["Northwind", "1 Nov", "Priya", "Deck moved to the 12th"],
          ["Halvorsen", "14 Sep", "Priya", "Legal is slow on quotes"],
          ["Trelane", "1 Nov", "Sam", "Started the renewal early"],
          ["Fieldgate", "3 Jan", "Sam", "Quiet. Leave it quiet."]
        ]
      ),
      h(2, "Standing context"),
      bullets(
        "Northwind's whole position is reliability, not price. Do not let a discount conversation start.",
        "Halvorsen will ask for the case study to be softened. It has already been softened twice.",
        "Trelane pays late every quarter and it is not a problem, it is just how their finance team works."
      ),
      h(2, "Open threads"),
      tasks(
        "x Reassign the shared inbox rules",
        "x Move the folders",
        "Introduce Priya on the Northwind thread before the 28th",
        "Hand over the contractor budget conversation once Dara answers"
      ),
      h(2, "Where things live"),
      outline(
        [
          "<strong>Shared drive</strong>",
          "Decks in /marketing/2026/q4 — the ones with a date in the filename are current",
          "Anything in /archive is dead, do not resurrect it"
        ],
        [
          "<strong>Inboxes</strong>",
          "northwind@ and halvorsen@ forward to me, rules attached to Priya from 1 Sep",
          "The Trelane thread is on my personal inbox and needs moving"
        ],
        ["<strong>Passwords</strong>", "All in the shared vault, nothing on paper"]
      ),
      h(2, "Standing meetings"),
      table(
        ["When", "What", "Who takes it"],
        [
          ["Mon 09:30", "Standup", "Priya"],
          ["Alt Tue 14:00", "Northwind check-in", "Priya"],
          ["Thu 11:00", "Agency", "Sam, or cancel it"],
          ["Monthly", "Trelane renewal call", "Sam"]
        ]
      ),
      callout(
        "tip",
        "Anything not written here I probably keep in my head. Ask before the 28th, after that I am unreachable for a week."
      )
    ].join("")
  },
  {
    key: "s11-flat-landlord",
    title: "Flat — landlord emails",
    notebook: "personal-admin",
    tags: ["admin"],
    date: "2026-07-26",
    content: [
      p(
        "Deposit, and the boiler again. Keeping the thread summarised here because the email chain is 40 messages and unreadable."
      ),
      h(2, "Deposit"),
      p(
        "Protected with the scheme, certificate dated 14 June. Reference DPS-88104-2. Took two months and three asks to get it."
      ),
      h(2, "Boiler"),
      bullets(
        "Reported 2 July, engineer 8 July, £94 paid by the landlord",
        "Pressure drop is the expansion vessel, not a leak",
        "Trelane Property said \"within a couple of years\" in writing, which is the useful part"
      ),
      h(2, "Still open"),
      tasks(
        "Window latch upstairs — reported twice, no reply",
        "x Bins moved to Tuesday collection",
        "Ask about the loft hatch before the next inspection"
      ),
      p("Contact: Trelane Property, 0161 496 0182.")
    ].join("")
  },
  {
    // The article the site's web-clipper illustration is clipping.
    key: "s12-clipped-writing",
    title: "The case for writing things down",
    notebook: "masters-reading",
    tags: ["reading"],
    color: "purple",
    date: "2026-08-02",
    content: [
      p(
        `<em>Clipped from</em> <a href="https://longreads.example/the-case-for-writing-things-down">longreads.example/the-case-for-writing-things-down</a> · 2 August 2026`
      ),
      img(486),
      p(
        "The argument for writing by hand has always been made badly. It is usually made as nostalgia, or as a complaint about screens, and both of those are easy to dismiss because both of them are mostly about taste. The better argument is duller and harder to argue with: writing something down changes what you do with it."
      ),
      h(2, "The generation effect"),
      p(
        "The effect has been replicated for fifty years and is boring enough that it rarely leaves the literature. Material you produce yourself is recalled better than identical material you read. Not slightly better — in some designs, twice as well. The mechanism is not mystical. Producing a sentence forces a decision about what the sentence says, and the decision is what you remember."
      ),
      quote(
        "The note is not a copy of the thought. The note is where the thought finished happening."
      ),
      p(
        "Which is why transcription helps so little. Students who type verbatim retain less than students who write slowly enough that they cannot keep up, because the second group has to choose. The constraint is doing the work."
      ),
      h(2, "Where it stops being true"),
      p(
        "The literature is much weaker than its popular version. Most studies measure recall of factual material over days, not comprehension of difficult material over months, and almost none of them look at the thing people actually claim — that writing makes you think better rather than remember better. The honest summary is that we have good evidence for a narrow claim and enthusiasm for a broad one."
      ),
      p(
        "There is also a survivorship problem nobody mentions. The people who tell you that writing things down changed their life are, definitionally, the people for whom it stuck."
      ),
      h(2, "What survives the caveats"),
      numbered(
        "Writing forces selection, and selection is most of understanding.",
        "A note you can find later is worth more than a better note you cannot.",
        "The value shows up weeks later, which is exactly when the habit is hardest to keep."
      ),
      p(
        `Relevant to chapter 4 — the friction argument is the same shape as ${link(
          "h5-nudges",
          "Behavioural nudges — reading notes"
        )}, run in the other direction.`
      )
    ].join("")
  },
  {
    // The three notes the site's Inbox API illustration shows arriving.
    key: "s13-inbox-roadmap",
    title: "Q4 roadmap — Discussed",
    notebook: "inbox",
    tags: ["q4-planning"],
    date: "2026-08-09",
    content: [
      p(
        "<em>From zapier-gmail</em> · forwarded automatically, unread until now"
      ),
      p(
        "Thread between Dara and the product team about what actually lands before January. Forwarded here so it stops living in an inbox I do not read."
      ),
      bullets(
        "Self-hosting docs — committed, December",
        "Multi-window — committed, no date",
        "App store expansion — in progress, 7 of 9 done",
        "Everything else moved to next year"
      ),
      p("Reply needed before the 12th if the marketing plan depends on any of it.")
    ].join("")
  },
  {
    key: "s14-inbox-receipt",
    title: "Rent receipt — October",
    notebook: "inbox",
    tags: ["admin"],
    date: "2026-08-06",
    content: [
      p("<em>From my-server</em> · posted by the script that watches the bank feed"),
      table(
        ["Field", "Value"],
        [
          ["Amount", "£1,180.00"],
          ["Paid", "1 August 2026"],
          ["Reference", "TRELANE-FG-08"],
          ["Method", "Standing order"]
        ]
      ),
      p("Filed automatically. Nothing to do unless it stops arriving.")
    ].join("")
  },
  {
    key: "s15-inbox-article",
    title: "Longreads — saved article",
    notebook: "inbox",
    tags: ["reading"],
    date: "2026-08-04",
    content: [
      p("<em>From ifttt</em> · saved from the reading list feed"),
      p(
        "On why organisations keep rediscovering the same operational lesson every eight years and then writing it up as new. Long, and the middle third could go, but the section on institutional memory is worth the rest."
      ),
      p("Queued for the weekend.")
    ].join("")
  }
];

// ---------------------------------------------------------------------------
// 30 filler notes — title + opening line, which is all a list view renders
// ---------------------------------------------------------------------------

const FILLER: [notebook: string, title: string, line: string, date: string][] = [
  ["work-meetings", "Standup — 21 July", "Present: Priya, Sam, Dara. Short one, everyone shipping.", "2026-07-21"],
  ["work-meetings", "Northwind kickoff", "Two hours, four people, one actual decision — reliability over price.", "2026-07-09"],
  ["work-meetings", "Quarterly review — Q2", "Numbers were fine. The conversation was about headcount.", "2026-07-03"],
  ["work-meetings", "Agency handover", "Everything Sam is taking back in-house, in the order it moves.", "2026-07-15"],
  ["work-meetings", "Standup — 14 July", "Priya out. Sam covering the landing page brief.", "2026-07-14"],
  ["work-meetings", "Brand workshop notes", "Three hours of sticky notes to arrive at a word we already used.", "2026-06-25"],
  ["work-clients", "Halvorsen — case study draft", "Opening is too soft. Lead with the outage they avoided.", "2026-07-23"],
  ["work-clients", "Trelane renewal", "Renews 1 November. Started the conversation early this time.", "2026-07-17"],
  ["work-clients", "Landing page copy — v4", "Cut the hero paragraph to one line. It was doing nothing.", "2026-07-20"],
  ["work-clients", "Event post-mortem — June", "84 attendees, 11 qualified. Cost per lead was indefensible.", "2026-06-28"],
  ["work-clients", "Competitor scan — July", "Two of them have quietly dropped the free tier.", "2026-07-11"],
  ["work-1on1s", "1:1 with Dara — 21 July", "Mostly Northwind. Didn't raise the promotion. Again.", "2026-07-21"],
  ["work-1on1s", "1:1 with Priya — 23 July", "She wants more ownership of the case studies. Give it to her.", "2026-07-23"],
  ["work-1on1s", "1:1 with Sam — 16 July", "Wants to move toward product marketing. Worth planning for.", "2026-07-16"],
  ["masters-lectures", "Lecture 9 — choice architecture", "The four levers: defaults, framing, friction, salience.", "2026-07-22"],
  ["masters-lectures", "Lecture 8 — measurement in field studies", "Everything today was about what you lose.", "2026-07-15"],
  ["masters-thesis", "Supervision — 17 July", "Okafor: \"Chapter 4 is the paper.\" Restructure around it.", "2026-07-17"],
  ["masters-thesis", "Ethics application draft", "Board meets monthly. Miss September and it's November.", "2026-07-13"],
  ["masters-thesis", "Methods — diary study design", "Fourteen days, daily prompt, two interviews.", "2026-07-10"],
  ["home-recipes", "Weeknight dal", "Twenty minutes, one pot, and better the next day.", "2026-07-12"],
  ["home-recipes", "Sourdough — what went wrong", "Fourth attempt. Under-proved again, the crumb is tight.", "2026-07-06"],
  ["home-recipes", "Sam's chilli oil", "He finally gave up the ratio. Writing it down before he changes his mind.", "2026-06-27"],
  ["home-recipes", "Roast chicken, no fuss", "Salt it the night before. That is the whole recipe.", "2026-07-05"],
  ["home-travel", "Lisbon — packing", "October is warm but it rains sideways. Layers and actual shoes.", "2026-07-29"],
  ["home-travel", "Weekend in the Peaks — June", "Two nights, one very wet walk, would do again.", "2026-06-22"],
  ["personal-admin", "Contents insurance — renewal", "Renews 14 September. Last year's quote was a rip-off.", "2026-07-07"],
  ["personal-admin", "Broadband options", "Contract ends October. Three options, all roughly the same.", "2026-07-16"],
  ["personal-money", "Budget — July", "Overspent on eating out by about 140. Again.", "2026-07-30"],
  ["personal-money", "Pension — consolidating", "Three old pots from three jobs. Time to deal with it.", "2026-07-14"],
  ["journal", "Weekly review — 17 July", "Better week. Slept. Got outside twice. Not much else to report.", "2026-07-17"]
];

// ---------------------------------------------------------------------------
// reminders
// ---------------------------------------------------------------------------

const REMINDERS: {
  title: string;
  description: string;
  /** absolute date, or a relative offset in days for "today"/"tomorrow" rows */
  date?: string;
  offset?: number;
  time: string;
  mode: "once" | "repeat";
  recurringMode?: "week" | "month" | "day" | "year";
  selectedDays?: number[];
  /** key of the note this reminder hangs off, if any */
  note?: string;
}[] = [
  // The three rows the marketing site renders. Relative dates, so the demo
  // account always shows a reminder due today rather than one from last year.
  {
    title: "Call Mum back",
    description: "She rang twice while I was in the meeting.",
    offset: 0,
    time: "19:30",
    mode: "once"
  },
  {
    title: "Evening meds",
    description: "Levothyroxine is the morning one. This is the iron.",
    offset: 0,
    time: "21:00",
    mode: "repeat",
    recurringMode: "day",
    note: "s6-meds"
  },
  {
    title: "Move rent across",
    description: "Standing order covers it, this is the backstop.",
    offset: 1,
    time: "18:00",
    mode: "repeat",
    recurringMode: "month",
    note: "s11-flat-landlord"
  },
  // Dated milestones.
  {
    title: "1:1 with Dara",
    description: "Promotion conversation. Not hinting this time.",
    date: "2026-08-03",
    time: "09:30",
    mode: "repeat",
    recurringMode: "week",
    selectedDays: [1], // Monday
    note: "h9-1on1-dara"
  },
  {
    title: "Príncipe Real hold expires",
    description: "Confirm the Lisbon apartment or lose it.",
    date: "2026-08-08",
    time: "12:00",
    mode: "once",
    note: "h4-lisbon"
  },
  {
    title: "GP follow-up — bring the sleep log",
    description: "Fieldgate Surgery, Dr. Ferris.",
    date: "2026-08-19",
    time: "08:30",
    mode: "once",
    note: "s2-second-opinion"
  },
  {
    title: "Thesis chapters 1–3 due",
    description: "Draft to Dr. Okafor.",
    date: "2026-09-15",
    time: "17:00",
    mode: "once",
    note: "h6-thesis-outline"
  }
];

// ---------------------------------------------------------------------------
// the seeder
// ---------------------------------------------------------------------------

export type SeedProgress = (message: string) => void;

export async function seedDemoAccount(onProgress: SeedProgress = console.log) {
  const notebookIds: Record<string, string> = {};
  const colorIds: Record<string, string> = {};
  const tagIds: Record<string, string> = {};
  const noteIds: Record<string, string> = {};

  // --- notebooks, parents before children (NOTEBOOKS is ordered that way) ---
  onProgress("Creating notebooks…");
  for (const nb of NOTEBOOKS) {
    notebookIds[nb.key] = await db.notebooks.add({ title: nb.title });
    if (nb.parent) {
      await db.relations.add(
        { id: notebookIds[nb.parent], type: "notebook" },
        { id: notebookIds[nb.key], type: "notebook" }
      );
    }
  }

  // --- colors and tags ---
  onProgress("Creating colours and tags…");
  for (const c of COLORS) {
    colorIds[c.key] = await db.colors.add({
      title: c.title,
      colorCode: c.colorCode
    });
  }
  for (const t of TAGS) {
    tagIds[t] = await db.tags.add({ title: t });
  }

  // --- notes ---
  const all: SeedNote[] = [
    ...SITE_NOTES,
    ...HERO_NOTES,
    ...FILLER.map(([notebook, title, line, date]) => ({
      key: `f-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      notebook,
      date,
      content: p(line)
    }))
  ];

  onProgress(`Creating ${all.length} notes…`);
  for (const note of all) {
    const id = await db.notes.add({
      title: note.title,
      // links are still placeholders at this point; rewritten below
      content: { type: "tiptap", data: note.content },
      pinned: note.pinned,
      favorite: note.favorite,
      dateCreated: D(note.date),
      dateEdited: D(note.date)
    });
    noteIds[note.key] = id;

    await db.notes.addToNotebook(notebookIds[note.notebook], id);

    for (const tag of note.tags || []) {
      await db.relations.add(
        { id: tagIds[tag], type: "tag" },
        { id, type: "note" }
      );
    }
    if (note.color) {
      await db.relations.add(
        { id: colorIds[note.color], type: "color" },
        { id, type: "note" }
      );
    }
  }

  // --- second pass: rewrite {{key|text}} into real nn:// note links ---
  onProgress("Linking notes…");
  for (const note of all) {
    if (!LINK_RE.test(note.content)) continue;
    LINK_RE.lastIndex = 0;

    const data = note.content.replace(LINK_RE, (_m, key: string, text: string) => {
      const target = noteIds[key];
      if (!target) {
        onProgress(`  ! unresolved link "${key}" in "${note.title}"`);
        return text;
      }
      return `<a href="nn://note/${target}">${text}</a>`;
    });

    await db.notes.add({
      id: noteIds[note.key],
      content: { type: "tiptap", data },
      dateEdited: D(note.date)
    });
  }

  // --- reminders ---
  onProgress("Creating reminders…");
  for (const r of REMINDERS) {
    const id = await db.reminders.add({
      title: r.title,
      description: r.description,
      priority: "urgent",
      date:
        r.offset === undefined ? D(r.date!, r.time) : REL(r.offset, r.time),
      mode: r.mode,
      recurringMode: r.recurringMode,
      selectedDays: r.selectedDays
    });
    // Hanging the reminder off its note is the thing the site's reminder
    // section claims ("Set a reminder on any note"), so the demo should show
    // it rather than a list of free-floating reminders.
    if (id && r.note && noteIds[r.note]) {
      await db.relations.add(
        { id: noteIds[r.note], type: "note" },
        { id, type: "reminder" }
      );
    }
  }

  // --- vault ---
  onProgress("Setting up the vault…");
  const vaultNotes = all.filter((n) => n.vault);
  if (vaultNotes.length) {
    if (!(await db.vault.exists())) await db.vault.create(VAULT_PASSWORD);
    for (const note of vaultNotes) await db.vault.add(noteIds[note.key]);
  }

  onProgress(
    `Done. ${all.length} notes, ${NOTEBOOKS.length} notebooks, ${TAGS.length} tags, ${REMINDERS.length} reminders.`
  );
  onProgress(`Vault password: ${VAULT_PASSWORD}`);
  onProgress("Now sync, then take the screenshots.");

  return { notes: all.length, noteIds, notebookIds };
}

/**
 * Wipes every item in the account — notes, notebooks, tags, colours,
 * reminders, the vault and the trash — leaving the account itself intact.
 *
 * This is a real delete, not a move to trash, and it is not limited to items
 * this file created. Anything in the account goes.
 */
export async function clearAllData(onProgress: SeedProgress = console.log) {
  // SQLite caps bound parameters per statement, so delete in batches.
  const CHUNK = 200;
  const inChunks = async (ids: string[], fn: (batch: string[]) => Promise<any>) => {
    for (let i = 0; i < ids.length; i += CHUNK) await fn(ids.slice(i, i + CHUNK));
  };

  const counts = { notes: 0, notebooks: 0, tags: 0, colors: 0, reminders: 0 };

  // The vault goes first so no note is still locked when we delete it. Passing
  // false leaves the notes themselves for the sweep below.
  onProgress("Removing the vault…");
  await db.vault.delete(false);

  onProgress("Deleting reminders…");
  const reminderIds = await db.reminders.all.ids();
  counts.reminders = reminderIds.length;
  await inChunks(reminderIds, (b) => db.reminders.remove(...b));

  onProgress("Deleting notes…");
  const noteIds = await db.notes.all.ids();
  counts.notes = noteIds.length;
  await inChunks(noteIds, (b) => db.notes.remove(...b));

  onProgress("Deleting notebooks…");
  const notebookIds = await db.notebooks.all.ids();
  counts.notebooks = notebookIds.length;
  await inChunks(notebookIds, (b) => db.notebooks.remove(...b));

  onProgress("Deleting tags and colours…");
  const tagIds = await db.tags.all.ids();
  counts.tags = tagIds.length;
  await inChunks(tagIds, (b) => db.tags.remove(...b));

  const colorIds = await db.colors.all.ids();
  counts.colors = colorIds.length;
  await inChunks(colorIds, (b) => db.colors.remove(...b));

  // notebooks.remove soft-deletes, so anything it left lands in the trash.
  // clear() reads from a cache, which must be rebuilt or it clears nothing.
  onProgress("Emptying the trash…");
  await db.trash.buildCache();
  await db.trash.clear();

  onProgress(
    `Cleared ${counts.notes} notes, ${counts.notebooks} notebooks, ` +
      `${counts.tags} tags, ${counts.colors} colours, ${counts.reminders} reminders.`
  );
  return counts;
}
