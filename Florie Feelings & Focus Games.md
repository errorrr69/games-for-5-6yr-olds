# Florie Feelings & Focus Games

Extend the existing **Florie live learning games application** by adding a new game category:

## Feelings & Focus

These games are for children approximately **5–7 years old** and are played live between a teacher and one child during an online lesson.

Do NOT create a separate application.

Inspect the existing repository first and reuse:

- teacher authentication
- lesson sessions
- join links/codes
- teacher/student roles
- Supabase
- Realtime Broadcast
- Realtime Presence
- session persistence
- existing design system
- game architecture
- teacher controls
- student shell
- reconnect handling

The existing maths games must continue working unchanged.

---

# 1. PRODUCT PURPOSE

These games are designed to practise:

- emotional vocabulary
- recognising emotional intensity
- noticing body signals
- inhibitory control
- waiting
- stopping and starting
- mental flexibility
- perspective taking
- empathy
- emotional problem-solving
- calming strategies
- transitioning between high and low energy states

They are **not therapy**, diagnosis, behaviour scoring, or a mental-health assessment.

The child should feel like they are:

- playing
- pretending
- moving
- making choices
- solving mysteries
- helping characters

They should NOT feel like they are being evaluated for "good behaviour."

---

# 2. NEW HOME CATEGORY

The teacher game library currently contains maths games.

Add two clear categories:

## Maths

Existing games remain here.

## Feelings & Focus

Add these six games:

1. Feeling Thermometer
2. Opposite Game
3. Mirror Face Charades
4. Character Scavenger Hunt
5. Rock the Buddy
6. Freeze Dance

The teacher can switch freely between Maths and Feelings & Focus during the SAME lesson session.

For example:

```text
Samaya — Connected ●

Maths
[ Flash & Hide ]
[ Feed the Monster ]
...

Feelings & Focus
[ Feeling Thermometer ]
[ Opposite Game ]
[ Mirror Face Charades ]
[ Character Scavenger Hunt ]
[ Rock the Buddy ]
[ Freeze Dance ]
```

If the teacher selects a Feelings & Focus game, it should automatically open on the child's browser using the existing realtime architecture.

No page reload.

---

# 3. IMPORTANT DESIGN PRINCIPLE

Do not turn emotions into right/wrong answers.

There is often no objectively correct answer to:

```text
How does this character feel?
```

The teacher needs to see the child's answer and discuss it.

Distinguish between:

### Objective game state

Example:

```text
Teacher said JUMP.
Correct opposite action = SIT.
```

This can be checked automatically.

### Interpretive answers

Example:

```text
Child thinks character feels worried.
```

Do NOT automatically mark this wrong because the system expected "sad."

Instead show the teacher:

```text
Samaya chose:
Worried

Possible clues:
character looking down
hands clasped
small body posture
```

The teacher decides where the conversation goes.

---

# 4. COMMON TEACHING PRINCIPLES

These principles apply throughout this category.

## A. Help, not penalty

Mistakes produce:

```text
Oops — our brain brakes wobbled!
Let's try again.
```

Never:

```text
WRONG
FAILED
BAD LISTENING
```

---

## B. Be wrong on purpose

Provide teacher controls that occasionally allow the teacher to deliberately make a silly mistake.

Examples:

- teacher character fails to freeze
- teacher guesses the wrong emotion
- teacher chooses the wrong opposite
- teacher puts the thermometer marker somewhere ridiculous

The child can correct the teacher.

This should feel playful.

---

## C. Wait time

For emotional questions, do not pressure the child to answer immediately.

Where appropriate, the teacher UI should display a subtle private reminder:

```text
Give them a few seconds.
```

Do NOT show a visible countdown to the child.

Never turn thinking time into a timer.

---

## D. Specific positive feedback

Where applicable, encourage teacher language such as:

```text
You stopped your body even though you really wanted to keep moving.
```

rather than generic:

```text
Good girl!
```

The software can suggest these privately on the teacher screen.

---

