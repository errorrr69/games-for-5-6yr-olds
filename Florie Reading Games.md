# Florie Reading Games

Extend the existing **Florie live learning games application** by adding a new category:

# Reading Adventures

These games are for children approximately **5–7 years old** and are played live between a teacher and one child during an online lesson.

Do NOT create a separate app.

First inspect and reuse the existing:

- React/TypeScript application
- Supabase backend
- teacher authentication
- live lesson sessions
- join links/codes
- Realtime Broadcast
- Realtime Presence
- teacher/student game architecture
- game switching
- reconnect handling
- session summaries
- Maths category
- Feelings & Focus category
- shared design system

Existing functionality must continue working.

---

# 1. PRODUCT PURPOSE

The Reading category should systematically develop:

1. hearing sounds in spoken words
2. oral blending
3. oral segmentation
4. connecting sounds to letters
5. decoding CVC words
6. spelling CVC words
7. reading unfamiliar/nonsense words
8. digraphs
9. consonant blends
10. magic-e words
11. irregular/tricky words
12. connected decodable reading
13. retelling and comprehension

The child should experience this as:

- helping robots
- finding hidden objects
- making monsters
- building words
- solving mysteries
- casting spells
- travelling through stories

Not as worksheets.

---

# 2. READING LEVELS

Build the games around Florie's existing reading progression.

## R1 — Sounds Only

No written letters required initially.

Skills:

- rhyme
- syllables
- hearing first sounds
- oral blending
- oral segmenting

Example:

```text
/m/ /a/ /p/
→ map
```

---

## R2 — Letters Make Sounds

Connect phonemes to graphemes.

The child should learn the **sound** first, not rely on saying letter names.

Suggested teaching sequence:

```text
s a t p i n
m d g o c k
ck e u r
h b f l
j v w x y z
```

Teacher must be able to configure which sounds have already been taught.

---

## R3 — Short Words

Decode and spell CVC words.

Examples:

```text
cat
sun
big
hop
map
sit
dog
```

Also use unfamiliar nonsense words to check genuine decoding.

---

## R4 — Two Letters, One Sound

Primary focus:

```text
sh
ch
th
```

Teach that multiple letters can represent one sound.

Example:

```text
ship
```

has:

```text
/sh/ /i/ /p/
```

three sounds.

Treat `ck` appropriately as a spelling pattern rather than presenting it as a completely new sound.

---

## R5 — Blends

Examples:

```text
stop
frog
nest
```

Both consonant sounds remain audible.

Example:

```text
stop
/s/ /t/ /o/ /p/
```

four sounds.

This distinction from digraphs must be visually clear.

---

## R6 — Magic e

Examples:

```text
hop → hope
tap → tape
kit → kite
cub → cube
```

Show how the final `e` changes the vowel pattern.

---

# 3. NEW READING GAME LIBRARY

Add these games:

1. **Robot Translator** — oral blending
2. **Sound Safari** — initial sounds
3. **Skywriter Studio** — letter/sound connection
4. **Sound Box Factory** — CVC decoding and spelling
5. **Monster Name Lab** — nonsense-word decoding
6. **Digraph Detectives** — sh/ch/th
7. **Blend Train** — consonant blends
8. **Magic-e Wizard** — magic e
9. **Tricky Word Treasure** — irregular/high-frequency words
10. **Word Ladder Workshop** — manipulate one sound at a time
11. **Story Quest** — decodable reading + retelling

The teacher can select any appropriate game manually.

Do NOT automatically force a child through levels merely because they completed a fixed number of rounds.

---

# 4. HOME / TEACHER GAME LIBRARY

Teacher library should now show:

```text
MATHS
...

READING ADVENTURES
🤖 Robot Translator
🔎 Sound Safari
✨ Skywriter Studio
📦 Sound Box Factory
👾 Monster Name Lab
🕵️ Digraph Detectives
🚂 Blend Train
🪄 Magic-e Wizard
💎 Tricky Word Treasure
🪜 Word Ladder Workshop
📚 Story Quest

FEELINGS & FOCUS
...
```

Teacher chooses the game.

Student browser switches automatically using the existing realtime architecture.

