/* ============================================================
   bonds.js — relationships that REMEMBER.
   • trust   : how much a player trusts YOU (-100..100). Moved by your
               story choices and cards, decays slowly between seasons.
   • bonds   : player<->player feeling (-100..100). Feuds poison team
               chemistry on the pitch; close mates help it a little.
   • memories: short notes of what you did to him, shown on his profile
               and used to trigger callback stories later.
   Only YOUR squad's relationships are simulated.
   Uses engine globals (G, RNG, clamp, dn, pn, bump, train, teamByName,
   markStars, ratingsFor, priceOf, autoBenchUnavailable).
   ============================================================ */

const TRUST_TIERS=[
  {min:60,  label:"🤝 Devoted"},
  {min:25,  label:"🙂 Trusting"},
  {min:-24, label:"😐 Neutral"},
  {min:-59, label:"😒 Resentful"},
  {min:-101,label:"😡 Hostile"},
];
function trustTier(t){return TRUST_TIERS.findIndex(x=>t>=x.min);}
function trustLabel(t){return TRUST_TIERS[trustTier(t)].label;}

function ensureRel(p){
  if(p.trust===undefined) p.trust=0;
  if(!p.bonds) p.bonds={};
  if(!p.memories) p.memories=[];
  if(p._tier===undefined) p._tier=trustTier(p.trust);
}
function remember(p,text,tag){
  ensureRel(p);
  p.memories.unshift({s:G.season,w:G.week+1,text,tag:tag||''});
  if(p.memories.length>8) p.memories.length=8;
}
function adjustTrust(p,amt,memo,tag){
  ensureRel(p);
  p.trust=clamp(Math.round(p.trust+amt),-100,100);
  if(memo) remember(p,memo,tag);
}
function hasMemory(p,tag){return (p.memories||[]).some(m=>m.tag===tag);}

function bondOf(a,b){return (a.bonds&&a.bonds[b.id])||0;}
function setBond(a,b,v){
  ensureRel(a);ensureRel(b);
  v=clamp(Math.round(v),-100,100);
  a.bonds[b.id]=v;b.bonds[a.id]=v;
}
function adjustBond(a,b,d){setBond(a,b,bondOf(a,b)+d);}
function bondLabel(v){
  return v>=40?'close mates':v>=20?'friendly':v<=-40?'feuding':v<=-20?'frosty':'neutral';
}

/* ---------- seeding: personalities decide who gets on ---------- */
const CLASHY=["hothead","loose cannon","arrogant","egoist"];
const CALM=["workhorse","professional","journeyman"];
function seedBond(a,b){
  let v=RNG.int(-8,22);
  const pa=a.persona.toLowerCase(), pb=b.persona.toLowerCase();
  const ca=CLASHY.some(k=>pa.includes(k)), cb=CLASHY.some(k=>pb.includes(k));
  if(ca&&cb) v-=28;
  else if(CALM.some(k=>pa.includes(k))||CALM.some(k=>pb.includes(k))) v+=6;
  return v;
}
/* idempotent: fills missing bonds, drops bonds to players who've left */
function ensureBonds(squad){
  const ids=new Set(squad.map(p=>p.id));
  squad.forEach(p=>{
    ensureRel(p);
    Object.keys(p.bonds).forEach(id=>{if(!ids.has(id)) delete p.bonds[id];});
  });
  for(let i=0;i<squad.length;i++)for(let j=i+1;j<squad.length;j++){
    const a=squad[i],b=squad[j];
    if(a.bonds[b.id]===undefined) setBond(a,b,seedBond(a,b));
  }
}

/* ---------- on-pitch effect ---------- */
function chemistry(xi){
  let f=0; const feuds=[];
  for(let i=0;i<xi.length;i++)for(let j=i+1;j<xi.length;j++){
    const b=bondOf(xi[i],xi[j]);
    if(b<=-40){f-=0.03;feuds.push([xi[i],xi[j]]);}
    else if(b>=40) f+=0.015;
  }
  return {factor:clamp(f,-0.09,0.06),feuds};
}
/* winning together builds bonds */
function winTogether(xi){
  for(let i=0;i<xi.length;i++)for(let j=i+1;j<xi.length;j++) adjustBond(xi[i],xi[j],2);
}

/* ---------- weekly upkeep; returns feed messages ---------- */
function weeklyRelationships(g){
  const msgs=[], sq=g.squad;
  if(g.relCooldown>0) g.relCooldown--;
  ensureBonds(sq);
  for(let i=0;i<sq.length;i++)for(let j=i+1;j<sq.length;j++){
    const v=bondOf(sq[i],sq[j]);
    if(v<0) setBond(sq[i],sq[j],Math.min(0,v+2));      // grudges fade slowly
  }
  sq.forEach(p=>{
    if(p.trust>=50) p.morale=clamp(p.morale+2);
    else if(p.trust<=-40) p.morale=clamp(p.morale-3);
    const t=trustTier(p.trust);
    if(t!==p._tier){
      msgs.push(t>p._tier
        ? `📉 ${dn(p)}'s faith in you has slipped — he's now ${trustLabel(p.trust).replace(/^\S+ /,'').toLowerCase()}.`
        : `📈 ${dn(p)} is warming to you — he's now ${trustLabel(p.trust).replace(/^\S+ /,'').toLowerCase()}.`);
      p._tier=t;
    }
  });
  return msgs;
}