## E. Choice

When possible, offer two meaningful choices rather than unrestricted menus.

Example:

```text
Would you like:
Dragon Breath
or
Rock the Buddy?
```

---

# 5. LIVE TEACHER/STUDENT ARCHITECTURE

Use the realtime infrastructure already built.

Every meaningful student action should be visible on the teacher screen.

Do NOT broadcast mouse movement continuously.

Broadcast meaningful state changes only.

Examples:

```text
thermometer level changed
emotion selected
body clue selected
opposite action chosen
character feeling selected
coping strategy chosen
breathing round completed
freeze response recorded
```

Create strongly typed events for these games.

Example conceptually:

```ts
type FeelingsFocusStudentEvent =
  | {
      type: "thermometer:level_selected";
      level: number;
      zone: EmotionZone;
    }
  | {
      type: "thermometer:body_clue_selected";
      clue: BodyClue;
    }
  | {
      type: "opposite:response";
      commandId: string;
      response: OppositeAction;
      correct: boolean;
    }
  | {
      type: "emotion:guess";
      sceneId: string;
      emotion: EmotionOption;
    }
  | {
      type: "strategy:selected";
      strategy: RegulationStrategy;
    }
  | {
      type: "freeze:response";
      roundId: string;
      responseType: "froze" | "continued" | "teacher_marked";
    };
```

Adapt these types properly rather than copying them blindly.

---

# 6. GAME 1 — FEELING THERMOMETER

## Educational purpose

Help children:

- identify emotional intensity
- develop emotional vocabulary
- notice physical body signals
- understand that feelings can change
- identify strategies that may help them regulate

Do NOT teach:

```text
Green = good
Red = bad
```

Strong feelings are not bad.

Frame it as:

```text
How BIG is the feeling?
```

---

# Student interface

Create a large whimsical thermometer.

Suggested structure:

```text
5 — VERY BIG
4 — BIG
3 — MEDIUM
2 — LITTLE
1 — CALM / SETTLED
```

Colours can gradually move:

```text
green → yellow → orange → red
```

but labels should focus on **intensity**, not morality.

Display a movable character/marker.

Prompt:

```text
Where is your feeling right now?
```

Child drags or taps the thermometer.

Example:

```text
Level 4
```

Teacher immediately sees:

```text
Samaya chose:
Level 4 — Big feeling
```

---

# Stage 2 — Name it

After choosing intensity, display emotion choices.

Start with accessible emotions:

```text
Happy
Excited
Calm
Worried
Sad
Angry
Frustrated
Scared
Disappointed
Proud
Embarrassed
Jealous
```

Teacher should be able to configure vocabulary complexity.

For younger children start with 4–6 choices.

Do not require selecting an emotion if the child doesn't know.

Include:

```text
I'm not sure
```

---

# Stage 3 — Body Detective

Prompt:

```text
Where do you notice it?
```

Use a friendly body silhouette.

Possible selectable clues:

```text
fast heart
hot face
tight tummy
butterflies
shaky hands
tight fists
busy legs
wanting to move
heavy body
tears
fast breathing
```

Allow:

```text
Somewhere else
I don't know
```

Do NOT interpret these medically.

The goal is simply noticing.

Teacher sees selections live.

---

# Stage 4 — Getting More Settled

Do NOT always ask the child to "get back to green."

Sometimes excitement is appropriate.

Instead ask:

```text
What does your body need next?
```

Possible strategy cards:

```text
Big breath
Move my body
Get some water
Quiet minute
Ask for help
Squeeze something
Count slowly
Talk about it
Brain break
Stay excited!
```

Teacher can discuss the choice.

---

# Character Mode

This is very important.

Some children may not want to discuss themselves.

Teacher should be able to switch:

```text
ME
CHARACTER
```

In Character Mode:

show a fictional creature experiencing something.

Example:

```text
Pip built a giant tower.

Someone knocked it over.

Where might Pip's feeling be on the thermometer?
```

The child chooses for Pip.