No reload.

---

# 5. UNIVERSAL READING RULES

These rules apply to the entire Reading category.

## Rule A — Decode, don't guess

Never encourage:

```text
look at the picture and guess the word
```

Pictures can support comprehension and enjoyment, but should not provide the answer to decoding tasks.

---

## Rule B — Give thinking time

When a child is decoding:

Do NOT instantly reveal the answer.

Teacher UI should privately remind Florie:

```text
Wait.
Give her time to sound it through.
```

Allow approximately 7 seconds before suggesting help.

Do NOT show the child a countdown timer.

---

## Rule C — Help in steps

If the child is stuck, scaffold.

Example:

Word:

```text
map
```

First:

```text
What's the first sound?
```

Then:

```text
/m/
```

Then:

```text
What sound comes next?
```

Eventually blend:

```text
/m/ /a/ /p/
map
```

Never immediately give the whole word unless necessary.

---

## Rule D — Nonsense words matter

Nonsense words test decoding because they cannot simply be retrieved from a memorised sight-word bank.

BUT:

Nonsense words must contain only phonics patterns the teacher has enabled.

Do NOT give a beginner an unfamiliar grapheme and then interpret failure as poor decoding.

Generate legal simple pseudowords from the currently taught sound set.

---

## Rule E — Tricky words are separate

Words containing irregular/high-frequency patterns should be taught in their own game.

Examples:

```text
the
said
was
you
they
```

Do NOT place these in normal phoneme sound boxes as though every letter maps straightforwardly.

Teacher introduces approximately five at a time.

---

## Rule F — Two-day mastery

Do NOT mark a reading level mastered from one successful session.

A milestone is considered secure only when demonstrated on at least **two different days**.

The software can track:

```text
Demonstrated:
✓ Tuesday
✓ Thursday

Secure
```

Do not turn this into a child-facing badge or score.

This is teacher information.

---

# 6. REALTIME ARCHITECTURE

Reuse the existing live teacher/student infrastructure.

Meaningful reading interactions should be visible on the teacher browser immediately.

Examples:

```text
child selected picture = map

child selected sound = /m/

child placed letter m in box 1

child constructed word = cat

child selected digraph = sh

child decoded monster word = vop

child changed hop → hope

child tapped tricky word = said

teacher marked word independently decoded

teacher marked child needed help
```

Do NOT stream every cursor movement.

---

# 7. OBJECTIVE VS TEACHER-OBSERVED READING

Some reading interactions can be checked automatically.

Example:

```text
Child builds:
c-a-t

Expected:
c-a-t
```

Other skills require the teacher listening.

Example:

```text
Child reads "vop" aloud.
```

The browser cannot reliably know whether they pronounced it correctly.

Therefore support:

## Automatic mode

For:

- selecting sounds
- building words
- matching words
- arranging letters
- identifying missing graphemes

## Teacher-observed mode

Teacher hears the child over the existing video call and presses:

```text
Read independently
Needed a prompt
Let's try again
```

Do NOT implement speech recognition in V1.

Do NOT record the child's voice.

---

# 8. GAME 1 — ROBOT TRANSLATOR

## Level

R1 — Sounds Only

## Educational goal

Develop oral blending.

The child hears separate phonemes and combines them into a spoken word.

---

# Theme

A silly robot has landed on Earth.

Unfortunately:

> Robo can only speak in sounds.

The child becomes:

# ROBO'S TRANSLATOR

---

# Student screen

Show an expressive robot.

Teacher privately receives a word:

```text
MAP
```

with teacher cue:

```text
Say:

/m/ ... /a/ ... /p/
```

Student sees Robo making three little sound pulses:

```text
🔵   🔵   🔵
```

but NOT the written word.

Teacher speaks the sounds over the video call.

Then Robo asks:

```text
What word am I trying to say?
```

---

# Response modes

## Mode A — Picture choice

Show 3–4 pictures:

```text
map
cat
sun
fish
```

Child clicks the matching picture.

Teacher sees answer immediately.

This keeps R1 genuinely letter-free.

---

## Mode B — Say It

Child says the word aloud.

Teacher marks:

```text
Blended independently
Needed another listen
Needed help
```

---

# Difficulty

### Level 1

Two-phoneme oral blends where appropriate.

### Level 2

Simple three-sound CVC words.

### Level 3

Longer pauses between sounds become shorter.

Example:

```text
/m/ ... /a/ ... /p/
```

eventually:

```text
/m/-/a/-/p/
```

### Level 4

Child becomes Robot.

Teacher gets:

```text
Child's turn:
SUN
```

Child segments:

```text
/s/ /u/ /n/
```

Teacher deliberately guesses wrongly sometimes.

Provide teacher button:

```text
Silly Wrong Guess
```

which suggests something such as:

```text
"Did you say... SOCK?!"
```

Child corrects Florie.

---

# 9. GAME 2 — SOUND SAFARI

## Level

R1

## Educational goal

Identify initial sounds.

---

# Theme

The child is going on a **Sound Safari**.

A sound is the creature they are hunting.

Example:

```text
Today's sound:

/s/
```

---

# Mode A — Digital Safari

Show a rich illustrated scene containing many objects.

Example:

Bedroom:

- sock
- sun picture
- teddy
- lamp
- cup
- snake toy
- book
- spoon

Prompt:

```text
Find something beginning with /s/.
```

Child taps objects.

Valid examples:

```text
sock
snake
spoon
sun
```

Teacher sees selections live.

---

# Mode B — Real Room Hunt

Prompt:

```text
Can you find something in YOUR room beginning with /b/?
```

Child physically finds something.

Teacher watches on video.

Teacher marks:

```text
Found one
Needed clue
Try another sound
```

No camera processing.

---

# Important rule

Teacher interface displays:

```text
Use the SOUND:

/s/

not:

"ess"
```

---

# Difficulty

Start with highly distinct initial phonemes.

Later include pairs children commonly confuse.

Teacher chooses enabled sound set.

---

# 10. GAME 3 — SKYWRITER STUDIO

## Level

R2 — Letters Make Sounds

## Educational goal

Connect:

```text
sound ↔ letter shape
```

using large motor movement and visual memory.

---

# Theme

The child is drawing letters in the sky using magic light.

---

# Mode A — Real Air Writing

Teacher selects:

```text
/t/
```

Student sees:

```text
Can you draw /t/ in the air?
```

Display a glowing lowercase:

```text
t
```

briefly if teacher chooses.

Child uses whole arm in front of camera.

Teacher marks:

```text
Got it
Needs another look
```

No camera recognition.

---

# Mode B — Screen Skywriting

Show a giant faint letter path.

Child uses:

- mouse
- finger
- stylus

to trace it.

Trail glows behind them.

Do NOT require pixel-perfect handwriting.

This is exploration, not handwriting assessment.

After tracing:

display:

```text
t says /t/
```

Teacher says the sound with them.

---

# Quick Sound Mode

Show a letter.

Student selects/says its sound.

Teacher can mark oral responses.

Track whether the sound was produced rapidly, but do NOT show speed scores to the child.

---

# 11. GAME 4 — SOUND BOX FACTORY

## Level

R3 — Short Words

## Educational goal

Segment and blend CVC words.

---

# Theme

Words arrive at a factory.

Each sound needs its own box.

Example:

```text
CAT
```

Factory displays:

```text
[   ] [   ] [   ]
```

---

# Mode A — Hear and Build

Teacher says:

```text
cat
```

Student hears:

```text
/c/ /a/ /t/
```

and chooses letters from a tray:

```text
c
t
a
p
m
```

Child drags/taps:

```text
[c] [a] [t]
```

Teacher sees every placement live.

---

# Mode B — Sound Counters First

Before letters, use coloured counters.

Child places one counter per sound:

```text
● ● ●
```

Then replace counters with letters.

This supports:

```text
sound first
symbol second
```

---

# If child struggles

Teacher has:

```text
Stretch Word
```

Teacher prompt appears privately:

```text
Say slowly:

ccccaaaaat
```

Do NOT automatically give the middle vowel.

---

# Success

Once complete:

```text
/c/ /a/ /t/

CAT!
```