/* ---------- moving a player to a rival club ---------- */
function transferAway(g,p){
  const dest=RNG.pick(g.teams.filter(t=>!t.isMe));
  /* swap like-for-like so neither squad loses its positional balance */
  const out=dest.squad.filter(x=>x.position===p.position)
    .sort((a,b)=>(a._skill+a._pace)-(b._skill+b._pace))[0];
  dest.squad[dest.squad.indexOf(out)]=p;
  g.squad.splice(g.squad.indexOf(p),1);
  p.starting=false; out.starting=false; out.quirk=null; out.form=0;
  out.price=priceOf(out); recompute(out);
  g.market.push(out);
  const me=teamByName(g.myName);
  [dest,me].forEach(t=>{markStars(t);ratingsFor(t);});
  ensureBonds(g.squad);
  autoBenchUnavailable();
  return dest;
}

/* ============================================================
   CALLBACK STORIES — only appear when the history is there.
   Each is g=>story|null and must be free of side effects until a
   choice is made.
   ============================================================ */
const REL_STORIES=[

  /* a feud that never really went away */
  g=>{
    const sq=g.squad; let worst=null;
    for(let i=0;i<sq.length;i++)for(let j=i+1;j<sq.length;j++){
      const b=bondOf(sq[i],sq[j]);
      if(b<=-40&&(!worst||b<worst.b)) worst={a:sq[i],c:sq[j],b};
    }
    if(!worst) return null;
    const {a,c}=worst;
    return {
      text:`⚔️ <b>Simmering Feud.</b> ${pn(a)} and ${pn(c)} still aren't speaking. Training just turned into a shoving match, and the rest of the squad is picking sides.`,
      choices:[
        {label:"Bang their heads together",fx:()=>{
          adjustBond(a,c,35);
          adjustTrust(a,-4,`You forced a handshake with ${dn(c)} in front of everyone.`,'forced');
          adjustTrust(c,-4,`You forced a handshake with ${dn(a)} in front of everyone.`,'forced');
          return `${dn(a)} and ${dn(c)} shake hands through gritted teeth. The air clears, though neither enjoyed the audience.`;}},
        {label:"Pick a side",fx:()=>{
          const [fav,oth]=(a._skill+a._pace>=c._skill+c._pace)?[a,c]:[c,a];
          adjustTrust(fav,15,`You publicly backed him in the row with ${dn(oth)}.`,'backed');
          adjustTrust(oth,-15,`You sided with ${dn(fav)} over him.`,'humiliated');
          adjustBond(a,c,-15);
          return `You back ${dn(fav)}. He's delighted. ${dn(oth)} will remember it — and the feud just got personal.`;}},
        {label:"Let them sort it out",fx:()=>{
          if(RNG.chance(.5)){adjustBond(a,c,12);return `Left alone, ${dn(a)} and ${dn(c)} clear the air over a pint. Risky, but it worked.`;}
          const v=RNG.chance(.5)?a:c;v.suspended=1;adjustBond(a,c,-10);
          return `It kicks off. ${dn(v)} gets a one-match ban from the league for the fracas. The feud deepens.`;}}
      ]};
  },

  /* a player who's lost faith in you wants out */
  g=>{
    const cands=g.squad.filter(p=>p.trust<=-40&&p.demandSeason!==g.season);
    if(!cands.length) return null;
    const p=RNG.pick(cands);
    const canGo=canSpare(g.squad,p);
    const why=(p.memories.find(m=>m.tag==='humiliated'||m.tag==='scolded')||{}).text;
    const choices=[
      {label:"Talk him round",fx:()=>{
        p.demandSeason=g.season;
        if(RNG.chance(0.35+(p.morale>=50?0.15:0))){
          adjustTrust(p,30,`You talked him out of leaving.`,'talked-round');p.morale=clamp(p.morale+10);
          return `${dn(p)} sits through a long, awkward chat and withdraws the request. A fragile truce.`;}
        adjustTrust(p,-10,`You couldn't persuade him to stay.`,'ignored');p.morale=clamp(p.morale-10);
        return `${dn(p)} isn't listening. The request stays on the table and the mood sours.`;}}
    ];
    if(canGo) choices.push({label:"Let him go",fx:()=>{
      p.demandSeason=g.season;
      const nm=pn(p), dest=transferAway(g,p);
      g.squad.forEach(x=>{if(bondOf(p,x)>=20)adjustTrust(x,-6,`You let ${dn(p)} walk out.`,'let-go');});
      return `${nm} joins ${dest.name}. A little hole opens in the dressing room.`;}});
    return {
      text:`📄 <b>Transfer Request.</b> ${pn(p)} has handed in a written request to leave${why?` — "${why}"`:''}. He says he's lost faith in the way you run things.`,
      choices};
  },

  /* a player you backed repays the faith */
  g=>{
    const cands=g.squad.filter(p=>p.trust>=45&&p.faithSeason!==g.season);
    if(!cands.length) return null;
    const p=RNG.pick(cands);
    return {
      text:`🙌 <b>Repaying the Faith.</b> ${pn(p)} says you're the only manager who ever really believed in him, and asks for extra sessions to give something back.`,
      choices:[
        {label:"Give him extra coaching",fx:()=>{
          p.faithSeason=g.season;train(p,'_skill',4);adjustTrust(p,5,`You invested extra time in him.`,'invested');
          return `${dn(p)} hammers away at the cones all week. +Skill, and he's more devoted than ever.`;}},
        {label:"Tell him to rest",fx:()=>{
          p.faithSeason=g.season;p.morale=clamp(p.morale+8);
          return `${dn(p)} appreciates the care. Morale up, and he'll run through walls for you.`;}}
      ]};
  },

  /* a resentful player poisons a mate against you */
  g=>{
    const sq=g.squad; let pick=null;
    for(const p of sq){
      if(p.trust>-20||p.morale>55||p.poisonSeason===g.season) continue;
      const friend=sq.filter(x=>x.id!==p.id&&bondOf(p,x)>=25).sort((a,b)=>bondOf(p,b)-bondOf(p,a))[0];
      if(friend){pick={p,friend};break;}
    }
    if(!pick) return null;
    const {p,friend}=pick;
    return {
      text:`🗣️ <b>Poison in the Dressing Room.</b> ${pn(p)} has been telling ${pn(friend)} that you can't be trusted. ${dn(friend)} has started giving you funny looks.`,
      choices:[
        {label:"Confront him publicly",fx:()=>{
          p.poisonSeason=g.season;p.morale=clamp(p.morale-8);
          adjustTrust(p,-8,`You called him out in front of the squad.`,'scolded');
          return `You tear into ${dn(p)} in front of everyone. ${dn(friend)} backs off — but ${dn(p)} won't forget it.`;}},
        {label:"Win the friend over",fx:()=>{
          p.poisonSeason=g.season;
          adjustTrust(friend,8,`You took the time to hear his side.`,'listened');
          adjustBond(p,friend,-8);
          return `You take ${dn(friend)} aside and hear him out. He's reassured, and cooler towards ${dn(p)} now.`;}}
      ]};
  },
];