This allows emotional learning without requiring self-disclosure.

---

# Teacher panel

Show:

```text
Samaya

Intensity:
4 / 5

Feeling:
Frustrated

Body clues:
Hot face
Tight fists

Strategy chosen:
Move my body
```

Do NOT assign a score.

---

# 7. GAME 2 — THE OPPOSITE GAME

## Educational purpose

Practise inhibitory control:

```text
hear instruction
pause
hold rule in mind
override automatic response
perform opposite response
```

Make this energetic and funny.

---

# Core game

Teacher chooses a command pair.

Examples:

```text
JUMP ↔ SIT

HANDS UP ↔ HANDS DOWN

LOOK LEFT ↔ LOOK RIGHT

STAND ↔ CROUCH

LOUD ↔ QUIET

BIG ↔ SMALL

FAST ↔ SLOW
```

Student screen displays:

```text
OPPOSITE RULE

If Florie says:

JUMP

you do:

SIT!
```

Give one practice round.

---

# Live round

Teacher presses:

```text
JUMP
```

Student sees/hears the command.

Depending on implementation, the child can physically perform the action on camera.

Because the browser cannot reliably determine whether the child's physical movement was correct, provide two possible modes.

## Teacher-Observed Mode — DEFAULT

Teacher watches the child through their video call.

Teacher marks:

```text
Got it
Try again
```

This is the preferred mode for physical commands.

Do NOT attempt computer-vision body tracking.

---

## Screen Response Mode

For commands suitable for screen interaction, child chooses the opposite card.

Example:

Teacher sends:

```text
LEFT
```

Child taps:

```text
RIGHT
```

This can be automatically checked.

---

# Difficulty

### Level 1

One opposite pair.

Example:

```text
Jump ↔ Sit
```

### Level 2

Two pairs.

### Level 3

Three pairs.

### Level 4

Teacher changes the rule halfway.

Example:

Previously:

```text
Jump means Sit
```

Now:

```text
Jump means Freeze
```

This adds mental flexibility.

### Level 5

Faster sequence — but NEVER use a visible timer or pressure.

Teacher controls pace manually.

---

# Brain Brakes visual

Use a playful metaphor:

```text
GO brain
BRAKE brain
```

After a wobble:

```text
Our brain brakes slipped!

Try that one again.
```

Not:

```text
You weren't listening.
```

---

# Teacher dashboard

Track only useful observational information:

```text
Rounds: 8

Responded correctly first time: 5

Needed another try: 3

Rule switch:
Needed 2 practice turns
```

Avoid grades or percentages prominently during class.

---

# 8. GAME 3 — MIRROR FACE CHARADES

## Educational purpose

Practise:

- recognising emotional expressions
- identifying facial clues
- emotional vocabulary
- considering that expressions provide clues but do not reveal someone's thoughts with certainty

Important concept:

A facial expression gives us a **clue**, not guaranteed knowledge.

Do not teach:

```text
This face definitely means angry.
```

Use:

```text
What might this person be feeling?
```

---

# Privacy rule

Do NOT:

- record the child's camera
- capture screenshots
- upload webcam images
- perform facial recognition
- perform emotion detection
- save facial images

The child may use their existing video-call camera as a mirror.

The Florie app itself does not need camera access.

---

# Mode 1 — Child Makes the Face

Teacher sends:

```text
Show me your best:

SURPRISED FACE
```

Student receives a big emotion card.

Examples:

```text
Happy
Sad
Angry
Worried
Surprised
Confused
Excited
Proud
Disappointed
Frustrated
```

Teacher watches them on Meet/Zoom.

Teacher presses:

```text
Got it!
```

Then teacher asks verbally:

```text
What did your eyebrows do?
What happened to your mouth?
```

---

# Mode 2 — Guess the Character

Create original illustrated/SVG character faces.

Do NOT use copyrighted character images.

Show a face.

Ask:

```text
What might they be feeling?
```

Give 3–4 options.

Example:

```text
Excited
Worried
Angry
Sleepy
```

Child chooses:

```text
Worried
```

Teacher sees the answer.

Then ask:

```text
What clue made you think that?
```

Possible clue cards:

```text
Eyebrows
Eyes
Mouth
Hands
Body
Something else
```

---

# Mode 3 — Florence Gets It Wrong

Teacher presses:

```text
Silly Guess
```

Example character clearly appears surprised.

Teacher screen tells teacher to say:

```text
"I think she's sleepy."
```

Child can press:

```text
NOOO! 😂
```

Then explain their answer.

This deliberately creates opportunities for the child to teach the adult.

---

# Important nuance

Include occasional ambiguous expressions where **multiple answers are allowed**.

Example:

A character has:

```text
wide eyes
small smile
hands held tightly
```

Possible interpretations:

```text
excited
nervous
surprised
```

Teacher can discuss:

```text
We need more clues.
```

This is more useful for perspective-taking than teaching rigid face/emotion mappings.

---

# 9. GAME 4 — CHARACTER SCAVENGER HUNT

## Educational purpose

Practise:

- perspective taking
- emotional reasoning
- cause and effect
- problem-solving
- predicting what may happen next

---

# Important implementation choice

Do NOT depend on copyrighted digital picture books.

Build a reusable library of **original illustrated story scenes** using:

- SVG
- simple original illustrations
- CSS artwork
- locally bundled original assets

Design scenes so future story packs can easily be added.

---

# Core game

Display a detailed story scene.

Example:

```text
A birthday party.

One child is holding a balloon.

Another child's balloon has popped.

A third child is covering their ears.

Someone is waiting beside the cake.
```

Prompt:

```text
Can you find someone who might feel sad?
```

Child clicks a character.

Teacher immediately sees which character was selected.

Then ask:

```text
What makes you think that?
```

Child chooses clues or speaks verbally.

---

# Follow-up sequence

Use:

### 1. Find

```text
Find someone who might feel worried.
```

### 2. Why?

```text
What might have happened?
```

### 3. What next?

```text
What could they do next?
```

### 4. Another perspective

```text
How might the OTHER child feel?
```

---

# Example scenarios

Create at least 12 original scenes.

Examples:

### Toy problem

Two children both want the same toy.

### Tower falls

A child's block tower collapses.

### New classroom

One child stands near the door while others play.

### Birthday party

A child receives attention while another waits.

### Lost object

Someone cannot find their favourite toy.

### Rain starts

Outdoor play suddenly stops.

### Joining a game

A child watches others playing.

### Accidental bump

One child knocks another child's drawing.

### Surprise present

Different characters respond differently.

### Loud room

One character looks excited; another covers their ears.

### Waiting turn

Someone watches another child use the swing.

### Changed plan

The expected activity is cancelled.

---

# Important educational rule

Scenes should often allow several plausible interpretations.

Do not always have:

```text
one objectively correct emotion
```

Teacher should see:

```text
Possible discussion:
Sad
Disappointed
Frustrated
Embarrassed
```

rather than:

```text
Correct answer = Sad
```

---

# 10. GAME 5 — ROCK THE BUDDY

## Educational purpose

Teach a simple slow-breathing routine children can practise while calm.

The game should feel like:

```text
help your buddy fall asleep
```

rather than:

```text
calm yourself down because you're misbehaving
```

---

# Setup screen

Student sees:

```text
Find a buddy!

A teddy
A soft toy
A small cushion
or just use your hands
```

Teacher gives the child time to fetch something if appropriate.

Also include:

```text
No buddy? That's okay.
Put your hands on your tummy.
```

---

# Position

Allow two choices:

```text
Sit comfortably
Lie down comfortably
```

Do NOT require the child to move out of view or lie down.

Teacher chooses whichever works for the lesson environment.

---

# Breathing animation

Display a friendly sleeping creature or balloon.

Cycle visually:

```text
Breathe in...
```

Object slowly rises.

Then:

```text
Breathe out...
```