Word can animate through the factory.

---

# Teacher settings

Configure:

- enabled letters
- vowel set
- word length
- picture support on/off
- counters-first on/off

---

# 12. GAME 5 — MONSTER NAME LAB

## Level

R3+

## Educational goal

Check genuine decoding using unfamiliar pseudowords.

This is the "truth-teller" game.

---

# Theme

A laboratory is creating ridiculous monsters.

Every monster needs a strange name.

Generate a new original monster and a nonsense word.

Example:

```text
VOP
```

Student sees:

👾

```text
Meet...

vop
```

Prompt:

```text
What's its name?
```

Child reads it aloud.

Teacher marks:

```text
Decoded independently
Sounded through with help
Guessed
Try again
```

---

# Important word-generation rule

Never generate completely arbitrary letter sequences.

Nonsense words must:

- be pronounceable
- follow current phonics patterns
- use only teacher-enabled graphemes
- avoid accidental inappropriate/real offensive words
- avoid advanced patterns not yet taught

Examples at basic CVC level:

```text
mip
lat
dop
teg
pum
```

Use words such as `vop` only when `v` has already been taught.

---

# Monster Customisation

After decoding, let child choose:

```text
eyes
horns
colour
feet
hat
```

Then monster displays name:

```text
MIP
```

This gives an enjoyable payoff after decoding.

---

# Role-Reversal Mode

Child builds a nonsense monster name from enabled graphemes.

Example:

```text
zop
```

Teacher tries to read it.

Teacher gets a:

```text
Silly Mistake
```

button.

Child becomes teacher.

---

# 13. GAME 6 — DIGRAPH DETECTIVES

## Level

R4

## Educational goal

Understand that:

```text
two letters
can represent
one sound
```

Focus initially on:

```text
sh
ch
th
```

---

# Theme

The child joins a detective agency.

Some letters have secretly teamed up.

They need to find the **Letter Partners**.

---

# Intro animation

Display:

```text
s      h
```

They slide together:

```text
sh
```

Then produce:

```text
/sh/
```

Use animation only as support.

---

# Mode A — Feed the Detectives

Create three characters:

🦈 **Shark** — `sh`

🐥 or another original character — `ch`

🧵 / thunder character — `th`

Words appear:

```text
ship
chin
thin
sock
that
fish
cat
```

Child sends each word to the appropriate detective.

Include traps that belong to nobody.

---

# Mode B — How Many Sounds?

Example:

```text
SHIP
```

Show four letters.

Ask:

```text
How many sound boxes?
```

Correct:

```text
[sh] [i] [p]

3 sounds
```

Compare later:

```text
STOP

[s] [t] [o] [p]

4 sounds
```

This prepares for R5.

---

# Mode C — Build the Pair

Child sees:

```text
_ ip
```

and available graphemes:

```text
sh
ch
th
```

Chooses:

```text
sh
```

to create:

```text
ship
```

---

# 14. GAME 7 — BLEND TRAIN

## Level

R5

## Educational goal

Hear and retain BOTH consonant sounds in a blend.

Examples:

```text
stop
frog
nest
clap
trip
```

---

# Theme

Each sound gets its own train carriage.

Example:

```text
STOP
```

Train:

```text
[s]—[t]—[o]—[p]
```

Four carriages.

Compare:

```text
SHOP
```

Train:

```text
[sh]—[o]—[p]
```

Three carriages.

---

# Mode A — Build the Train

Teacher says:

```text
frog
```

Child determines how many sounds.

Then drags graphemes into carriages:

```text
[f] [r] [o] [g]
```

Train leaves station once correct.

---

# Mode B — Missing Carriage

Show:

```text
[s] [ ] [o] [p]
```

Ask:

```text
Which sound disappeared?
```

Child chooses:

```text
t
```

---

# Mode C — Digraph or Blend?

Two stations:

```text
LETTER TEAM
ONE SOUND

BLEND
TWO SOUNDS
```

Words arrive.

Child sorts:

```text
ship
stop
chin
frog
thin
nest
```

---

# 15. GAME 8 — MAGIC-E WIZARD

## Level

R6

## Educational goal

