Build a polished browser-based educational maths platform called **Florie Maths Games** for live 1-to-1 lessons with children aged approximately 5–7.

The teacher and child will be on **different computers/browsers** during an online lesson.

The key requirement is that their browsers are connected in real time.

For example:

- I open the teacher dashboard.
- I create a lesson session.
- The app generates a join link such as `https://app.com/join/K7PX4A`.
- I send that link to the child.
- The child opens it and enters a first name/nickname.
- I immediately see that the child is connected.
- I choose **Flash & Hide** on my browser.
- The game automatically opens on the child's browser.
- The child answers **4**.
- I immediately see on my browser:
  - their answer
  - whether it was correct
  - the expected answer
  - attempts
  - optionally response time
- I can then choose:
  - Next Question
  - Repeat
  - Make Easier
  - Make Harder
  - Switch Game
- Those changes immediately affect the child's browser.

This should feel like a **tiny live classroom/multiplayer system**, not five independent games.

---

# 1. PRODUCT SCOPE

Build one web application containing these five maths games:

1. **Flash & Hide**
2. **Feed the Monster**
3. **Number Bond Garden**
4. **Ten-Frame Builder**
5. **Number-Line Adventure**

The platform has two main interfaces:

## Teacher interface

Used by me during the lesson.

The teacher:

- signs in
- creates a lesson session
- gets a join code/link
- sees when the child joins
- sees the child's connection status
- selects the game
- controls difficulty/settings
- starts questions
- sees the child's responses live
- can repeat questions
- can change difficulty
- can switch games
- can end the session
- can review what happened during the session

## Child interface

The child:

- opens a join link
- does NOT create an account
- enters only a first name/nickname
- joins the teacher's current session
- sees whichever game the teacher chooses
- interacts directly with the game
- gets friendly feedback
- does not see teacher analytics or settings

V1 is designed for:

**1 teacher + 1 child per session.**

Architect the code cleanly enough that multiple children could potentially be supported later, but do NOT build group lessons now.

---

# 2. TECH STACK

Use:

- React
- TypeScript
- Vite
- React Router
- Supabase
  - PostgreSQL
  - Auth
  - Realtime Broadcast
  - Realtime Presence
  - Row Level Security
- CSS or Tailwind CSS
- localStorage only for harmless UI preferences

No separate Node/Express backend unless genuinely necessary.

Prefer Supabase database functions/RPCs and Supabase services.

Keep dependencies minimal.

The project should run with:

```bash
npm install
npm run dev
```

Create:

```text
.env.example
```

with:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never put Supabase service-role credentials in the browser.

---

# 3. REALTIME ARCHITECTURE

This is the most important part of the project.

Teacher and child browsers must communicate in real time through a session-specific Supabase Realtime channel.

Use a private channel conceptually like:

```text
session:<session_uuid>
```

Use:

- **Realtime Broadcast** for live commands/interactions
- **Realtime Presence** for connected/disconnected status
- **Postgres** for persistent session/attempt history

Do NOT use polling.

---

# 4. REALTIME EVENT MODEL

Define strongly typed TypeScript event interfaces.

Do not scatter arbitrary string events throughout components.

Create a central protocol.

Examples:

## Teacher → Student

```ts
type TeacherEvent =
  | {
      type: "game:selected";
      game: GameId;
      settings: GameSettings;
    }
  | {
      type: "round:start";
      round: RoundPayload;
    }
  | {
      type: "round:repeat";
      roundId: string;
    }
  | {
      type: "round:next";
    }
  | {
      type: "game:settings_updated";
      settings: GameSettings;
    }
  | {
      type: "session:pause";
    }
  | {
      type: "session:resume";
    }
  | {
      type: "session:end";
    };
```

## Student → Teacher

```ts
type StudentEvent =
  | {
      type: "answer:submitted";
      roundId: string;
      answer: unknown;
      correct: boolean;
      expected: unknown;
      attemptNumber: number;
      responseTimeMs?: number;
    }
  | {
      type: "interaction:update";
      roundId: string;
      interaction: unknown;
    }
  | {
      type: "student:ready";
    };
```