Object slowly lowers.

Avoid rigid medical breathing ratios.

Teacher can choose:

```text
Slow
Slower
```

Keep sessions short.

Default:

```text
3 breaths
```

Optional:

```text
5 breaths
```

No score.

No "perfect breath."

---

# Buddy animation

Create a small visual buddy on screen that gently rises and falls.

Prompt:

```text
Can you rock Buddy gently?
```

After completing:

```text
Buddy looks sleepy. 💤
```

---

# Reflection

Optional teacher-led question:

```text
What did you notice?
```

Child choices:

```text
My tummy moved
My breathing slowed
I feel the same
I feel calmer
I feel sleepy
I'm not sure
```

Every answer is acceptable.

Do not promise that breathing will always make someone calm.

---

# Teacher use

Teacher should be able to launch Rock the Buddy:

- as a standalone game
- after Feeling Thermometer
- after a movement game
- between academic blocks

Create a quick teacher button:

```text
Try a settling activity
```

that can launch it without ending the session.

---

# 11. GAME 6 — FREEZE DANCE

## Educational purpose

Practise switching between:

```text
high movement
↓
stop
↓
stillness
↓
movement again
```

This supports:

- inhibitory control
- attention switching
- body awareness
- regulation after excitement

---

# Important audio architecture

Do NOT depend on streaming copyrighted songs.

For V1 either:

1. include simple original royalty-free loop music bundled with the application

or

2. let the teacher use their own music externally and manually press:

```text
DANCE
FREEZE
```

Option 2 must work perfectly even without audio assets.

---

# Child screen

During movement:

```text
DANCE!
```

Use animated shapes/characters.

Teacher presses:

```text
FREEZE
```

Student instantly sees:

```text
FREEZE! 🧊
```

with the whole screen visually changing.

Teacher watches the child's physical response on the video call.

---

# Teacher marking

Teacher can privately mark:

```text
Froze straight away
Needed another cue
```

This is observational data only.

Do not show marks to the child.

---

# Variations

Add modes:

### Classic Freeze

Dance → Freeze.

### Silly Freeze

When freezing, show:

```text
Freeze like a flamingo!
Freeze like a superhero!
Freeze like jelly!
```

### Slow/Fast

Teacher switches:

```text
FAST DANCE
SLOW DANCE
FREEZE
```

### Emotion Freeze

```text
Freeze with an EXCITED face!
Freeze with a WORRIED face!
```

Combines physical regulation with emotional vocabulary.

### Opposite Freeze

Integrate with Opposite Game:

```text
When I say FREEZE...
MOVE!

When I say MOVE...
FREEZE!
```

Teacher should intentionally activate this harder mode.

---

# 12. SESSION COMBINATIONS

Create support for moving naturally between these games.

Example lesson sequence:

```text
Freeze Dance
↓
Feeling Thermometer
↓
Reading
↓
Opposite Game
↓
Maths
↓
Rock the Buddy
```

Do NOT treat Maths and Feelings & Focus as separate session types.

They are tools within one lesson.

---

# 13. QUICK TEACHER TOOLS

Add a small teacher-only panel accessible during ANY game:

## Quick Break

```text
[ Freeze Dance ]
[ Opposite Game ]
[ Rock the Buddy ]
```

## Feelings Check

```text
[ Thermometer ]
```

This allows the teacher to interrupt an academic game and move into a regulation activity without navigating through multiple menus.

Example:

Samaya becomes restless during maths.

Teacher clicks:

```text
Quick Break → Freeze Dance
```

Student browser immediately switches.

After 3 minutes:

```text
Return to Previous Game
```

The previous maths state should be preserved where practical.

This feature is important.

---

# 14. TEACHER OBSERVATIONS

Do NOT create behaviour grades.

Instead record lightweight observations.

Possible session data:

```text
Feeling Thermometer
- identified intensity
- named emotion
- identified body clue
- chose strategy

Opposite Game
- successful first responses
- retries
- rule-switch difficulty

Mirror Faces
- emotion words used
- facial clues identified

Character Hunt
- perspectives considered
- solutions suggested

Rock the Buddy
- completed breathing activity
- child's own reflection

Freeze Dance
- stopped on first cue
- needed repeat cue
- switched back into movement
```

These are observations, not diagnoses.

---

# 15. PRIVATE TEACHER NOTES

Allow Florie to add tiny notes such as:

```text
"Very excited today but returned to reading after Freeze Dance."
```

or:

```text
"Used 'frustrated' herself instead of saying angry."
```

Do not show these notes to the child.

Reuse the existing session-note system if one already exists.

---

# 16. END-OF-SESSION SUMMARY

Extend the existing summary.

Example:

```text
SAMAYA — TODAY

Reading
Read 6 new CVC words independently.

Maths
Recognised quantities 1–4 without counting.

Feelings & Focus
Named "frustrated" on the thermometer.
Identified tight fists as a body clue.
Completed 6 Opposite Game rounds.
Needed one reminder after the rule changed.
```

Avoid:

```text
Behaviour score: 72%
Self-control: Poor
Emotion regulation: Below average
```

Never rank children.

---

# 17. PRIDE-STYLE TEACHER REMINDERS

During appropriate games, show subtle teacher-only coaching prompts inspired by the interaction principles:

### Praise specifically

```text
"You stopped your body as soon as the rule changed."
```

### Reflect

Repeat or build on something the child said.

### Imitate

Join their silly face, movement or idea.

### Describe

```text
"You're holding completely still even though the music stopped suddenly."
```

### Enthusiasm

Keep interaction warm and playful.

Do not present these as therapy or claim that the software is providing PCIT or another clinical intervention.

They are simply teacher interaction reminders.

---

# 18. CHILD-FIRST LANGUAGE

Use language suitable for a six-year-old.

Prefer:

```text
Big feeling
Little feeling
Brain brakes
Body clues
Try another way
What's your body telling you?
What might they be feeling?
Let's try again
```

Avoid:

```text
executive dysfunction
emotional dysregulation
inhibitory control deficit
maladaptive behaviour
```

Those terms may exist in code/comments or teacher documentation where appropriate, but never on the child interface.

---

# 19. DESIGN

The Feelings & Focus category should visually belong to the Florie app but have its own personality.

Suggested themes:

### Feeling Thermometer
warm gradient / expressive little characters

### Opposite Game
arrows / switches / playful brain-brake imagery

### Mirror Faces
mirrors / expressive faces / speech bubbles

### Character Scavenger Hunt
storybook scenes / little worlds

### Rock the Buddy
night sky / soft clouds / sleepy characters

### Freeze Dance
movement / musical shapes / playful poses

Keep everything:

- warm
- whimsical
- calm
- uncluttered
- child-friendly
- touch friendly

Avoid creating an overstimulating arcade.

---

# 20. DATA MODEL

First inspect the existing game/session schema.

Do NOT duplicate session infrastructure.

Extend existing generic game round/attempt structures if they can support these games.

Because several activities have no right/wrong answer, make sure the data model supports outcomes such as:

```ts
type RoundOutcome =
  | {
      kind: "objective";
      correct: boolean;
    }
  | {
      kind: "observational";
    }
  | {
      kind: "discussion";
    };
```

Adapt the actual architecture appropriately.

Game data may include JSONB payloads such as:

```text
emotion
intensity
body_clues
selected_strategy
teacher_observation
child_explanation
```

Do not force all games into `correct_answer`.

---

# 21. REALTIME STATE

Use existing durable/realtime/history distinctions.

## Durable

- active game
- game settings
- current prompt
- current scene
- session status

## Realtime

- thermometer moved
- emotion selected
- flower/character selected
- child chose an opposite
- freeze command sent
- strategy selected

## Historical

- completed rounds
- attempts when applicable
- teacher observations
- selected feelings/body clues
- session notes

---

# 22. TESTING