Notice the change between short-vowel and magic-e word patterns.

---

# Theme

The child becomes a word wizard.

A word appears:

```text
hop
```

Teacher/child drags the glowing magic `e` to the end:

```text
hop + e
```

Wand animation:

✨

Word becomes:

```text
hope
```

---

# Child must read both

Teacher marks aloud reading:

```text
hop ✓
hope ✓
```

---

# Pairs

Create a curated library:

```text
hop / hope
tap / tape
cap / cape
kit / kite
rid / ride
cub / cube
```

Only use appropriate decodable examples.

---

# Mode A — Cast the Spell

Child adds:

```text
e
```

and reads the transformed word.

---

# Mode B — Break the Spell

Remove `e`.

Example:

```text
kite → kit
```

---

# Mode C — Which Word?

Show two images.

Example:

```text
cap
cape
```

Child chooses which written word matches.

---

# 16. GAME 9 — TRICKY WORD TREASURE

## Purpose

Practise irregular/high-frequency words separately from ordinary decoding.

Teacher selects approximately **five active words at a time**.

Examples:

```text
the
said
was
you
they
```

---

# Theme

The words are treasure gems hidden in a cave.

Each active word has its own jewel.

---

# Mode A — Find the Word

Prompt:

```text
Find:

said
```

Several gem cards appear:

```text
the
said
you
was
they
```

Child selects.

---

# Mode B — Flash Treasure

Word appears briefly:

```text
was
```

Then hides.

Child selects it from several cards.

---

# Mode C — Missing Word

Simple decodable-ish sentence:

```text
The cat ___ big.
```

Choices:

```text
was
you
said
```

Use only sentences appropriate to their reading level.

---

# Important

Do not imply these words should be guessed generally.

They are a separately taught category.

Teacher controls exactly which words are active.

---

# 17. GAME 10 — WORD LADDER WORKSHOP

## Level

R3–R5

## Educational goal

Develop phoneme manipulation and spelling.

Change only one sound at a time.

---

# Theme

Build a ladder to help a character climb somewhere silly:

- moon
- treehouse
- dragon castle
- giant cupcake

Every correctly changed word adds a rung.

---

# Example

Start:

```text
cat
```

Prompt:

```text
Change /a/ to /o/.
```

Child changes:

```text
cat → cot
```

Then:

```text
Change /t/ to /p/.
```

```text
cot → cop
```

Then:

```text
cop → cap
```

Then:

```text
cap → cup
```

Each correct change builds one rung.

---

# Important

Teacher controls enabled graphemes.

Generated ladders must never require untaught patterns.

Create a curated library rather than relying on arbitrary runtime word generation.

---

# 18. GAME 11 — STORY QUEST

## Level

R3+

## Educational goal

Move phonics into actual reading.

Practise:

- decoding
- fluency
- understanding
- retelling

---

# Core principle

Stories must be **decodable at the selected phonics stage**.

Do not create stories where the child has to guess unknown words from pictures.

Pictures support meaning, not decoding.

---

# Story structure

Create short ORIGINAL illustrated stories.

Each story should contain approximately:

```text
4–8 pages
```

depending on level.

Each page contains:

- simple illustration
- one short sentence or phrase
- controlled phonics patterns
- limited active tricky words

---

# Example early story

If enabled graphemes support it:

```text
Sam sat.

A cat sat.

Sam can pat the cat.

The cat ran.

Sam ran.
```

Do not use this exact example if it violates the configured phonics set.

Build stories from curated stage-specific vocabulary.

---

# Reading interaction

Teacher chooses:

```text
Read together
Child reads
Take turns
```

---

# Teacher Observed Words

Teacher can tap a word while child reads and mark:

```text
Decoded independently
Self-corrected
Needed sound prompt
Teacher supplied word
```

Do not require marking every word.

The teacher should be able to focus on the lesson rather than data entry.

---

# Highlight Help

If child gets stuck on:

```text
ship
```

teacher can tap:

```text
Help
```

Student sees visual chunking:

```text
sh | i | p
```

NOT:

```text
Here's the answer: ship
```

---

# Retell

At story end:

```text
Tell me what happened.
```