/* try a callback story first; returns a story or null */
function pickRelationshipStory(g){
  if(g.relCooldown>0) return null;
  const open=REL_STORIES.map(f=>f(g)).filter(Boolean);
  if(!open.length) return null;
  g.relCooldown=4;
  return RNG.pick(open);
}

/* season rollover: grudges linger, loyalty is rewarded */
function seasonRelationships(g){
  const msgs=[];
  g.squad.forEach(p=>{
    ensureRel(p);
    if(p.trust>=50){
      const rival=RNG.pick(g.teams.filter(t=>!t.isMe));
      msgs.push(`🤝 ${pn(p)} turned down a move to ${rival.name} — "I'd never leave this gaffer."`);
      p.morale=clamp(p.morale+8);
    }
    p.trust=Math.round(p.trust*0.85);
    p._tier=trustTier(p.trust);
    p.demandSeason=null;p.faithSeason=null;p.poisonSeason=null;
  });
  return msgs;
}

/* UI helper: html block for the player profile */
function relationshipHtml(p,squad){
  ensureRel(p);
  const others=squad.filter(x=>x.id!==p.id)
    .map(x=>({x,b:bondOf(p,x)})).filter(o=>Math.abs(o.b)>=20).sort((a,b)=>b.b-a.b);
  const bonds=others.length
    ? others.map(o=>`<div class="staff-row"><span>${o.b>0?'🤝':'⚔️'} <span class="link" onclick="openPlayer('${o.x.id}')">${o.x.first} ${o.x.last}</span></span><span class="tiny muted">${bondLabel(o.b)}</span></div>`).join('')
    : '<div class="tiny muted">No strong feelings either way yet.</div>';
  const mem=p.memories.length
    ? p.memories.map(m=>`<div class="kv" style="margin:3px 0">S${m.s} W${m.w} <b>${m.text}</b></div>`).join('')
    : '<div class="tiny muted">Nothing memorable between you yet.</div>';
  return `<h4>Relationships</h4>
    <div class="kv" style="margin-bottom:6px">Trust in you <b>${trustLabel(p.trust)}</b></div>
    ${bonds}
    <h4>He remembers</h4>${mem}`;
}
