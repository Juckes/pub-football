/* ============================================================
   quirks.js — personality-driven mini-events for Super 6s.
   A quirk latches onto a player for a few weeks, nudges his
   FORM (a hidden match modifier) and morale, and spits out
   comedy into the dressing-room feed. Onset odds are weighted
   by the player's persona — a Clown is prone to conspiracies,
   a Loose Cannon to feuds, and so on.
   Runs via tickQuirks(G) once per week. Uses engine globals
   (RNG, clamp, dn, G).
   ============================================================ */

const QUIRKS=[
  {key:"conspiracy",icon:"🛸",short:"Down the Rabbit Hole",duration:3,baseChance:0.045,
   likes:["clown","cult","wonderkid","genius"],
   onApply:(p,g)=>{p.form=clamp((p.form||0)-8,-15,15);p.morale=clamp(p.morale+4);
     const t=RNG.pick(["the match balls are full of government microchips","the referees are lizard people",
       "the offside rule was invented to suppress the working man","the pitch is slightly curved to favour the home side"]);
     return `🛸 ${dn(p)} has gone down a rabbit hole — now convinced ${t}. Distracted in training, but weirdly happy.`;},
   weekly:(p,g)=>{if(RNG.chance(0.3)){const m=RNG.pick(g.squad.filter(x=>x.id!==p.id&&!x.quirk));
     if(m){m.quirk={key:"conspiracy",weeks:2};m.form=clamp((m.form||0)-6,-15,15);
       return `📣 ${dn(p)} has converted ${dn(m)} to the cause. The group chat is chaos.`;}}return null;},
   onExpire:(p,g)=>{p.form=0;return `🧠 ${dn(p)} has quietly deleted the podcast app and returned to football.`;}},

  {key:"feud",icon:"😡",short:"Dressing-Room Feud",duration:3,baseChance:0.04,
   likes:["hothead","loose cannon","arrogant","egoist"],
   onApply:(p,g)=>{const r=RNG.pick(g.squad.filter(x=>x.id!==p.id&&!x.quirk));if(!r)return null;
     p.quirk.data={rival:r.id};p.form=clamp((p.form||0)-5,-15,15);
     p.morale=clamp(p.morale-8);r.morale=clamp(r.morale-8);
     setBond(p,r,-60);
     const o=RNG.pick(["whose turn it is to wash the bibs","a disputed nutmeg in training",
       "a parking space","who's really the penalty taker"]);
     remember(p,`Fell out with ${dn(r)} over ${o}.`,'feud');
     remember(r,`Fell out with ${dn(p)} over ${o}.`,'feud');
     return `😡 ${dn(p)} and ${dn(r)} had a full-blown row over ${o}. Frosty.`;},
   onExpire:(p,g)=>{p.form=0;const r=p.quirk&&p.quirk.data&&g.squad.find(x=>x.id===p.quirk.data.rival);
     if(r){setBond(p,r,Math.max(bondOf(p,r),-35));r.morale=clamp(r.morale+3);}p.morale=clamp(p.morale+3);
     return `🤝 ${dn(p)}${r?` and ${dn(r)}`:''} have reached an uneasy truce — but nobody's forgotten.`;}},

  {key:"romance",icon:"💘",short:"Loved-up",duration:2,baseChance:0.035,
   likes:[],
   onApply:(p,g)=>{p.form=clamp((p.form||0)-6,-15,15);
     return `💘 ${dn(p)} is loved-up and keeps checking his phone at corners. Head's in the clouds.`;},
   weekly:(p,g)=>{if(p.quirk.weeks===1){p.form=clamp((p.form||0)+10,-15,15);p.morale=clamp(p.morale+8);
     return `😍 ${dn(p)} is officially glowing. Playing with a spring in his step now.`;}return null;},
   onExpire:(p,g)=>{p.form=0;return null;}},

  {key:"gymrat",icon:"🏋️",short:"Gym Obsession",duration:3,baseChance:0.04,
   likes:["workhorse","wonderkid","model"],
   onApply:(p,g)=>{p.form=clamp((p.form||0)+6,-15,15);bump(p,'_stamina',3);
     return `🏋️ ${dn(p)} has discovered the gym and won't shut up about his macros. Flying, for now.`;},
   weekly:(p,g)=>{if(RNG.chance(0.2)){p.injury=1;p.form=0;
     return `⚠️ ${dn(p)} tweaked something going for a new deadlift PB. Out a week. Worth it, he insists.`;}
     bump(p,'_pace',1);return null;},
   onExpire:(p,g)=>{p.form=0;bump(p,'_pace',2);return `💪 ${dn(p)}'s gym phase pays off — noticeably sharper. Gains locked in.`;}},

  {key:"viral",icon:"📱",short:"Gone Viral",duration:2,baseChance:0.03,
   likes:["arrogant","egoist","cult","clown"],
   onApply:(p,g)=>{p.morale=clamp(p.morale+12);p.form=clamp((p.form||0)-5,-15,15);
     return `📱 A clip of ${dn(p)} doing keepy-uppies hit 40k views. Ego inflated, end product suffering.`;},
   onExpire:(p,g)=>{p.form=0;return `🫠 ${dn(p)}'s fifteen minutes are up. Back to earth.`;}},

  {key:"redemption",icon:"🔥",short:"Redemption Arc",duration:3,baseChance:0.5,
   likes:[], onlyLowMorale:true,
   onApply:(p,g)=>{p.form=clamp((p.form||0)+9,-15,15);p.morale=clamp(p.morale+10);
     return `🔥 Sick of being written off, ${dn(p)} turns up to training first and leaves last. A man on a mission.`;},
   weekly:(p,g)=>{bump(p,'_skill',1);return null;},
   onExpire:(p,g)=>{p.form=0;return `🫡 ${dn(p)}'s redemption run settles — but he's left a better player for it.`;}},

  {key:"midlife",icon:"🏍️",short:"Mid-life Crisis",duration:2,baseChance:0.03,
   likes:["journeyman"],
   onApply:(p,g)=>{p.form=clamp((p.form||0)-4,-15,15);
     return `🏍️ ${dn(p)} has bought a wildly impractical motorbike and some frosted tips. The lads are merciless.`;},
   onExpire:(p,g)=>{p.form=0;return `🧢 ${dn(p)} sold the bike at a loss and made peace with being 34.`;}},
];

