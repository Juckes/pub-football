/* ============================================================
   data.js — procedural content pools for Super 6s Football
   Loaded as a classic script BEFORE the engine. Globals here
   (const/function) are visible to later scripts on the page.
   ============================================================ */

/* ---------- squad shape ---------- */
const POSITIONS=["GK","DEF","MID","FWD"];
const SQUAD_SHAPE={GK:2,DEF:3,MID:3,FWD:2};   // a full 10-man squad: cover + rotation for every slot
const XI_SHAPE={GK:1,DEF:2,MID:2,FWD:1};      // the default starting six (1-2-2-1)
const SQUAD_SIZE=10, MIN_SQUAD=8;
const SAVE_VERSION=3;                          // bump when the save format changes; old saves start fresh
const COVER_MSG=`You need at least ${MIN_SQUAD} players, with cover for a starting side (${POSITIONS.map(p=>XI_SHAPE[p]+" "+p).join(", ")}).`;
/* can this player leave without breaking the minimum squad or leaving a position uncovered? */
function canSpare(squad,p){
  return squad.length>MIN_SQUAD && squad.filter(x=>x.position===p.position).length>XI_SHAPE[p.position];
}

const FIRST=["Marcus","Danny","Benny","Charlie","Reggie","Sammy","Dec","Kyle","Lenny","Tariq",
  "Ash","Jude","Rico","Franky","Ollie","Wes","Nico","Bazza","Goran","Pike","Marv","Jonno",
  "Elliot","Curtis","Femi","Deano","Scotty","Ravi","Theo","Gus"];

/* nicknames are now RARE — only the squad's one Star Player wears his */
const NICK=["The Flash","The Fuse","The Wall","Glitch","The Tank","Silky","Two-Pints","The Ox",
  "Lightning","The Rock","Nutmeg","The Postman","Sunday","Chaos","The Sniper","Zippy","Big Game",
  "The Fridge","Panic","Smooth","The Hammer","Jigsaw","Breeze","Cannon","Magic"];

const LAST=["Vance","Miller","Cross","Evans","Kray","Smooth","Hollis","Boateng","Rossi","Pryce",
  "Okafor","Nguyen","Delgado","Burns","Sealey","Marsh","Kowalski","Fielding","Obi","Dunne",
  "Abara","Whitlock","Forsyth","Haines","Capaldi","Mercer","Doyle","Patel","Reyes","Quinn"];

const PERSONA=[
  {t:"Hothead Egoist",temp:-18,note:"explosive but fragile"},
  {t:"Arrogant Maestro",skill:10,temp:-6,note:"loves the ball, hates tracking back"},
  {t:"Stoic Workhorse",temp:14,note:"never stops running"},
  {t:"Unpredictable Clown",note:"nobody knows what he'll do"},
  {t:"Loose Cannon",temp:-22,pace:6,note:"a yellow card waiting to happen"},
  {t:"Introverted Genius",skill:8,note:"quiet, deadly"},
  {t:"Journeyman Pro",temp:8,note:"seen it all before"},
  {t:"Raw Wonderkid",pace:8,temp:-4,note:"all potential, no polish"},
  {t:"Model Professional",skill:4,temp:6,note:"does everything right"},
  {t:"Cult Hero",temp:4,note:"the crowd adores him, god knows why"},
];

const TEAMNAMES=["FC Vibe","Real Mudut","Inter Pub","Athletic Alley","Park Rangers","Dynamo Drizzle",
  "Sporting Shanks","AFC Hangover","Borussia Backyard","Wanderers XI","The Nil-Nils","Puddle United"];

/* ---------- backroom staff ---------- */
const STAFF_FIRST=["Terry","Gaz","Sue","Big Dave","Mick","Yvonne","Rolo","Pam","Gaffer Joe","Linda",
  "Horst","Brenda","Smithy","Carl","Noor"];