Create proper game-specific payload types instead of relying heavily on `unknown`.

Use discriminated unions.

---

# 5. IMPORTANT REALTIME RULE

Do NOT broadcast every mouse movement.

Only broadcast **meaningful educational actions**.

Examples:

Flash & Hide:

```text
Student selected 4.
```

Feed the Monster:

```text
Student added berry.
Current bowl = 3 / target 5.
```

Number Bond Garden:

```text
Left pot = 3
Right pot = 2
```

Ten-Frame:

```text
Current frame count = 7
```

Number-Line:

```text
Character moved from 4 → 5.
```

This lets the teacher follow what the child is doing without flooding the realtime connection.

---

# 6. SESSION FLOW

Implement this exact general flow.

## Teacher

Teacher opens:

```text
/teacher
```

Teacher signs in.

Dashboard shows:

```text
Florie Maths Games

[ Start New Session ]
```

Teacher clicks:

**Start New Session**

Create a session.

Generate:

- internal UUID
- short human-readable join code

Example:

```text
K7PX4A
```

Show:

```text
Your lesson is ready

Join code:
K7PX4A

Child link:
https://domain.com/join/K7PX4A

[ Copy Link ]
```

Teacher then waits.

---

## Child

Child opens:

```text
/join/K7PX4A
```

Screen should be extremely simple:

```text
Hi! 👋

What's your name?

[ Samaya ]

[ Join Florie's Game ]
```

Do not ask for:

- surname
- email
- phone number
- birthday
- school
- address

Only nickname/first name.

After joining:

```text
Hi Samaya!

Florie is getting your game ready…
```

---

## Teacher

Teacher immediately sees:

```text
Samaya
● Connected
```

Use Presence for this.

Teacher can then select a game.

Example:

```text
Choose a game

Flash & Hide
Feed the Monster
Number Bond Garden
Ten-Frame Builder
Number-Line Adventure
```

Teacher selects:

```text
Flash & Hide
```

Student browser automatically switches to Flash & Hide.

The child should NOT need to reload.

---

# 7. ROUTES

Use approximately:

```text
/
 /teacher
 /teacher/session/:sessionId
 /join/:joinCode
 /student/session/:sessionId
```

Protect teacher routes.

Student routes should only work when the student has valid session membership.

---

# 8. AUTHENTICATION

## Teacher

Use Supabase Auth.

A simple, polished teacher login is enough.

Email magic-link or password authentication is acceptable.

Keep it simple.

## Child

The child should NOT create a normal account.

Use either:

- Supabase anonymous authentication, OR
- another secure temporary participant identity supported cleanly by Supabase

Prefer anonymous auth if appropriate.

The child should only gain access to the specific active lesson they joined.

---

# 9. SECURE JOINING

Do NOT make the `sessions` table publicly readable by join code.

Create a secure join mechanism.

Prefer a PostgreSQL RPC such as conceptually:

```text
join_lesson(join_code, nickname)
```

It should:

1. validate that the code exists
2. verify that the session is active
3. verify that the session can accept a student
4. create/update the participant membership
5. associate the anonymous authenticated user with that session
6. return only the information needed to join

Do not expose other teachers' sessions.

Join codes should:

- use letters/numbers that are easy to read
- avoid confusing characters where practical
- be random enough not to be trivially guessed
- expire when the session ends

---

# 10. DATABASE SCHEMA

Design migrations properly.

At minimum create something similar to:

## teacher_profiles

```text
id
auth_user_id
display_name
created_at
```

## lesson_sessions

```text
id uuid primary key
teacher_id
join_code
status
created_at
started_at
ended_at
current_game
current_settings jsonb
```

Possible status:

```text
waiting
active
paused
ended
```

## session_participants

```text
id
session_id
auth_user_id
nickname
role
joined_at
last_seen_at
```

For V1:

```text
role = student
```

Only one active child participant per lesson.

## game_rounds

```text
id
session_id
game_id
round_number
question_data jsonb
correct_answer jsonb
started_at
completed_at
```

## game_attempts

```text
id
round_id
session_id
participant_id
answer_data jsonb
is_correct
attempt_number
response_time_ms
created_at
```