const QUIRK_BY_KEY={};
QUIRKS.forEach(q=>QUIRK_BY_KEY[q.key]=q);

function quirkAffinity(p,q){
  if(q.onlyLowMorale) return p.morale<=42?1:0;
  let a=1;
  if(q.likes.length && q.likes.some(k=>p.persona.toLowerCase().includes(k))) a*=3.2;
  else if(q.likes.length) a*=0.6;      // out-of-character quirks are rarer
  return a;
}

/* advance all quirks one week; returns narrative messages (most interesting first) */
function tickQuirks(G){
  const msgs=[];
  // tick & expire existing
  G.squad.forEach(p=>{
    if(!p.quirk) return;
    const q=QUIRK_BY_KEY[p.quirk.key];
    p.quirk.weeks--;
    if(q.weekly){const m=q.weekly(p,G);if(m)msgs.push(m);}
    if(p.quirk.weeks<=0){
      const m=q.onExpire?q.onExpire(p,G):null;
      p.quirk=null; p.form=0;
      if(m)msgs.push(m);
    }
  });
  // fresh onset — at most 2 new quirks a week to avoid a circus
  let newThisWeek=0;
  for(const p of shuffle(G.squad.filter(x=>!x.quirk))){
    if(newThisWeek>=2) break;
    for(const q of QUIRKS){
      const aff=quirkAffinity(p,q);
      if(aff>0 && RNG.chance(q.baseChance*aff)){
        p.quirk={key:q.key,weeks:q.duration,data:{}};
        const m=q.onApply?q.onApply(p,G):null;
        if(m){msgs.unshift(m);newThisWeek++;}
        break;
      }
    }
  }
  return msgs;
}

/* label for the squad table, e.g. "🛸 Down the Rabbit Hole (2w)" */
function quirkLabel(p){
  if(!p.quirk) return '';
  const q=QUIRK_BY_KEY[p.quirk.key];
  return `${q.icon} ${q.short} (${p.quirk.weeks}w)`;
}
