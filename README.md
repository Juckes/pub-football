# 🏆 Super 6s Football

A procedurally-driven Sunday league football manager RPG that blends deck-building mechanics, hidden attributes, and Crusader Kings-style random events into a hilariously chaotic narrative experience.

## 🎮 The Concept

**"Knowledge is Power"** — Your perception of player stats is unreliable until you gain scouting knowledge. React to what you *think* you know while uncovering the *truth* through card plays and match experience.

The game creates an addictive loop: you have to actually watch your 6-a-side team play several matches to uncover who the hidden gems are and who is just lazy fraud.

### Three Core Pillars

#### 1️⃣ Hidden Attribute System (Fog of War Scouting)

Players have true stats prefixed with `_` (e.g., `_pace: 92`), but you only see them through an inaccurate lens based on scouting knowledge:

```javascript
const player = {
    name: "Marcus 'The Flash' Vance",
    position: "FWD",
    
    // The hidden truth (1-100)
    _pace: 92,
    _skill: 45,
    _temperament: 18,
    
    // Scouting metric: 0 = unknown, 100 = perfectly scouted
    knowledge: 15, 
    
    personality: "Hothead / Egoist"
};
```

**How perception works:**

- Error margin = `40 - player.knowledge` (max ±20 error if unknown)
- Perceived value = true value ± random error
- Your squad table shows **descriptive labels**, not raw numbers:
  - ⚡ World Class (85+)
  - 🏃 Very Good (70+)
  - 🚶 Average (50+)
  - 🐢 Sluggish (30+)
  - 🛑 Heavy Footed (<30)

**Example:** A new signing with 15% knowledge and true pace of 92 might display as "🚶 Average" due to scouting error. Once you've gained 70%+ knowledge through cards and matches, you'll see "⚡ World Class."

#### 2️⃣ Deck Mechanic Loop (Shadow Empire Style)

Each week your backroom staff deal **up to 3 new cards** from a pool. You pick **one** to play and the rest are destroyed. Limited hand = tough choices:

- **📢 Hairdryer Treatment** — Berate a player
  - +25% knowledge on target
  - -10 temperament (they're annoyed)
  
- **🍻 Pub Sponsorship** — Team night out
  - +6 true skill (team cohesion)
  - +10 knowledge on affected players
  - Risk minor drama event
  
- **🏃 Intense Bleep Test** — Fitness drills
  - +4 true pace for entire squad (permanent)
  
- **🤫 Scout Network Leak** — Intel from old teammate
  - +35 knowledge on random player (huge spike)

Cards regenerate post-match, creating a strategic weekly loop.

#### 3️⃣ Narrative Drama (Crusader Kings Vibes)

After each match, a random "soap opera" event triggers to create emergent storytelling:

- **The Ego Clash:** _"Danny Miller was spotted arguing with his manager at a local pub over being subbed off. His morale drops."_

- **The Poaching Attempt:** _"Real Mudut has offered your star midfielder a custom luxury track jacket to defect. Loyalty tested!"_

- **The Fitness Crisis:** _"Your defender twisted his ankle stepping out of his delivery van on his day job. Pace temporarily reduced."_

These events inject personality and consequence into what could be a dry number-crunching game.

## 🎯 How to Play

1. **Draw your hand** — up to 3 new cards appear at the start of each week, depending on your backroom staff
2. **Pick one card** — you have to play one before kick-off, and the rest are destroyed (some are curses!). A weak or lazy backroom deals fewer cards and more curses. Set `MUST_PLAY_CARD` to `false` in `cards.js` if you'd rather be allowed to skip.
3. **Knowledge builds over time** — Cards and match events increase your scouting accuracy
4. **Kick Off the match** — Click "⚡ Kick Off Match" to simulate using your true player stats
5. **Soap opera unfolds** — After the final whistle, random events shape your squad's trajectory

### Match Engine Logic

Match outcomes depend on **hidden stats**:

- **72' minute:** If FWD true pace > 80 → GOAL
- **44' minute:** If DEF true temperament < 20 → Red card risk event
- **Knowledge gains:** Playing matches gives +12 knowledge to key performers, +20 for dramatic events
- **League simulation:** Other teams play autonomously based on random results

## 🧩 Squad & Positions

Positions are **GK, DEF, MID, FWD**. You start with a **10-man squad** (2 GK, 3 DEF, 3 MID, 2 FWD) and field a **six** — by default a 1-2-2-1 (1 GK, 2 DEF, 2 MID, 1 FWD). The spare four give you rotation and injury cover. You can pick any six you like, but position matters: attackers drive your attack and take most of the shots, defenders drive your defence, midfielders do both. The lineup bar shows your formation and warns if you've no keeper.

- Squad limit is 10; you can't release below 8 players or leave a position without a starting-side's worth of cover.
- Free agents in the transfer window come one per position.
- The squad shape lives in `data.js` (`SQUAD_SHAPE`, `XI_SHAPE`) — tweak it there.
- Saves from before this change are discarded on load (`SAVE_VERSION`).

## 📊 Example Roster (older 6-man version — squads are now generated procedurally)

| Name | Pos | True Pace | True Skill | Temperament | Personality |
|------|-----|----------|----------|-------------|-------------|
| Marcus 'The Flash' Vance | FWD | 92 | 45 | 18 | Hothead / Egoist |
| Danny 'The Fuse' Miller | MID | 68 | 85 | 32 | Arrogant Maestro |
| Benny 'The Wall' Cross | DEF | 52 | 60 | 88 | Stoic Workhorse |
| Charlie 'Glitch' Evans | GK | 71 | 50 | 55 | Unpredictable Clown |
| Reggie 'The Tank' Kray | DEF | 78 | 41 | 12 | Pure Loose Cannon |
| Sammy 'Silky' Smooth | MID | 84 | 79 | 60 | Introverted Genius |

*Stats are hidden initially. Your squad table reveals perception-based descriptions that improve with knowledge.*

## ✅ Bugs Fixed

- ✅ Broken template literal syntax in `renderSquad()` (was mixing `+` operators with backticks)
- ✅ Unclosed `<span>` tags in match log commentary
- ✅ Inconsistent property access (some code accessed `_temperament`, others `temperament`)
- ✅ Malformed standings table HTML (missing `<tr>` tags)
- ✅ Proper quote escaping in inline styles
- ✅ Responsive card layout with flexbox wrapping

## 🚀 Future Enhancements

- **Injury Persistence** — Drama events that reduce true stats for multiple weeks
- **Salary Cap / Budget System** — Limited resources to manage squad depth
- **Multi-opponent Variety** — Procedurally generated opponents with different play styles
- **Player Development Curves** — Stats improve/degrade based on age + playing time
- **Save/Load System** — Persist season progress in browser localStorage
- **Difficulty Settings** — Adjust AI league competitiveness
- **Advanced Scouting Cards** — Peek at opponent squad stats before fixtures
- **Transfer Window** — Buy/sell players and manage recruitment
- **Tactical Formations** — Cards that change setup (3-3 vs 2-2-2, formations with impact)
- **Player Personalities** — Trait-based effects (hotheads get cards more often, geniuses level up faster)
- **Multi-season Career** — Progression across multiple years with aging

## 🎨 Design Philosophy

- **Single-file portability** — No build steps, dependencies, or servers needed
- **Dark theme** — GitHub-inspired palette for that "Sunday night manager" vibe  
- **Emergent narrative** — Randomness creates *stories*, not just numbers
- **Hidden information** — Tension between perception and reality drives decisions
- **Fast feedback loops** — Weeks move quickly so you can run multiple seasons
- **High agency** — Every card choice matters; outcomes aren't purely RNG

## 📁 Files

- `procedural_6aside_manager.html` — Complete, self-contained game (HTML + CSS + JS)
- `test.html` — Original working reference version
- `README.md` — This design doc

## 🏁 The Vibe

This isn't a perfect football simulator—it's a chaotic, humorous take on Sunday league football where your ragtag squad of personalities, day-jobbers, and wannabe professionals stumble through a procedurally-generated season of drama, upsets, and unlikely glory.

-- Perhaps after initial development could bring in tactics and a tactics screen to be less 'choatic' and more 'professional' to give the user a sense of being able to influence the game via their choices.

**Open `procedural_6aside_manager.html` in any modern browser and start managing.**

---

*Inspired by Shadow Empire (deck mechanics), Crusader Kings (emergent narrative), and the chaos of actual Sunday league football.*

## 💻 Technical

- Where would we store all the players, teams, stats, history, leagues etc.
  - Different screens/pages for each?

## 🃏 Playing Cards

Each round/turn/week you draw cards, similar to how shadow empire works

- Each card gives a boost effect to your team/player/coach/training etc.
- This depends entirely on who are backroom staff are:
  - A good fitness coach will produce better fitness cards
  - A terrible coach or perhaps doesn't like work and likes a beer more so, would not produce cards as often and they maybe worse
  - Just because a coach is bad does not mean every roll creates a bad card, perhaps there is a 1-5% chance of creating a brilliant card such as tactical masterclass or something better named. All these cards could be in a separate file?
- You can only play a generated card once and would get removed afterwards, but could always be generated again in next creation from the list of cards available that the coach could produce
  - in fact, I think you can only ever have three cards present that newly generated each week. If you don't use them they get destroyed ready for next week and you can only choose 1 card each week to make this an important decision - Remember, some cards have negative effects and you may have to play it!

## More Ideas for AI to chew through

- Each club would have it's own clickable profile with stats such as home ground, name, history etc
- Each player is clickable and has their own profile describing them
- Each member of staff has a profile

## Other games that could be an influence

What do you think of these games on Steam:

- PIX Football Manager
- Boeckham's Football Manager
- NUTMEG!

## 🙍Personalities

- Perhaps a player likes conspriacy theories, and starts a branch of believing something that could affect his performances for example - something random like that depending on their personality.