Create useful indexes.

Do not over-normalize game-specific question data.

JSONB is appropriate for game payloads.

---

# 11. ROW LEVEL SECURITY

Enable RLS on all relevant tables.

Implement policies carefully.

Teacher:

- can read/write only sessions they own
- can see participants belonging to their sessions
- can see rounds/attempts belonging to their sessions

Student:

- can see only their active joined session
- can see only the game information required to participate
- can insert/update only their own game attempts
- cannot see teacher profiles other than minimal session display information
- cannot inspect another child's records
- cannot access other sessions

Do not disable RLS as a shortcut.

Do not use the service-role key in client code.

---

# 12. RECONNECT BEHAVIOUR

Connections will occasionally drop.

Handle this gracefully.

If the student's internet disconnects:

Teacher should see:

```text
Samaya
● Reconnecting…
```

then:

```text
● Connected
```

When the student reconnects:

restore:

- current game
- current settings
- current round
- their current relevant interaction state where practical

Do NOT make the child start the whole lesson again.

The server/database should be the durable source of truth where needed.

Realtime messages should make the experience immediate, but do not rely exclusively on ephemeral messages for critical state.

---

# 13. TEACHER SESSION SCREEN

Build a strong teacher interface.

The teacher session page should have roughly three areas.

## A. Child status

Show:

```text
Samaya
● Connected

Session: 18 min
Current game: Flash & Hide
```

## B. Game controls

Example:

```text
Flash & Hide

Maximum number: 5
Display time: 1000ms
Representation: Dots

[ Start Round ]

[ Repeat ]
[ Easier ]
[ Harder ]
[ Next ]
```

Also:

```text
[ Switch Game ]
```

## C. Live response panel

Example:

```text
CURRENT QUESTION

Displayed: 5 dots

SAMAYA'S ANSWER

4

Expected: 5
Attempt: 1

Let's try that one again.
```

On retry:

```text
Answer: 5 ✓
Attempt: 2
```

Keep a small recent-history strip:

```text
5 ✓   3 ✓   4 → 5 ✓   2 ✓
```

Do not overload the teacher dashboard with complex analytics during the lesson.

It must be scannable while simultaneously talking to a child.

---

# 14. STUDENT GAME SHELL

Every child-facing game uses the same outer shell.

Show:

- child nickname optionally
- current game
- simple playful environment
- minimal text
- no teacher settings
- no analytics
- no distracting navigation

The child should not freely leave the live lesson by accident.

They can see something like:

```text
Florie Maths Games
```

but do not put a giant home menu in the child session unless the teacher enables child-choice mode in the future.

Teacher controls what game is active.

---

# 15. GLOBAL DESIGN DIRECTION

Audience:

Children aged approximately 5–7.

The interface should feel:

- warm
- whimsical
- colourful
- friendly
- calm
- playful
- imaginative
- polished

Avoid:

- generic school worksheet appearance
- corporate dashboards on child screens
- excessive animation
- overstimulation
- tiny buttons
- text-heavy instructions

Use:

- large interaction areas
- rounded cards
- friendly typography
- whitespace
- gentle animation
- CSS/SVG illustrations
- touch-friendly controls

Desktop/laptop and tablet are priority.

Mobile should still work.

---

# 16. EDUCATIONAL RULES

Apply these across all five games.

Never use:

- lives
- countdown pressure
- leaderboards
- red "WRONG" screens
- punishment
- scary error sounds
- streak shame

Incorrect answers should become teaching moments.

Use wording like:

```text
Almost! Let's look again.
```

or:

```text
Hmm… let's try that one once more.
```

Correct responses can trigger:

- small bounce
- smile
- flower bloom
- monster happy animation
- gentle chime

Avoid giant confetti explosions after every question.

The teacher and child should still be able to talk naturally over the game.

---

# 17. GAME 1 — FLASH & HIDE

## Educational goal

Develop **subitising**:

recognising a small quantity without counting each item individually.

---

## Teacher controls

Teacher chooses:

```text
Maximum quantity:
3
4
5
6
```

Display duration:

```text
1500 ms
1200 ms
1000 ms
800 ms
```

Representation:

```text
Dots
Fingers
Mixed
```

For V1, excellent dot mode is mandatory.

Finger mode can use good SVG illustrations.

Teacher can choose:

```text
Rounds:
5
8
10
Continuous
```

---

## Round flow

Teacher presses:

```text
Start Round
```

Student sees:

```text
Ready?

Watch carefully!
```

Then structured dots appear briefly.

Example:

```text
●   ●

●   ●
  ●
```

Then they disappear.

Student sees large buttons:

```text
1  2  3  4  5
```

Student clicks:

```text
4
```

Immediately send to teacher:

```text
answer = 4
correctAnswer = 5
correct = false
attempt = 1
```

Teacher sees it live.

Student sees:

```text
Almost! Have another look.
```

Teacher can either allow automatic retry or press:

```text
Show Again
```

The SAME pattern should appear again slightly longer.

Student chooses:

```text
5
```

Teacher sees:

```text
5 ✓
Attempt 2
```

---

## Dot patterns

Do NOT generate meaningless random scatter.

Create structured patterns:

- dice
- pairs
- symmetrical layouts
- 2 + 2
- 3 + 2
- five-frame structures
- familiar grouped arrangements

Create a typed pattern library.

Never overlap dots.

---

## Teacher live information

Teacher sees:

```text
Pattern quantity: 5
Display: 1000ms

Answer:
4

Expected:
5

Attempt:
1
```

For educational observation, also record:

```text
response_time_ms
```

but do not make speed competitive.

---

# 18. GAME 2 — FEED THE MONSTER

## Educational goal

Teach number bonds:

```text
whole = known part + missing part
```

Start with 5.

Later use 10.

---

## Visual concept

Create a cute friendly monster with:

- expressive eyes
- animated mouth
- bowl
- berries

Do not make it frightening.

---

## Teacher starts a round

Example:

```text
Target: 5
Starting berries: 2
```

Student sees:

```text
I'm hungry!

I need 5 berries.

I already have 2.
How many more?
```

But keep wording visually simple.

There are draggable berries.

Student drags one berry into the bowl.

Send realtime interaction:

```text
currentCount = 3
target = 5
```

Teacher immediately sees:

```text
Samaya added a berry

3 / 5
```

Student adds another:

```text
4 / 5
```

Student adds another:

```text
5 / 5
```

Monster celebrates and eats.

Then show:

```text
2 and 3 make 5
```

and:

```text
2 + 3 = 5
```

Teacher sees:

```text
Completed ✓

Needed: 3
Added: 3
```

---

## If child adds too many

Example:

```text
6 / 5
```

Monster should NOT say:

```text
Wrong!
```

Instead:

```text
Oops! My tummy only has room for 5.

Let's check.
```

Child can remove berries.

Teacher sees live:

```text
6 / 5
```

and subsequent correction.

This interaction is useful educational information.

---

## Teacher modes

```text
Make 5
Make 10
Mixed
```

Settings:

```text
starting quantity
random starting quantity
show equation after success
```

---

# 19. GAME 3 — NUMBER BOND GARDEN

## Educational goal

Teach **part-part-whole**.

A target number can be split in several different ways.

---

## Student screen

Whimsical garden.

Large central flower:

```text
5
```

Two large flowerpots below.

Exactly five flowers are available.

Prompt:

```text
Can you split 5 between the pots?
```

Student drags flowers.

After every completed drop, update teacher.

Example:

```text
Left pot: 1
Right pot: 0
Unplaced: 4
```

Then:

```text
Left pot: 2
Right pot: 1
Unplaced: 2
```

Finally:

```text
Left pot: 3
Right pot: 2
Unplaced: 0
```

Teacher sees the state live.

Once all flowers are placed:

Student sees:

```text
3 and 2 make 5!
```

Teacher sees:

```text
Bond discovered:
3 + 2 = 5
```

---

## Discovery system

For target 5:

unique bonds are:

```text
5 + 0
4 + 1
3 + 2
```

Treat reversals as equivalent:

```text
2 + 3
```

is the same discovery as:

```text
3 + 2
```

After finding a bond:

```text
Can you make 5 a different way?
```

