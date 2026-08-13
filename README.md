# Florie Learning Games

A live one-to-one classroom for children aged 5–7. The teacher drives the lesson
from one browser; the child plays in another. Twenty-two games in three
categories, freely mixed inside a single lesson.

**Maths**

| Game | Idea it teaches |
| --- | --- |
| Flash & Hide | Subitising — see a quantity without counting it |
| Feed the Monster | Number bonds — whole = known part + missing part |
| Number Bond Garden | Part–part–whole, and that a number splits many ways |
| Ten-Frame Builder | Structured sense of 5 and 10 |
| Number-Line Adventure | Adding is forwards, subtracting is backwards |

**Reading Adventures**

| Game | Stage | What it practises |
| --- | --- | --- |
| Robot Translator | R1 | Oral blending — hear the sounds, say the word |
| Sound Safari | R1 | Hearing the first sound in a word |
| Skywriter Studio | R2 | Connecting a sound to a letter shape |
| Sound Box Factory | R3 | One box per sound; segment and blend CVC |
| Monster Name Lab | R3+ | Decoding a word nobody has memorised |
| Digraph Detectives | R4 | Two letters, one sound: sh, ch, th |
| Blend Train | R5 | Both consonants keep their own sound |
| Magic-e Wizard | R6 | The silent e that changes the vowel |
| Tricky Word Treasure | — | Irregular words, taught separately |
| Word Ladder Workshop | R3–R5 | Change one sound at a time |
| Story Quest | R3+ | Decodable reading, then retelling |

**Feelings & Focus**

| Game | What it practises |
| --- | --- |
| Feeling Thermometer | Emotional intensity, vocabulary, body signals, what helps |
| The Opposite Game | Inhibitory control — hold a rule, override the reflex |
| Mirror Face Charades | Reading expressions as clues, not certainties |
| Character Scavenger Hunt | Perspective taking inside an illustrated scene |
| Rock the Buddy | A slow-breathing routine, practised while calm |
| Freeze Dance | Moving, stopping, and getting going again |

These are games — not therapy, diagnosis, or behaviour scoring. Nothing in the
Feelings & Focus category produces a score, a grade, or a ranking, and nothing
in Reading produces a percentage or a reading age.

## Run it

```powershell
npm install
npm run dev
```

Then open <http://localhost:5173>.

`.env.local` ships with `VITE_DEMO_MODE=true`, which runs the whole product
without a database. Demo mode connects the two windows over `BroadcastChannel`,
so it works between **two windows of the same browser on one computer** — ideal
for building and rehearsing. For two *different* computers, configure Supabase
(below).

### Two-window test

1. Window 1 → `/teacher` → **Start a new session**.
2. Copy the child link (or read the six-character code).
3. Window 2 → open that link, type a first name, join.
4. Window 1 shows `● Connected` within a couple of seconds.
5. Pick a game from either category. Window 2 switches to it with no reload.
6. **Start** → the round appears for the child.
7. The child answers, drags, or chooses → Window 1 updates immediately.
8. Try **Show again**, **Easier**, **Harder**, **Switch game**, a **Quick
   break** and **Return to …**, then **End session**.

## Supabase (two different computers)

1. In the Supabase dashboard enable **email** auth for teachers and **anonymous**
   sign-ins for learners.
2. Run the migrations in order:
   `202608120001_initial_classroom.sql`, then `202608130002_reading.sql`.
3. Put your project URL and the **anon/publishable** key in `.env.local`, and set
   `VITE_DEMO_MODE=false`.
4. Add your local and deployed `/teacher` URLs to the Auth redirect list.

Never put a service-role key or personal access token in a `VITE_` variable —
Vite ships those to every browser.

## How it works

### Three kinds of state

| Kind | Example | Where it lives |
| --- | --- | --- |
| Durable lesson state | active game, settings, current round, live cue, parked game | Postgres, via `sync_lesson_state` |
| Realtime interaction | "bowl has 3 of 5", "thermometer moved to 4" | Broadcast only — never stored |
| Learning history | answers, observations, teacher marks | Postgres `game_responses` |

### Phonics content and the Sounds We Know gate

`src/core/phonics.ts` is the single source for every grapheme, word, story,
ladder and safari scene. No game carries its own word list.

The teacher's **Sounds we know** panel records which graphemes have been taught
and which tricky words are active. Every reading game filters through it:

- words are stored broken into graphemes, so `ship` is `['sh','i','p']` (three
  sounds) and `stop` is `['s','t','o','p']` (four)
- `canDecode(word, enabled)` is the gate — a word is offered only when every one
  of its graphemes is switched on
- pseudowords for Monster Name Lab are generated from enabled sounds only,
  checked against the real-word bank, and filtered through a blocklist so a
  child is never asked to read something unfortunate aloud
- stories are validated whole: every word must be either decodable with the
  current sounds or an *active* tricky word, otherwise the story is not offered
- word ladders are curated and checked so exactly one sound changes per rung

When a sound set cannot support a game, `createRound` returns `null` and the
teacher panel says what to switch on. It never quietly substitutes an untaught
grapheme.

### Right answers, and everything else

A maths answer can be marked. "How does Pip feel?" cannot, and pretending
otherwise would turn feelings into right and wrong. A response is therefore one
of three things, in the type system *and* in the database:

| Outcome | Used by | Carries |
| --- | --- | --- |
| `objective` | maths, Opposite Game screen mode | answer, expected, correct |
| `observational` | most of Feelings & Focus | what the child chose, plus readings worth exploring — **never** a correct flag |
| `marked` | teacher watching or listening over the video call | got it / froze / read independently / needed a prompt / guessed / self-corrected / … |

Reading adds a fourth rule of its own: **the browser never judges speech.**
There is no speech recognition, no pronunciation scoring, and no microphone
access. When a child reads a monster name or a story page aloud, the teacher
hears it on the video call and marks what they heard.

`game_responses` enforces this with check constraints: an observational row
cannot carry `is_correct` or a `mark` at all. RLS also stops a child from ever
reading a teacher's private mark.

### The realtime loop

Both browsers join one private channel, `session:<uuid>`, carrying Broadcast for
commands and actions, and Presence for who is connected. Every message is a typed
event in `src/core/protocol.ts`, and **both sides fold the same events into the
same snapshot** through one `applyEvent` reducer. That is what makes the child's
answer appear on the teacher's screen: neither side reads the other's local
storage.

Live instructions — JUMP, FREEZE, a face to pull — travel as a `cue` that is kept
in durable state rather than fired and forgotten, so a child who reloads
mid-round still sees the instruction they are acting on.

Reconnects are handled by re-announcing. When a child appears — first join, page
reload, or recovered connection — the teacher pushes a `session:sync` carrying
the whole lesson, so the child lands back on the current game, round and cue
instead of starting over.

The teacher is the single writer of durable state. This removes a race where a
fast answer could be stored before the round it belongs to.

### Quick Break

Any regulation activity is one click away from inside any other game, including
every reading game. Quick Break parks the current game *and its round*, switches
the child's browser instantly, and **Return to …** restores the parked round
exactly as it was.

### Two-day mastery

A reading milestone is only "secure" once the child has demonstrated it on two
**different days**. One good session is not mastery. The teacher records
evidence; the app shows the dates and a status, and never advances a child on
its own. This is teacher information — it is never shown to the child and never
becomes a badge.

### Security

Row Level Security is on for every table. A teacher can only reach lessons they
own; a child can only reach the one lesson they joined. The `lesson_sessions`
table is never searchable by join code from the browser — only the
security-definer `join_lesson` RPC resolves one, and it checks that the lesson
exists, is not ended, and has no other child. Realtime channel access is gated by
the same ownership checks in `realtime.messages` policies.

### Project structure

```text
src/
  components/     Shell, buttons, number pad, SVG illustrations (maths and
                  feelings), drag-and-tap
  core/           types, event protocol + reducer, pure game logic, dot
                  patterns, feelings content library, phonics content layer,
                  reading round factory, mastery evidence, sound, summary
  realtime/       channel transport (Supabase / demo), session service, useSession
  games/          one component per game + shared answer/observation hooks
                  reading/  the eleven reading games, grouped by stage
  pages/          Home, TeacherDashboard, TeacherSession (+ controls, cues),
                  Join, StudentSession
  styles/         tokens, base, marketing, teacher, games, feelings, reading
supabase/migrations/
```

Game logic is pure and separate from the components, so it is testable on its
own. Adding game #12 means a new component, a `createRound` case, and a line in
`src/games/index.tsx`.