Add meaningful tests for the new game logic and realtime protocol.

Test:

## Feeling Thermometer

- valid intensity range
- vocabulary difficulty configuration
- Character Mode
- body clues
- no score generated

## Opposite Game

- opposite pairs map correctly
- rule changes work
- retries work
- teacher-observed rounds do not require automatic correctness

## Mirror Face Charades

- ambiguous emotion scenes support multiple valid interpretations
- no camera upload/storage code exists
- teacher silly-guess mode works

## Character Scavenger Hunt

- scenes load correctly
- selected characters sync to teacher
- multiple interpretations are supported
- follow-up prompts appear in order

## Rock the Buddy

- breathing sequence progresses
- child can choose seated mode
- completion produces no score

## Freeze Dance

- teacher commands sync instantly
- freeze/dance state transitions work
- previous game can be restored after Quick Break

Also regression-test existing maths games.

---

# 23. DO NOT IMPLEMENT

Do NOT add:

- facial recognition
- AI emotion detection
- microphone analysis
- camera recording
- behaviour prediction
- diagnoses
- ADHD screening
- autism screening
- mental-health scores
- biometric data
- emotion scores
- public child profiles
- leaderboards
- punishments
- rewards based on "good behaviour"
- parent dashboards yet
- Momzo integration yet

---

# 24. IMPLEMENTATION ORDER

Before changing code:

1. Inspect the entire existing Florie project.
2. Understand the current generic game interface.
3. Understand session/realtime architecture.
4. Plan the smallest clean extension.
5. Do NOT duplicate existing infrastructure.
6. Add Feelings & Focus as a category.
7. Implement **Feeling Thermometer** end-to-end first.
8. Verify teacher/student realtime syncing.
9. Implement Opposite Game.
10. Implement Mirror Face Charades.
11. Implement Character Scavenger Hunt.
12. Implement Rock the Buddy.
13. Implement Freeze Dance.
14. Implement Quick Break / Return to Previous Game.
15. Extend session summaries.
16. Add tests.
17. Typecheck.
18. Lint.
19. Manually test using two browser windows.
20. Regression-test every maths game.

---

# 25. DEFINITION OF DONE

The feature is complete when this works:

```text
Florie starts a lesson.

Samaya joins.

Florie selects:
Feeling Thermometer.

Samaya's browser opens it.

Samaya moves herself to Level 4.

Florie immediately sees:
Level 4 — Big feeling.

Samaya chooses:
Excited.

Florie sees:
Excited.

Samaya chooses:
Busy legs.

Florie sees:
Body clue — Busy legs.

Florie then switches to:
Opposite Game.

Samaya's browser switches automatically.

Florie sends:
JUMP.

Samaya performs SIT on camera.

Florie marks:
Got it.

They continue.

During reading Samaya gets restless.

Florie presses:
Quick Break → Freeze Dance.

Her browser instantly changes.

They play for two minutes.

Florie presses:
Return to Reading.

The previous learning game returns.

Before ending, Florie selects:
Rock the Buddy.

They complete three slow breaths.

Florie ends the session.

The summary contains useful observations from both maths/learning and Feelings & Focus activities.
```

All of this must happen within the same live lesson architecture.

---

# 26. FINAL HANDOFF

When complete, report:

1. What was added
2. Files/components created
3. Existing architecture reused
4. Any database migrations
5. New realtime event types
6. How each game works
7. How Quick Break works
8. How observational vs objectively correct games are represented
9. Tests added
10. Manual testing performed
11. Any accessibility/privacy decisions
12. Any known limitations

Explicitly confirm whether you manually verified:

- Feeling Thermometer sync
- emotion selections sync
- Opposite Game teacher/student flow
- Mirror Face Charades flow
- Character Scavenger Hunt selections
- Rock the Buddy sequence
- Freeze Dance commands
- Quick Break
- Return to previous game
- mixed Maths + Feelings session
- session summary
- reconnect behaviour
- existing maths games still work

Do not claim anything was tested unless it actually was.