Do not tell the child what remains.

Show a visual collection:

```text
My Garden

🌱 5 + 0
🌱 4 + 1
🌱 3 + 2
```

Undiscovered combinations should initially be hidden rather than showing answers.

When all are found:

flowers bloom.

```text
You found every way to make 5!
```

---

## Teacher targets

```text
3
4
5
6
10
```

Default:

```text
5
```

---

## Challenge mode

Teacher can choose:

```text
What's Missing?
```

Example:

Target:

```text
5
```

Pot A already has:

```text
3
```

Student must put:

```text
2
```

in the second pot.

Teacher watches every drop live.

---

# 20. GAME 4 — TEN-FRAME BUILDER

## Educational goal

Build structured number sense around 5 and 10.

The child should begin seeing:

```text
7 = 5 + 2
```

and:

```text
7 needs 3 to reach 10
```

---

## Ten-frame

Use a standard:

```text
○ ○ ○ ○ ○
○ ○ ○ ○ ○
```

Counters snap into canonical order:

top row left → right

then:

bottom row left → right

Never randomise placement.

---

## Mode 1 — Build It

Teacher chooses:

```text
Target = 7
```

Student sees:

```text
Make 7!
```

Child drags counters into frame.

After each counter:

broadcast:

```text
currentCount
```

Teacher sees:

```text
1 / 7
2 / 7
3 / 7
...
7 / 7
```

When seven are placed:

ask:

```text
How many spaces are empty?
```

Student chooses:

```text
3
```

Teacher immediately sees answer.

Then display:

```text
7 and 3 make 10
```

and optionally:

```text
7 + 3 = 10
```

---

## Mode 2 — What's Missing?

Frame begins with:

```text
7
```

filled.

Ask:

```text
How many more make 10?
```

Student answers.

---

## Mode 3 — Flash Frame

Frame appears briefly.

Then disappears.

Ask:

```text
How many did you see?
```

This can reuse some Flash & Hide logic.

---

## Mode 4 — Make 10

Pre-fill:

```text
6
```

Student physically adds counters until the frame reaches:

```text
10
```

Teacher sees every addition.

---

## Teacher settings

```text
mode
target quantity
random target
flash duration
show equation
```

---

# 21. GAME 5 — NUMBER-LINE ADVENTURE

## Educational goal

Teach:

```text
addition = movement forwards
subtraction = movement backwards
```

---

## Visual concept

Make the number line feel like a path/adventure.

Default:

```text
0 — 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — 9 — 10
```

Characters:

- rabbit
- frog
- cat
- unicorn

Use polished SVG/CSS illustrations.

---

## Teacher starts addition round

Example:

```text
Start = 3
Operation = +
Amount = 2
```

Student sees:

```text
Bunny is on 3.

Jump forward 2!
```

Large button:

```text
JUMP →
```

First press:

```text
3 → 4
```

Broadcast to teacher:

```text
position = 4
jumpsCompleted = 1
jumpsRequired = 2
```

Teacher sees:

```text
Samaya jumped:
3 → 4
```

Second:

```text
4 → 5
```

Teacher sees:

```text
4 → 5
```

Then student answers:

```text
Where did Bunny land?
```

Select:

```text
5
```

Teacher sees:

```text
Answer: 5 ✓
```

Then reveal:

```text
3 + 2 = 5
```

---

## Subtraction

Example:

```text
Start = 7
Amount = 3
```

Student uses:

```text
← JUMP
```

Moves:

```text
7 → 6
6 → 5
5 → 4
```

Then answer:

```text
4
```

Reveal:

```text
7 - 3 = 4
```

---

## Levels

### Level 1

```text
0–5
forward only
```

### Level 2

```text
0–10
forward movement
```

### Level 3

```text
addition within 10
```

### Level 4

```text
subtraction within 10
```

### Level 5

```text
mixed
```

### Level 6 — Predict First

Before moving:

```text
Where do you think Bunny will land?
```

Student makes prediction.

Teacher sees prediction immediately.

Then child performs jumps and verifies.

This distinction should be stored:

```text
prediction
final_answer
```

---

# 22. TEACHER GAME SWITCHING