Optional visual prompts:

```text
FIRST
THEN
LAST
```

Teacher can mark:

```text
Retold independently
Needed prompts
```

Do not automatically score spoken comprehension.

---

# Silly Mistake Mode

Teacher presses:

```text
Read It Wrong
```

Teacher privately gets a suggested deliberate mistake.

Example:

Story says:

```text
The cat sat.
```

Teacher says:

```text
"The cat slept."
```

Child catches Florie.

This keeps them actively attending to print.

---

# 19. PHONICS CONTENT SYSTEM

This is very important.

Do NOT hardcode unrelated word lists inside each component.

Create a central content/data layer.

Example concept:

```ts
interface Grapheme {
  id: string;
  grapheme: string;
  phoneme: string;
  stage: ReadingStage;
}

interface ReadingWord {
  text: string;
  graphemes: string[];
  phonemes: string[];
  stage: ReadingStage;
  kind: "decodable" | "tricky" | "pseudoword";
}

interface DecodableStory {
  id: string;
  title: string;
  requiredGraphemes: string[];
  trickyWords: string[];
  pages: StoryPage[];
}
```

Adapt appropriately.

Games should consume this shared reading content system.

---

# 20. TEACHER'S CURRENT SOUND SET

Create a teacher control called:

# Sounds We Know

Teacher can enable graphemes already introduced.

Example:

```text
✓ s
✓ a
✓ t
✓ p
✓ i
✓ n

□ m
□ d
□ g
...
```

Games must respect this.

If only:

```text
s a t p i n
```

are enabled:

- Sound Box Factory
- Monster Name Lab
- Word Ladders
- Story Quest

must only use words compatible with those patterns, aside from explicitly enabled tricky words.

This is crucial.

---

# 21. QUICK READING CONTROLS

During any reading game, teacher should have:

```text
[ Easier ]
[ Harder ]
[ Another One ]
[ Repeat ]
[ Give a Clue ]
[ Switch Game ]
```

`Give a Clue` should be game-specific.

Examples:

Robot:

```text
Repeat sounds more slowly.
```

Sound Boxes:

```text
Reveal first sound.
```

Monster:

```text
Underline first grapheme.
```

Digraphs:

```text
Highlight letter pair.
```

Magic e:

```text
Glow the final e.
```

---

# 22. QUICK BREAK INTEGRATION

Existing Feelings & Focus Quick Break must work from Reading.

Example:

Samaya is decoding words and starts becoming restless.

Teacher clicks:

```text
Quick Break
→ Freeze Dance
```

Reading state is preserved.

After two minutes:

```text
Return to Reading
```

She returns to the exact same game/round where practical.

---

# 23. TEACHER OBSERVATIONS

Reading data should be useful but lightweight.

Examples:

## Robot Translator

```text
8 oral blends
6 independent
2 needed repeat
```

## Sound Safari

```text
/s/ secure
/m/ secure
/t/ needed prompts
```

## Sound Boxes

```text
CVC segmentation:
strong first/final sounds
middle vowel still difficult
```

## Monster Name Lab

```text
Real words: secure
Nonsense words: still sounding slowly
```

## Digraph Detectives

```text
sh secure
ch secure
th emerging
```

## Blend Train

```text
Often drops second consonant in initial blends
```

## Story Quest

```text
Decoded unfamiliar words instead of guessing
Retold sequence with prompts
```

---

# 24. NO CHILD-FACING READING SCORES

Do not show:

```text
72%
Below average
Reading age
Failed
Slow reader
```

Instead child sees:

```text
You helped Robo!
Monster has a name!
The train is ready!
You solved the word!
```

Teacher gets instructional observations.

---

# 25. MASTERY TRACKING

Teacher may optionally assign a current reading level.

Example:

```text
Samaya
Current focus: R3
```

Track milestones across dates.

Example:

```text
R3 — CVC decoding

Tuesday:
✓ decoded unfamiliar CVC words

Thursday:
✓ decoded unfamiliar CVC words

Status:
SECURE
```

Teacher decides whether the child moves up.

The software must NOT automatically advance the child merely because an algorithm says so.

---