const STAFF_LAST=["Braithwaite","Hodges","Tibbs","McGraw","Fletcher","Oduya","Pennington","Vass",
  "Crisp","Dangerfield","Mott","Sealey","Hargreaves"];

const STAFF_PERSONA=[
  {t:"By-the-book Pro",rel:1.0},
  {t:"Loves a Pint",rel:0.65,lazy:true},
  {t:"Tactical Nerd",rel:1.05},
  {t:"Old-School Hardman",rel:0.95},
  {t:"Eternal Optimist",rel:0.85},
  {t:"Clipboard Tyrant",rel:1.1},
  {t:"Can't Be Arsed",rel:0.5,lazy:true},
];

const STAFF_ROLES=[
  {key:"assistant",label:"Assistant Manager",icon:"📋"},
  {key:"fitness",  label:"Fitness Coach",    icon:"🏃"},
  {key:"scout",    label:"Chief Scout",      icon:"🔍"},
  {key:"physio",   label:"Physio",           icon:"🩹"},
];

/* ---------- profile flavour ---------- */
const JOBS=["delivery driver","plasterer","call-centre team leader","barista","PE teacher","bin-lorry loader",
  "estate agent","nightclub doorman","IT support","scaffolder","dental receptionist","taxi driver",
  "chip-shop manager","trainee accountant","postie","student (eternal)","personal trainer","sparky"];
const GROUNDS=["The Astroturf Arms","Dog & Duck Rec","Leisure Centre Pitch 3","Tesco Car Park (Upper)",
  "The Cage at Kenwood Road","St Barnabas Sports Hall","Behind The Co-op","Hangar 6 Soccerdome",
  "Cinder Lane","The Old Gasworks","Jubilee Park (Left Goal Slopes)","Brookside 3G"];
const MOTTOS=["Nil Satis Nisi Optimum (Mostly Nil)","Hope Is Not A Tactic","We Came For The Pint",
  "Run Hard, Moan Later","Boots On, Phones Off","Pain Is Temporary, Bragging Is Forever",
  "Win Or Blame The Ref","Together We Are Mildly Competent"];
const CLUB_COLOURS=["emerald & white","navy & gold","red & black","sky blue","orange & charcoal",
  "purple & lime","maroon & sky","yellow & green"];
const CLUB_LORE=["Formed in 2011 after a pub quiz argument got out of hand.",
  "Founded by two brothers who were banned from the 11-a-side league.",
  "Started as a work's team; the work has since closed, the team has not.",
  "Born from a WhatsApp group that refused to die.",
  "Won a fair-play award in 2016 and never let anyone forget it.",
  "Has never won a trophy but has an enormous trophy cabinet. Nobody will explain."];
const STAFF_STORIES=["Ran the line at a Sunday cup final in 2009 and still talks about it.",
  "Holds a coaching badge from a course nobody can quite name.",
  "Once got a trial at a League Two club. Will tell you about it unprompted.",
  "Turns up to every session with a flask and strong opinions.",
  "Claims to have taught a Premier League player how to trap a ball.",
  "Took the job because the previous coach 'moved to Spain' suddenly."];

function generateClub(){
  return {ground:RNG.pick(GROUNDS),founded:RNG.int(2004,2020),colours:RNG.pick(CLUB_COLOURS),
    motto:RNG.pick(MOTTOS),lore:RNG.pick(CLUB_LORE)};
}

function generateStaff(){
  const s={};
  STAFF_ROLES.forEach(r=>{
    const per=RNG.pick(STAFF_PERSONA);
    s[r.key]={
      role:r.key, label:r.label, icon:r.icon,
      name:RNG.pick(STAFF_FIRST)+" "+RNG.pick(STAFF_LAST),
      quality:clamp(Math.round(RNG.gauss(58,19))),
      personality:per.t, lazy:!!per.lazy, reliability:per.rel,
      age:RNG.int(31,64), story:RNG.pick(STAFF_STORIES)
    };
  });
  return s;
}