Teacher should be able to switch games without starting a new session.

Example:

```text
[ Switch Game ]
```

Teacher chooses:

```text
Feed the Monster
```

Broadcast:

```text
game:selected
```

Student's browser smoothly transitions to Feed the Monster.

No reload.

Session history continues.

---

# 23. EASIER / HARDER CONTROLS

Every game should expose a difficulty adapter.

Teacher should have quick buttons:

```text
[ Easier ]
[ Harder ]
```

These should intelligently alter relevant settings.

Examples:

Flash & Hide:

Easier:
- reduce max quantity
- increase display duration

Harder:
- increase max
- reduce display duration

Feed Monster:

Easier:
- target 5
- larger starting amount

Harder:
- target 10

Number Bond Garden:

Easier:
- target 4/5

Harder:
- target 10 or What's Missing

Ten Frame:

Easier:
- Build It

Harder:
- missing-part questions

Number Line:

Easier:
- 0–5 forward

Harder:
- subtraction/mixed/prediction

Teacher can still manually override settings.

---

# 24. SESSION HISTORY

During the lesson show a simple history.

Example:

```text
FLASH & HIDE

5 ✓
4 → 5 ✓
3 ✓
6 ✓

FEED THE MONSTER

2 + 3 = 5 ✓
4 + 1 = 5 ✓
```

At session end create a concise summary page.

Example:

```text
Samaya
32-minute lesson

Flash & Hide
8 rounds
6 first-attempt correct
2 needed another look

Feed the Monster
4 rounds
All completed

Number-Line
3 addition rounds
1 subtraction round
```

Do not label the child with grades such as:

```text
Poor
Below Average
Failed
```

Show observations/data only.

---

# 25. OPTIONAL TEACHER NOTES

Allow teacher to add a short private note during or immediately after the session.

Example:

```text
"Recognised 1–4 instantly but counted 5 and 6."
```

Store this against the lesson.

Child never sees it.

Keep this feature small.

---

# 26. PRIVACY / CHILD SAFETY

This application involves young children.

Apply data minimisation.

For student V1 collect only:

```text
nickname
temporary anonymous user ID
game interaction data
```

Do NOT request:

- surname
- email
- phone
- precise location
- school
- birthday
- photo
- audio
- video

Do not add analytics/ad SDKs aimed at children.

Do not use advertising.

Do not expose student session data publicly.

---

# 27. TEACHER SETTINGS

Create a reusable settings drawer.

It should support:

- game-specific difficulty
- sound
- animation level
- number range
- target number
- number of rounds
- equation visibility

Teacher settings should immediately sync with student when changed.

Use localStorage only for non-sensitive preferences such as:

```text
teacher sound preference
preferred default difficulty
```

Live lesson state belongs in Supabase/session state.

---

# 28. SOUND

Create a global sound toggle.

Sounds may include:

- gentle click
- soft pop
- success chime
- berry drop
- monster munch
- character hop

Never use:

- harsh buzzer
- failure alarm
- loud surprise sounds

The app must remain fully usable without sound.

---

# 29. ACCESSIBILITY

Support:

- large tap targets
- keyboard navigation
- strong visual contrast
- responsive layout
- reduced-motion preference
- touch drag-and-drop
- mouse drag-and-drop

Do not make drag-and-drop the only possible method if an accessible click/tap alternative can reasonably be provided.

Example:

A berry could support:

```text
Tap berry → tap bowl
```

in addition to dragging.

---

# 30. CODE ARCHITECTURE

Use a clean structure approximately like:

```text
src/
  app/
  components/
    common/
    teacher/
    student/

  features/
    sessions/
      api/
      realtime/
      types/
      hooks/

    games/
      flash-hide/
        components/
        logic/
        types.ts

      feed-monster/
        components/
        logic/
        types.ts

      number-bond-garden/
        components/
        logic/
        types.ts

      ten-frame/
        components/
        logic/
        types.ts

      number-line/
        components/
        logic/
        types.ts

  pages/
    TeacherDashboard.tsx
    TeacherSession.tsx
    JoinSession.tsx
    StudentSession.tsx

  lib/
    supabase.ts

  hooks/
  utils/
  styles/

supabase/
  migrations/
```

