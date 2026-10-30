/* ============================================================
   cards.js — the strategy deck for Super 6s Football
   Weekly card generation is driven by your BACKROOM STAFF:
     • a strong Fitness Coach → more / better fitness cards
     • a strong Chief Scout   → more / better scouting cards
     • a lazy, pint-loving Assistant → fewer cards overall
     • every draw has a 1–6% shot at a BRILLIANT card, whatever
       your staff are like (a masterstroke out of nowhere).
   Card effect functions (fx) run later and use engine globals
   (G, bump, dn, pn, makePlayer, recompute, RNG, clamp).
   ============================================================ */

const CARDS=[
  /* ---------- FITNESS (train) ---------- */
  {key:"bleep",category:"fitness",tier:"normal",title:"🏃 Bleep Test Hell",
    desc:"Brutal fitness session. +3 true Pace to your whole squad.",
    fx:g=>{g.squad.forEach(p=>train(p,'_pace',3));return "The squad is gasping, but quicker. Pace up across the board.";}},
  {key:"gym",category:"fitness",tier:"normal",title:"💪 Strength & Conditioning",
    desc:"Gym block. +3 true Pace and +2 Skill to your squad's fastest player.",
    fx:g=>{const p=g.squad.slice().sort((a,b)=>b._pace-a._pace)[0];train(p,'_pace',3);train(p,'_skill',2);
      return pn(p)+" has never looked so ripped. Sharper all round.";}},
  {key:"finish",category:"fitness",tier:"normal",title:"🎯 Finishing Drills",
    desc:"Shooting practice. +4 true Skill to your 3 lowest-skill outfielders.",
    fx:g=>{let o=g.squad.filter(p=>p.position!=='GK').sort((a,b)=>a._skill-b._skill).slice(0,3);
      o.forEach(p=>train(p,'_skill',4));return "Finishing work pays off for "+o.map(p=>dn(p)).join(", ")+".";}},

  /* ---------- SCOUT ---------- */
  {key:"leak",category:"scout",tier:"normal",title:"🤫 Scout Network Leak",
    desc:"An old contact spills intel. +40 Scouting on one random player.",
    fx:g=>{let p=RNG.pick(g.squad);bump(p,'knowledge',40);return "Intel drop on "+pn(p)+" — his report just sharpened dramatically.";}},
  {key:"video",category:"scout",tier:"normal",title:"📹 Video Analysis",
    desc:"Film study night. +15 Scouting to every player.",
    fx:g=>{g.squad.forEach(p=>bump(p,'knowledge',15));return "Hours of grainy phone footage later, you understand the squad a little better.";}},
  {key:"trial",category:"scout",tier:"normal",title:"🎪 Trial a Ringer",
    desc:"Sign a mystery player off the park. Could be a gem or a total fraud.",
    fx:g=>{if(g.squad.length>=SQUAD_SIZE)return "Squad's full — you slip the ringer a tenner and send him home.";
      let p=makePlayer(positionFor(g.squad));p.knowledge=4;g.squad.push(p);recompute(p);ensureBonds(g.squad);markStars(teamByName(g.myName));
      return "A stranger, "+p.first+" "+p.last+", laces up and joins in. Nobody knows a thing about him.";}},

  /* ---------- MIND (man-management) ---------- */
  {key:"hairdryer",category:"mind",tier:"normal",title:"📢 Hairdryer Treatment",
    desc:"Rollock your biggest ego. +30 Scouting on him, but morale takes a hit.",
    fx:g=>{let p=g.squad.slice().sort((a,b)=>a._temperament-b._temperament)[0];
      bump(p,'knowledge',30);p.morale=clamp(p.morale-20);
      adjustTrust(p,-15,`You gave him the hairdryer treatment.`,'scolded');
      return "You unloaded on "+pn(p)+". He's fuming — but you read him like a book now.";}},
  {key:"pub",category:"mind",tier:"normal",title:"🍻 Pub Sponsorship",
    desc:"Team night out. +12 morale to everyone, small drama risk.",
    fx:g=>{g.squad.forEach(p=>{p.morale=clamp(p.morale+12);adjustTrust(p,2);});
      return RNG.chance(.4)?"Great night — but someone's got a mysterious black eye in the morning."
        :"Spirits soar after a legendary night at The Dog & Duck.";}},
  {key:"armband",category:"mind",tier:"normal",title:"🎖️ Hand Out the Armband",
    desc:"Name a leader. +14 morale to your best-known player and he steadies the room.",
    fx:g=>{let p=g.squad.slice().sort((a,b)=>b.knowledge-a.knowledge)[0];
      p.morale=clamp(p.morale+14);train(p,'_temperament',4);
      adjustTrust(p,10,`You gave him the armband.`,'valued');
      return pn(p)+" takes the armband and grows into it. The dressing room feels calmer.";}},

  /* ---------- TACTIC (one match) ---------- */
  {key:"press",category:"tactic",tier:"normal",oneMatch:true,title:"⚡ High Press",
    desc:"This match: +18% attacking output, but tired legs after.",
    fx:g=>{g.matchMods.attack+=0.18;g.squad.forEach(p=>p._stamTax=(p._stamTax||0)+4);
      return "Instructions set: hunt them down high up the pitch.";}},
  {key:"bus",category:"tactic",tier:"normal",oneMatch:true,title:"🛡️ Park the Bus",
    desc:"This match: −15% goals conceded, −12% attack.",
    fx:g=>{g.matchMods.defense+=0.15;g.matchMods.attack-=0.12;return "Everyone behind the ball. It won't be pretty.";}},

  /* ---------- RISK ---------- */
  {key:"supps",category:"risk",tier:"normal",title:"💊 Dodgy Supplements",
    desc:"+9 Pace & Skill to one star... 35% chance of a 2-week injury.",
    fx:g=>{let p=g.squad.filter(p=>p.position!=='GK').sort((a,b)=>(b._pace+b._skill)-(a._pace+a._skill))[0];
      train(p,'_pace',9);train(p,'_skill',9);
      if(RNG.chance(.35)){p.injury=2;adjustTrust(p,-12,`You pushed him onto dodgy supplements and he got injured.`,'scolded');return "⚠️ "+pn(p)+" is flying... then pulls up clutching his hamstring. Out 2 weeks — and he blames the shake you gave him.";}
      return pn(p)+" looks superhuman this week. Don't ask what was in the shake.";}},
  {key:"gamble",category:"risk",tier:"normal",title:"🎰 All-or-Nothing Bonus",
    desc:"Promise a win bonus. 50/50: +15 morale squad-wide, or they bottle it (−10).",
    fx:g=>{if(RNG.chance(.5)){g.squad.forEach(p=>p.morale=clamp(p.morale+15));return "The lads are buzzing for the payday. Morale rockets.";}
      g.squad.forEach(p=>p.morale=clamp(p.morale-10));return "The pressure gets to them. Nervy week ahead.";}},

  /* ---------- BAD (curses — a lazy or useless backroom deals more of these) ---------- */
  {key:"feeshock",category:"bad",tier:"bad",title:"🧾 Pitch Fee Shock",
    desc:"The council hikes the pitch hire. Lose £20k from your budget.",
    fx:g=>{const lost=Math.min(g.budget,20);g.budget-=lost;
      return `The council wants paying. £${lost}k vanishes from the kitty.`;}},
  {key:"boozylunch",category:"bad",tier:"bad",oneMatch:true,title:"🍺 Boozy Team Lunch",
    desc:"The coaches 'review tactics' at the pub. This match: −10% attack, but morale +6 all round.",
    fx:g=>{g.matchMods.attack-=0.10;g.squad.forEach(p=>p.morale=clamp(p.morale+6));
      return "The tactics board is covered in beer rings, but the mood is lovely.";}},
  {key:"scandal",category:"bad",tier:"bad",title:"📰 Tabloid Scandal",
    desc:"The local paper digs up dirt on a random player. −12 morale and −10 trust for him.",
    fx:g=>{const p=RNG.pick(g.squad);p.morale=clamp(p.morale-12);
      adjustTrust(p,-10,"A scandal broke and he felt you didn't back him.",'scolded');
      return "The Gazette runs a front page on "+pn(p)+". He's mortified, and wonders where you were.";}},
  {key:"sorelegs",category:"bad",tier:"bad",title:"🩹 Sore Legs Epidemic",
    desc:"Dodgy warm-ups all round. A random outfielder is out for a week.",
    fx:g=>{const p=RNG.pick(g.squad.filter(x=>x.position!=='GK'));p.injury=Math.max(p.injury,1);
      return pn(p)+" pulls up in the warm-up. Out for a week.";}},
  {key:"doublebooked",category:"bad",tier:"bad",oneMatch:true,title:"📅 Double-Booked Pitch",
    desc:"The squad turns up late and rattled. This match: −8% attack and −8% defence.",
    fx:g=>{g.matchMods.attack-=0.08;g.matchMods.defense-=0.08;
      return "Someone else's kids' party is on your pitch. You warm up in the car park.";}},

  /* ---------- BRILLIANT (rare wildcards, any staff can roll one) ---------- */
  {key:"masterclass",category:"brilliant",tier:"brilliant",oneMatch:true,title:"🧠 Tactical Masterclass",
    desc:"A stroke of genius. This match: +15% attack AND −15% conceded.",
    fx:g=>{g.matchMods.attack+=0.15;g.matchMods.defense+=0.15;
      return "The whiteboard is a work of art. The lads actually understand it, too.";}},
  {key:"breakthrough",category:"brilliant",tier:"brilliant",title:"🌟 Breakthrough Session",
    desc:"Everything clicks. +7 true Skill AND +20 Scouting to the whole squad.",
    fx:g=>{g.squad.forEach(p=>{train(p,'_skill',7);bump(p,'knowledge',20);});
      return "One of those sessions where it all just works. The whole squad levels up.";}},
  {key:"legend",category:"brilliant",tier:"brilliant",title:"👑 Cult Legend Returns",
    desc:"A local legend joins for the season. A genuinely good, fully-scouted player.",
    fx:g=>{if(g.squad.length>=SQUAD_SIZE)return "The legend takes one look at your full squad and heads back to the bar.";
      let p=makePlayer(positionFor(g.squad));train(p,'_skill',16);train(p,'_pace',10);train(p,'_temperament',10);
      p.knowledge=92;recompute(p);g.squad.push(p);ensureBonds(g.squad);markStars(teamByName(g.myName));
      return p.first+" "+p.last+", a Sunday League icon, signs on. Everyone knows exactly how good he is.";}},
];