# 26. SESSION SUMMARY

Extend existing end-of-session summary.

Example:

```text
SAMAYA — TODAY

READING

Robot Translator
7/8 words blended independently.

Sound Boxes
Built:
cat
map
sit
dog

Needed help hearing the middle sound in "dog".

Monster Name Lab
Read:
mip
lat
pum

All three sounded through rather than guessed.

Story Quest
Read 5 pages.
Retold the story using first / then / last.
```

And alongside:

```text
MATHS
...

FEELINGS & FOCUS
...
```

One combined lesson summary.

---

# 27. PRIVACY

Do NOT implement:

- microphone recording
- speech recording
- automatic pronunciation scoring
- child voice storage
- webcam recording
- facial recognition
- AI reading diagnosis

Teacher listens through their normal video-call platform and records simple observational outcomes.

---

# 28. ACCESSIBILITY

Support:

- large touch targets
- mouse
- tablet
- keyboard
- reduced motion
- clear readable fonts
- lowercase letters in phonics activities unless there is a teaching reason otherwise

Do not make drag-and-drop the only interaction.

Where possible support:

```text
tap item
→ tap destination
```

as an alternative.

---

# 29. VISUAL THEMES

Keep Reading Adventures cohesive but give each game its own world.

## Robot Translator

Space station / friendly robot / glowing sound pulses.

## Sound Safari

Rich rooms / jungles / treasure hunts.

## Skywriter

Night sky / glowing trails / clouds.

## Sound Box Factory

Conveyor belts / boxes / playful machinery.

## Monster Name Lab

Colourful laboratory / custom monsters.

## Digraph Detectives

Detective office / clues / magnifying glasses.

## Blend Train

Train station / carriages for sounds.

## Magic-e Wizard

Castle / wand / glowing letters.

## Tricky Word Treasure

Cave / jewels / treasure map.

## Word Ladder Workshop

Treehouse / ladder / building workshop.

## Story Quest

Small illustrated story worlds.

Keep the visuals:

- whimsical
- warm
- calm
- premium
- not overstimulating

---

# 30. ORIGINAL ART AND CONTENT

Do NOT use:

- copyrighted book pages
- Disney characters
- existing children's-book illustrations
- random Google images

Create original:

- SVG characters
- CSS illustrations
- local art assets
- original decodable stories

Architecture should allow Florie to add custom story packs later.

---

# 31. DATABASE / DATA MODEL

Inspect existing schema first.

Reuse generic:

- lesson sessions
- rounds
- attempts
- teacher observations

Extend only where needed.

Consider structures for:

```text
student_reading_profiles
reading_mastery_evidence
enabled_graphemes
active_tricky_words
```

Only add permanent child-level data if the existing application already has an appropriate learner/profile concept.

Do not unnecessarily redesign the whole database.

---

# 32. REALTIME EVENT EXAMPLES

Create properly typed events.

Examples:

```ts
type ReadingStudentEvent =
  | {
      type: "sound:selected";
      roundId: string;
      sound: string;
    }
  | {
      type: "letter:placed";
      roundId: string;
      boxIndex: number;
      grapheme: string;
    }
  | {
      type: "word:built";
      roundId: string;
      word: string;
    }
  | {
      type: "picture:selected";
      roundId: string;
      objectId: string;
    }
  | {
      type: "digraph:selected";
      roundId: string;
      grapheme: string;
    }
  | {
      type: "story:page_changed";
      storyId: string;
      page: number;
    };
```

Teacher-observed outcomes can use separate teacher events/data.

---

# 33. TESTING

Add meaningful tests.

## Robot Translator

- appropriate word generated
- picture answer matches word
- letters are not shown in pure R1 mode

## Sound Safari

- target objects genuinely begin with selected phoneme
- distractors do not

## Skywriter

- enabled grapheme set respected
- physical mode does not require camera API

## Sound Boxes

- correct number of phoneme boxes
- CVC word structures correct
- enabled graphemes respected

## Monster Name Lab

- pseudowords are pronounceable
- only enabled graphemes used
- banned/inappropriate accidental strings filtered

## Digraph Detectives