All Feelings & Focus wording, faces, scenes, opposite pairs and coaching prompts
live in `src/core/feelings.ts`; all phonics content lives in
`src/core/phonics.ts`. New story packs, word lists or scenes never require
touching a component.

## Commands

```powershell
npm run typecheck
npm test
npm run build
```

## What is actually verified

Verified by the automated suite (174 tests, all passing).

Core loop:

- teacher selects a game → the child's state switches to it
- teacher starts a round → the child receives it
- child answers → **it appears in the teacher's state** (this was the central
  bug in the original version)
- a repeated question stacks as attempt 2 on the same question
- Presence reports connected, and reports the child leaving
- a reconnecting child is restored to the current game, round and cue
- drag/tap interactions stream to the teacher and are never persisted
- ending the lesson ends it on both screens

Maths:

- all five games render, accept input, and report correctly
- round generation never breaks its own rules (no out-of-range number line, no
  quantity above the configured maximum, canonical ten-frame order, unique bonds)

Feelings & Focus:

- feelings rounds carry no `expected` value at all; maths rounds still do
- a whole Feeling Thermometer round (intensity → feeling → body → strategy)
  produces four observations and **zero** marked answers
- "I'm not sure" is reachable, and the body stage can be skipped
- Character Mode asks about a character rather than the child
- the Opposite Game marks a tapped answer, calls a wrong one a wobble rather
  than a failure, and never auto-marks a physical round
- a rule switch keeps the command and changes what it means
- screen mode only offers pairs a child can actually tap
- ambiguous faces stay genuinely open, and are excluded unless opted into
- twelve original scenes ship, each with several plausible readings, and the
  hunt only asks for a feeling the scene can actually show
- Rock the Buddy runs its breaths and finishes with no score
- Freeze Dance inverts correctly in Opposite mode and works with no cue at all
- Quick Break parks a maths round, switches, and restores it exactly
- the mixed-lesson summary groups both categories and contains no score,
  percentage, grade or ranking — asserted directly against the output

Reading Adventures:

- **the phonics layer validates itself**: every word spells back to its own
  grapheme breakdown, every ladder step changes exactly one sound, every safari
  object starts with the sound it claims, and every story is fully decodable
- no reading game ever puts an untaught grapheme on screen — asserted by
  generating 25 rounds of every game against a six-sound set and inspecting
  every grapheme each round could display
- a game declines rather than substituting: Digraph Detectives returns `null`
  without sh/ch/th, and the teacher is told what to switch on
- pseudowords use only enabled sounds, are never real words, are always
  consonant-vowel-consonant, never start with `ck`, and pass a blocklist
- Robot Translator's picture mode draws no word anywhere on the child's screen
- Sound Box Factory gives one box per sound and reports every placement live
- counters-first shows no letters until the sounds have been counted
- ship is three sounds, stop is four, and the sorting bins include traps
- Word Ladder locks every box except the one that changes
- Story Quest turns pages on both screens, and Help chunks a word into its
  sounds rather than reading it out
- Tricky Word Treasure only ever offers the teacher's active words
- the read-aloud games produce no automatic marking at all
- Quick Break parks a reading round and restores it exactly
- one lesson switches between all three categories and produces one combined
  summary containing no score, percentage, grade, rank or reading age
- two-day mastery: one day is "emerging", a second different day is "secure",
  the same day twice counts once, and nothing advances a child automatically

Verified manually: `npm run typecheck`, `npm test` and `npm run build` all pass
clean.

**Not yet verified:** nothing has been driven through a real browser, and the
Supabase path has not been run against a live project — there are no credentials
in `.env.local`, so only the demo transport has been exercised. The SQL migration
has not been executed anywhere.

## Privacy

Children give a first name and nothing else. No email, school, age, photo, audio,
location, advertising, or child analytics. Teacher notes and marks stay on the
teacher's side. There are no scores, lives, timers on answers, leaderboards, or
punishing feedback anywhere in the product.

The app never requests camera or microphone access. There is no speech
recognition, no pronunciation scoring, no voice recording, and no reading-age
label anywhere in the product. Mirror Face Charades and the
physical games rely on the video call you are already on, plus the teacher
marking what they see. There is no facial recognition, emotion detection, body
tracking, or image capture of any kind — every face in the app is drawn from a
definition in `src/core/feelings.ts`.
