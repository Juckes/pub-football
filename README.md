# pub-football
6 a side football game

- Each round/turn/week you draw cards, similar to how shadow empire works
	- Each card gives a boost effect to your team/player/coach/training etc.
- 6 a-side or 5 a-side or something different?
- 1 league
- 10 teams or less teams to start with for instance - these could be randomly generated each game.
- limited attributes:
```typescript
const player = {
    name: "Marcus 'The Flash' Vance",
    position: "FWD",
    
    // The hidden truth (1 to 100)
    _pace: 92,
    _skill: 45,
    _temperament: 18,
    
    // Knowledge Metric: 0 = completely unknown player, 100 = perfectly scouted
    knowledge: 15, 
    
    personality: "Hothead / Egoist"
};
```
- Build stories/ Soap Opera - perhaps along the lines of a game such as 'Old World', 'Crusader Kings'? - **soul, storytelling, and high player personality** - I guess similar features to FM Dynamics?
	- **The Ego Clash:** _"Danny Miller (FC Vibe) was spotted arguing with his manager at a local pub over being subbed off last game. His morale drops, but his determination increases."_
	- **The Poaching Attempt:** _"Real Mudut (a rival team) has offered your star midfielder £50 a week to switch sides. Their loyalty trait is tested."_
	- **The Fitness Crisis:** _"Your defender turned his ankle stepping out of his delivery van. Fitness dropped by 4 points for the next two weeks."_
- I'd prefer stats to be more descriptive rather than a raw number. So, I know that player x is really fast, that could be represented by a horizontal bar for example, or simply, pace is very fast, or slow, but behind the scenes it would be stored in numbers but you would have to witness the player to reveal the report for example?
	- for example:

```typescript
  function getStatReport(player, statName) {
    // 1. Get the true hidden value (e.g., player._pace)
    let trueValue = player[`_${statName}`];
    
    // 2. Fog of War: If knowledge is low, introduce a scouting error margin
    let errorMargin = Math.max(0, 40 - player.knowledge); // max 40 point error if unknown
    let randomError = (Math.random() * errorMargin) - (errorMargin / 2);
    let perceivedValue = Math.min(100, Math.max(1, trueValue + randomError));

    // 3. Translate the perceived value into text descriptions
    if (perceivedValue >= 85) return "⚡ World Class / Exploding Pace";
    if (perceivedValue >= 70) return "🏃 Very Fast";
    if (perceivedValue >= 50) return "🚶 Average Speed";
    if (perceivedValue >= 30) return "🐢 Sluggish / Heavy Footed";
    return "🛑 Completely Immobile";
}
// Example Output for a new signing you only know 15%:
// True Pace is 92, but because knowledge is low, the report might say "Average Speed".
// As they play matches, knowledge climbs to 100, and the report locks onto "World Class".
```

- Because stats are hidden, the **Match Engine Commentaries** become the place where you actually learn who your players are. Your match log will feed your scouting knowledge:
- **Match 1 (0% Knowledge):** _"Your new midfielder Marcus tries to track back, but he is completely outpaced by the opponent's winger."_
    - 📈 _System Message: Your staff has updated Marcus's scouting report. Knowledge increased by 15%._
- **Match 5 (60% Knowledge):** You check his profile page, and his Pace bar has shrunk from "Average" down to "Sluggish", confirming what you've witnessed on the pitch.

- This creates an addictive loop: you have to actually watch your 6-a-side team play a few matches to uncover who the hidden gems are and who is just a lazy fraud.