const CARD_BY_KEY={};
CARDS.forEach(c=>CARD_BY_KEY[c.key]=c);

/* pick a category for one draw, weighted by the quality of the relevant staff */
function pickCategory(staff){
  const w={
    fitness: 1 + staff.fitness.quality/45,
    scout:   1 + staff.scout.quality/45,
    mind:    1.1,
    tactic:  1 + staff.assistant.quality/70,
    risk:    0.8,
  };
  const total=Object.values(w).reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(const k in w){ if((r-=w[k])<=0) return k; }
  return "mind";
}

/* roll this week's hand: up to CARDS_PER_WEEK new cards, shaped by the backroom staff.
   A good assistant fills more slots and deals fewer curses; a lazy one slacks off
   (empty slots) and deals more. The first slot is always produced. */
const CARDS_PER_WEEK=3;
const MUST_PLAY_CARD=true;   // true: you have to pick one card each week before kick-off (the card may be a curse)
function rollWeeklyCards(staff){
  const a=staff.assistant;
  const produce=clamp(0.55+a.quality/250-(a.lazy?0.15:0),0.3,0.95);
  const badChance=clamp(0.30-a.quality/450+(a.lazy?0.12:0),0.08,0.5);
  const brilliantChance=0.01+a.quality/1800;                     // ~1%–6.5%
  const out=[], used=new Set();
  for(let i=0;i<CARDS_PER_WEEK;i++){
    if(i>0&&!RNG.chance(produce)) continue;
    let tpl,tries=0;
    do{
      let pool;
      if(RNG.chance(brilliantChance)) pool=CARDS.filter(c=>c.tier==='brilliant');
      else if(RNG.chance(badChance)) pool=CARDS.filter(c=>c.category==='bad');
      else{const cat=pickCategory(staff);pool=CARDS.filter(c=>c.category===cat);}
      tpl=RNG.pick(pool);
    }while(used.has(tpl.key)&&++tries<6);
    used.add(tpl.key);
    out.push(instantiateCard(tpl));
  }
  return out;
}
function instantiateCard(tpl){
  return {...tpl,uid:Math.random().toString(36).slice(2,8),spent:false,locked:false};
}