Keep mathematical/game logic separate from visual components.

Do not over-engineer.

---

# 31. SHARED GAME INTERFACE

Create a common interface for games so teacher controls and realtime architecture do not need five entirely separate systems.

For example conceptually:

```ts
interface GameDefinition<
  TSettings,
  TRound,
  TAnswer,
  TInteraction
> {
  id: GameId;

  createRound(
    settings: TSettings
  ): TRound;

  checkAnswer(
    round: TRound,
    answer: TAnswer
  ): boolean;

  makeEasier(
    settings: TSettings
  ): TSettings;

  makeHarder(
    settings: TSettings
  ): TSettings;
}
```

Adapt as necessary.

The objective is that adding Game #6 later is straightforward.

---

# 32. PURE MATHEMATICAL LOGIC

Implement core educational logic as pure functions.

Examples:

## Flash & Hide

```text
generate valid structured dot pattern
quantity never exceeds configured maximum
```

## Number Bond Garden

For target 5:

```text
0+5
1+4
2+3
```

Treat:

```text
3+2
```

as equivalent to:

```text
2+3
```

## Ten Frame

```text
filled = 7
empty = 3
```

Generate canonical positions.

## Number Line

Never create a question whose answer falls outside the current number line.

---

# 33. TESTING

Use an appropriate modern testing setup for React/TypeScript.

Add meaningful tests.

Test:

### Session logic

- join code validation
- ended sessions cannot be joined
- second student cannot join a one-child session
- reconnect restores active state

### Realtime protocol

- event schemas/types
- teacher command updates student state
- student answer updates teacher state

### Flash & Hide

- quantity always valid
- max quantity respected
- pattern library valid

### Feed Monster

- missing number calculation
- overfill handling

### Number Bond Garden

- correct unique bonds
- reversed bonds canonicalised
- completion detection

### Ten Frame

- filled/empty calculations
- canonical position order

### Number Line

- valid ranges
- addition movement
- subtraction movement
- no out-of-range questions

Do not waste time testing trivial CSS.

---

# 34. DATABASE MIGRATIONS

Create proper Supabase migration files.

Include:

- tables
- indexes
- enums where useful
- RLS
- policies
- secure session-join RPC
- useful constraints

Do not merely provide SQL in README.

Put it in executable migration files.

---

# 35. SEED / DEMO MODE

Make local testing convenient.

If possible, create development helpers so I can easily test using two browser windows:

Window 1:

```text
Teacher
```

Window 2:

```text
Student
```

Document exactly how to test this.

It should be easy to simulate:

```text
Teacher creates session
→ Student joins
→ Teacher selects game
→ Student answers
→ Teacher receives answer
```

---

# 36. ERROR STATES

Handle gracefully.

Examples:

Invalid join code:

```text
That lesson link doesn't seem to work.
Ask Florie for a new one.
```

Ended session:

```text
This lesson has finished.
```

Teacher disconnected:

```text
Florie will be back in a moment…
```

Student connection lost:

Teacher sees:

```text
Samaya is reconnecting…
```

Do not expose raw Supabase errors to a child.

---

# 37. LOADING STATES

Avoid blank screens.

Student waiting state:

```text
Florie is choosing your next game…
```

Use a small playful animation.

Teacher waiting state:

```text
Waiting for your learner to join…
```

---

# 38. PERFORMANCE

Realtime interaction should feel immediate.

Optimise for ordinary household internet connections.

Do not refetch the entire session after every action.

Use:

- local optimistic visual state where appropriate
- Realtime Broadcast for immediacy
- database persistence asynchronously
- sensible reconciliation when needed

Do not sacrifice correctness for aggressive optimisation.

---

# 39. IMPORTANT IMPLEMENTATION PRINCIPLE

There are three categories of state.

## A. Durable lesson state

Examples:

- active game
- settings
- active round
- session status

Store/reconcile with Supabase.

## B. Realtime interaction state

Examples:

- child just clicked answer 4
- child just moved from number 3 → 4
- current berry count changed

Use Realtime Broadcast.