- ship = 3 sounds
- stop = 4 sounds
- digraph sorting correct

## Blend Train

- all phonemes represented
- blend vs digraph distinctions correct

## Magic-e Wizard

- valid curated word pairs
- transformations correct

## Tricky Words

- only teacher-selected active words used

## Word Ladder

- exactly one intended phoneme/grapheme change per step
- all words valid for selected level

## Story Quest

- stories only require allowed graphemes + explicitly enabled tricky words
- page state synchronises teacher/student

Regression-test Maths and Feelings & Focus.

---

# 34. DO NOT IMPLEMENT

Do NOT add:

- speech-to-text scoring
- automatic pronunciation grading
- AI-generated live phonics words
- AI-generated live children's stories
- reading-age labels
- child ranking
- leaderboards
- speed pressure
- timers for decoding
- guessing-from-picture mechanics
- copyrighted books
- webcam analysis
- voice recording

---

# 35. IMPLEMENTATION ORDER

Before coding:

1. Inspect the whole existing repository.
2. Understand the generic game architecture.
3. Understand teacher/student realtime state.
4. Understand existing session summaries.
5. Design the shared phonics-content layer.
6. Add **Sounds We Know** configuration.
7. Add the Reading category.
8. Build **Robot Translator** end-to-end.
9. Verify teacher/student realtime behaviour.
10. Build Sound Safari.
11. Build Skywriter Studio.
12. Build Sound Box Factory.
13. Build Monster Name Lab.
14. Build Digraph Detectives.
15. Build Blend Train.
16. Build Magic-e Wizard.
17. Build Tricky Word Treasure.
18. Build Word Ladder Workshop.
19. Build Story Quest.
20. Integrate Quick Break.
21. Add reading observations/mastery evidence.
22. Extend session summaries.
23. Add tests.
24. Typecheck.
25. Lint.
26. Test teacher/student using two browsers.
27. Regression-test Maths.
28. Regression-test Feelings & Focus.

Do not build all visual games before validating the reading content model and realtime flow.

---

# 36. DEFINITION OF DONE

The feature is complete when this flow genuinely works:

```text
Florie starts Samaya's lesson.

Samaya joins.

Florie chooses:
Robot Translator.

Samaya sees Robo.

Florie privately sees:
/m/ /a/ /p/

Florie says the sounds.

Samaya selects the picture of a map.

Florie immediately sees:
MAP ✓

They do several rounds.

Florie switches to:
Sound Box Factory.

Samaya's browser changes automatically.

Florie says:
"cat"

Samaya builds:

[c] [a] [t]

Florie sees every placement live.

Next Florie chooses:
Monster Name Lab.

Monster appears:

MIP

Samaya sounds it out aloud.

Florie marks:
Decoded independently.

Later Samaya becomes restless.

Florie presses:

Quick Break
→ Freeze Dance

They play briefly.

Florie presses:
Return to Reading.

Monster Name Lab returns at the same point.

Finally Florie chooses:
Story Quest.

Samaya reads an original decodable mini-story.

Florie gives one sound prompt.

At the end Samaya retells:
first → then → last.

Florie ends the lesson.

Session summary contains:
reading observations
maths work
feelings/focus activities
teacher notes.
```

---

# 37. FINAL HANDOFF

When complete, report:

1. What was built
2. Games added
3. Reading-content architecture
4. How enabled graphemes work
5. How pseudowords are generated
6. How decodable stories are validated
7. Teacher/student realtime events
8. Database changes
9. Reading mastery tracking
10. Privacy decisions
11. Tests added
12. Manual tests performed
13. Known limitations

Explicitly state whether you manually verified:

- Robot Translator
- Sound Safari
- Skywriter
- Sound Boxes
- Monster Name Lab
- Digraph Detectives
- Blend Train
- Magic-e Wizard
- Tricky Word Treasure
- Word Ladder
- Story Quest
- teacher/student realtime sync
- switching between Reading and Maths
- Reading → Quick Break → Return to Reading
- two-day mastery storage
- session summary
- reconnect behaviour
- existing Maths games
- existing Feelings & Focus games

Do not claim anything was tested unless it actually was.