## C. Historical learning data

Examples:

- final answers
- attempts
- response time
- completed rounds

Persist to Postgres.

Make these distinctions explicit in the architecture.

---

# 40. HOME / BRAND SCREEN

Outside a live session, create a warm landing/home screen.

Teacher side:

```text
Florie Maths Games

Playful maths for little thinkers.
```

Then:

```text
[ Teacher Login ]
```

Once logged in:

```text
[ Start New Session ]
```

Do not create unnecessary marketing pages.

This is primarily a working classroom tool.

---

# 41. VISUAL IDENTITY OF THE FIVE GAMES

Make the games feel related but visually distinctive.

### Flash & Hide

Theme:

```text
lavender / stars / observation
```

### Feed the Monster

Theme:

```text
warm berries / friendly creature
```

### Number Bond Garden

Theme:

```text
flowers / greenery / garden
```

### Ten-Frame Builder

Theme:

```text
building blocks / structured playful board
```

### Number-Line Adventure

Theme:

```text
outdoor trail / journey / characters
```

Do not hardcode an excessive number of random colours.

Create a coherent design token system.

---

# 42. DO NOT IMPLEMENT YET

Do NOT add:

- parent accounts
- child profiles
- subscriptions
- payments
- AI
- chat
- video calls
- homework
- leaderboards
- achievements
- public profiles
- multiple-student classrooms
- Momzo integration

Keep this product tightly focused on:

```text
teacher ↔ child live maths games
```

---

# 43. DEVELOPMENT PROCESS

Before coding:

1. Inspect the existing repository completely.
2. Understand what already exists.
3. Create an implementation plan.
4. Design database schema and realtime event protocol.
5. Implement Supabase migrations and RLS.
6. Implement authentication/session joining.
7. Implement realtime teacher/student connection.
8. Create common teacher/student shells.
9. Implement one simple end-to-end game first: Flash & Hide.
10. Verify:
   - teacher creates session
   - child joins
   - teacher chooses game
   - child receives it
   - child answers
   - teacher receives answer
11. Only after that works, build the other four games.
12. Add persistence.
13. Add reconnect handling.
14. Test all games.
15. Run type checking.
16. Run tests.
17. Run linting if configured.
18. Manually test teacher and child in two separate browser windows.
19. Fix all obvious UX/runtime problems.

Do NOT build all five visual games before proving the realtime architecture.

The realtime teacher/student loop is the foundation of the product.

---

# 44. DEFINITION OF DONE

Do not stop at placeholder pages.

The project is done only when I can genuinely perform this flow:

```text
I log in as Florie.

I click Start Session.

I receive:
https://myapp.com/join/K7PX4A

I send it to Samaya.

Samaya opens it.

She types:
Samaya

I see:
Samaya ● Connected

I click:
Flash & Hide

Her browser automatically shows Flash & Hide.

I click:
Start Round

Five dots flash on HER browser.

She clicks:
4

MY browser immediately shows:
Samaya answered 4
Expected 5

I click:
Repeat

The dots display again.

She clicks:
5

MY browser immediately shows:
5 ✓

I click:
Switch Game → Feed the Monster

Her browser automatically changes.

She drags berries into the monster bowl.

I can see the bowl count updating on my browser.

We continue playing.

I click:
End Session

Her screen shows:
Great playing today, Samaya!

My browser displays a short session summary.
```

That entire flow must work reliably.

---

# 45. FINAL HANDOFF

When implementation is complete, give me:

1. **What you built**
2. **Architecture overview**
3. **Database schema**
4. **Realtime architecture**
5. **Security/RLS approach**
6. **Project structure**
7. **Environment variables required**
8. **How to configure Supabase**
9. **How to run locally**
10. **How to test with two browser windows**
11. **How to deploy**
12. **Any important limitations**
13. **Recommended next improvements**

Also tell me explicitly whether all of these flows were manually verified:

- teacher creates session
- child joins by link
- Presence shows connected
- teacher switches game remotely
- child receives new game
- student answer appears on teacher screen
- drag interactions appear live
- reconnect works
- attempts persist
- session summary works

Do not claim something was verified unless you actually tested it.