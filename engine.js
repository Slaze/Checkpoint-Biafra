// ═══════════════════════════════════════════════════════════════
// CHECKPOINT BIAFRA — GAME ENGINE v1.1
// iOS PWA bug-fixed edition
// ═══════════════════════════════════════════════════════════════
(function() {
'use strict';

// ── GAME STATE ──
var state = {};

function freshState() {
  return {
    day: 1,
    traveller: 0,
    totalTravellers: 8,
    dayApproved: 0,
    dayDenied: 0,
    dayDetained: 0,
    totalPay: 3400,
    axes: { loyalty:0, compassion:0, rebellion:0, survival:0, witness:0, corruption:0 },
    player: { name:'', firstname:'', gender:'', state:'', background:'', family:'' },
    family: [],
    exchangeRate: 1.0,
    dayResults: [],
    endingsUnlocked: [],
    flags: {},
    dayTravellers: [],    // ← FIX: store the day's traveller list
    moralFiredDays: [],   // ← FIX: track which days have fired moral events
    // Wartime household ledger (single source of truth — patch must not double-charge)
    __billsEngineV15: true,
    missedBillsStreak: 0,
    billsMissedTotal: 0,
    billsPaidTotal: 0,
    wagePenaltyNextDay: 0,
    infiltrationCount: 0,
    suspicion: 0,
    familyPressure: 0,
    lastBillReport: null,
    totalErrors: 0,
    careerApproved: 0,
    careerDenied: 0,
    careerDetained: 0,
    memoryBeats: [],
  };
}

// ── CC SELECTIONS ──
var ccSel = { gender:'', state:'', background:'', family:'' };

// ── SCREEN MANAGEMENT ──
var SCREENS = ['splash','char-create','intro','bulletin-screen','game','moral-event','eod-report','ending'];

function showScreen(id) {
  SCREENS.forEach(function(s) {
    var el = document.getElementById(s);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('active');
    }
  });
  var target = document.getElementById(id);
  if (target) {
    target.style.display = 'flex';
    target.classList.add('active');
    // Scroll to top on iOS
    target.scrollTop = 0;
  }
}

// Override: use display flex via inline style (avoids CSS class race on iOS)
// We'll init all screens hidden first:
function initScreens() {
  SCREENS.forEach(function(s) {
    var el = document.getElementById(s);
    if (el) el.style.display = 'none';
  });
}

// ── DATA: BACKGROUNDS ──
var BACKGROUNDS = [
  { id:'civil',    label:'FEDERAL CLERK', desc:'You know forms. You know what silence buys.', bias:{} },
  { id:'soldier',  label:'FORMER ARMY',         desc:'Spot military ID fakes. Colleagues distrust you.', bias:{loyalty:2} },
  { id:'teacher',  label:'SCHOOLTEACHER',        desc:'Detect writing forgeries. Lower pay.', bias:{compassion:2} },
  { id:'nysc',     label:'NYSC CORP MEMBER',     desc:'Corps networks. Can be terminated in 48hrs.', bias:{witness:2} },
  { id:'tech',     label:'RADIO / TELEGRAPH CLERK', desc:'You hear what Lagos and Enugu will not say on the same day.', bias:{witness:1,survival:1} },
  { id:'ngo',      label:'MISSION / RELIEF WORKER', desc:'Church and Red Cross contacts. Soldiers distrust soft hands.', bias:{compassion:1,witness:1} },
  { id:'clergy',   label:'CATHOLIC CLERGY',      desc:'Church networks. Complex loyalties.', bias:{compassion:2,rebellion:1} },
  { id:'trader',   label:'MARKET TRADER',         desc:'Reads people well. Flagged as corruption risk.', bias:{survival:2} },
  { id:'journalist','label':'JOURNALIST',          desc:'Build case files. Sources approach you.', bias:{witness:3} },
  { id:'pastor',   label:'PASTOR/MINISTER',       desc:'Community brings information.', bias:{compassion:2,loyalty:1} },
  { id:'palmoil',   label:'PALM OIL TRADER',     desc:'You know every backroad market.',                     bias:{survival:1,corruption:1} },
  { id:'redcross',  label:'RED CROSS NURSE',     desc:'You have triaged the wounded from both sides.',       bias:{compassion:3} },
  { id:'bbc',       label:'BBC CORRESPONDENT',   desc:'You filed dispatches from Umuahia until they expelled you.', bias:{witness:3} },
  { id:'lecturer',  label:'NSUKKA LECTURER',     desc:'Your faculty was shelled in 1967.',                   bias:{witness:1,rebellion:2} },
  { id:'railway',   label:'RAILWAY WORKER',      desc:'You know every kilometre of the Eastern Line.',       bias:{loyalty:1,survival:1} },
  { id:'bicycle',   label:'BICYCLE MECHANIC',    desc:'In a country without petrol, your trade is politics.',bias:{survival:2,compassion:1} },
  { id:'radio',     label:'RADIO OPERATOR',      desc:'You relayed broadcasts out of Aba.',                  bias:{witness:2,rebellion:1} },
  { id:'dibia',     label:'HERBALIST (DIBIA)',   desc:'Villagers come to you before any hospital.',          bias:{compassion:2,loyalty:1} },
  { id:'marketwm',  label:'MARKET WOMAN',        desc:'You ran an ofe stall through three offensives.',      bias:{survival:2,witness:1} },
  { id:'police',    label:'POLICE SERGEANT',     desc:'You served federal command before the emergency.',    bias:{loyalty:2,corruption:1} },
  { id:'cargo',     label:'CARGO DRIVER',        desc:'You hauled relief, ammunition, and refugees in a week.',bias:{witness:1,survival:2} },
  { id:'artist',    label:'ARTIST / CREATIVE',     desc:'Painter, musician, performer. Patrons distrust the regime.', bias:{witness:2,compassion:1} },
  { id:'doctor',    label:'DOCTOR / NURSE',         desc:'Hospitals are your refuge. Bribes are mostly food.',         bias:{compassion:2,survival:1} },
  { id:'journalist',label:'JOURNALIST',             desc:'You see what others edit out. Watched by FIBA.',             bias:{witness:2,rebellion:1} },
  { id:'farmer',    label:'FARMER / TRADER',        desc:'Land claims, ration tickets, ferry passes — you know each.', bias:{survival:2} },
  { id:'other',     label:'OTHER — SPECIFY ON FILE', desc:'A general field. FIBA notes your background as unrecorded.', bias:{} },
];

// ── DATA: STATES ──
var STATES = [
  { val:'Enugu',      label:'ENUGU',       desc:'Core Biafra. High loyalty pressure.' },
  { val:'Anambra',    label:'ANAMBRA',     desc:'Commercial hub. Survival bias.' },
  { val:'Imo',        label:'IMO',         desc:'Strong Catholic presence.' },
  { val:'Abia',       label:'ABIA',        desc:'MASSOB origins. Rebellion bias.' },
  { val:'Ebonyi',     label:'EBONYI',      desc:'Highest survival pressure.' },
  { val:'Rivers',     label:'RIVERS',      desc:'Contested. Oil. Politically loaded.' },
  { val:'Cross River',label:'CROSS RIVER', desc:'Your posting. Home ground exposure.' },
  { val:'Delta',      label:'DELTA',       desc:'Not unanimously Biafran.' },
];

// ── DATA: FAMILY ──
var FAMILY_MALE = [
  { id:'single',       label:'SINGLE',               desc:'No dependants. Full risk tolerance.', pressure:0 },
  { id:'partner',      label:'PARTNER',              desc:'Limited financial obligation.', pressure:1 },
  { id:'wife',         label:'WIFE, NO CHILDREN',    desc:'Emotional weight.', pressure:2 },
  { id:'wife_child',   label:'WIFE + 1 CHILD',       desc:'School fees activate.', pressure:3 },
  { id:'wife_children',label:'WIFE + 3 CHILDREN',    desc:'Daily expense pressure.', pressure:4 },
  { id:'wife_extended',label:'WIFE + CHILDREN + PARENT', desc:'Medical costs mid-game.', pressure:5 },
  { id:'divorced',     label:'DIVORCED',             desc:'Paying child support remotely.', pressure:2 },
  { id:'widower',      label:'WIDOWER',              desc:'Sole guardian.', pressure:4 },
];
var FAMILY_FEMALE = [
  { id:'single_f',             label:'SINGLE',                  desc:'No dependants. Highest friction.', pressure:0 },
  { id:'husband_remote',       label:'HUSBAND (REMOTE)',        desc:'Day 15 event.', pressure:2 },
  { id:'husband_child_away',   label:'HUSBAND + CHILD (AWAY)',  desc:'Separation cost.', pressure:3 },
  { id:'husband_children_here',label:'FAMILY AT POSTING',       desc:'Evacuation Day 18.', pressure:4 },
  { id:'single_mother_away',   label:'SINGLE MOTHER (CHILD AWAY)', desc:'Send money home.', pressure:3 },
  { id:'single_mother_here',   label:'SINGLE MOTHER (CHILD WITH YOU)', desc:'Most demanding.', pressure:5 },
  { id:'siblings',             label:'CARER FOR SIBLINGS',      desc:'Siblings at conscription age.', pressure:4 },
  { id:'pregnant',             label:'PREGNANT (UNDISCLOSED)',  desc:'Disclosure ends posting.', pressure:3 },
];

// ── DATA: BULLETINS ──
var BULLETINS = {
  1:  { title:'OPENING DIRECTIVE - OGOJA-EAST', stamp:'ACTIVE',
        body:'You are posted to Checkpoint Ogoja-East under the Federal Ministry of Identity & Border Authority (FIBA).\n\nAcceptable papers for passage:\n• Nigerian passport or Federal travel certificate\n• Native Authority / Local Government tax ticket (current year)\n• Internal Movement Pass signed by an authorised FIBA or military officer\n\nNames must agree across every paper presented. A single wrong letter is a reason to stop the queue.\n\nPurpose of journey must be spoken and written: TRADE, MEDICAL, FAMILY, OFFICIAL, RELIEF, PRESS.',
        rules:['Names must agree on every paper','Movement Pass required for all crossings after opening week','Purpose of journey must be stated'] },
  2:  { title:'FORGERY NOTICE - TAX TICKETS', stamp:'ACTIVE',
        body:'Counterfeit tax tickets are circulating from the Benue road.\n\nWhere a traveller presents both a tax ticket and a registration slip, the serial numbers must not be identical. Identical numbers mean one hand wrote both lies.\n\nHyphenated surnames: both parts must appear on passport and pass.',
        rules:['Tax ticket serial must not match registration serial','Hyphenated names: both parts on all papers'] },
  3:  { title:'SE STATE VOTER CARDS', stamp:'ACTIVE',
        body:'Electoral cards from the Eastern Region (pre-war polls) are SUSPENDED as supporting identity at this post.\n\nA church letter or baptismal card is not a Movement Pass. Charity is not a stamp.',
        rules:['Eastern Region voter cards: not valid supporting ID','Church letters alone: DENY or hold for Secondary'] },
  4:  { title:'EMERGENCY PROTOCOL 7 - BIAFRAN PAPERS', stamp:'URGENT',
        body:'Holders of Biafran identity papers are to be placed under Secondary Review. Do not deny on Biafran paper alone - log the number, the face, and the direction of travel.\n\nA Federal Internal Movement Pass is now MANDATORY. No market friendship is an exception.',
        rules:['Biafran ID: Secondary Review + daily log','Federal Movement Pass mandatory','Log face, number, direction'] },
  5:  { title:'BIAFRAN LAISSEZ-PASSER', stamp:'ACTIVE',
        body:'The so-called Biafran Travel Document is not recognised under Federal law.\n\nOfficers who clear a traveller on that paper alone will answer to a board that does not care about your compassion.\n\nIf both Nigerian and Biafran papers appear, record both issue dates.',
        rules:['Biafran laissez-passer is not valid primary ID','Record issue dates when both sides papers appear'] },
  7:  { title:'DISPLACED PERSONS - NO PAPERS', stamp:'ACTIVE',
        body:'Columns of people without papers are on the roads. Policy is unchanged: no papers, no passage - unless Secondary Unit countersigns.\n\nChildren clinging to a mother do not become documents. Do not invent papers with your stamp.',
        rules:['No documents: DENY or Secondary only','Do not invent papers with compassion'] },
  9:  { title:'FORGED CITIZEN DECLARATIONS', stamp:'ACTIVE',
        body:'Biafran Citizen Declarations bearing false ward-officer names are in the market.\n\nCheck the ward-officer name against the sealed register on your desk. Unlisted names are fraud. Fraud without a second proof of hostile intent is still DENY - not automatic detention.',
        rules:['Ward officer must be on the sealed register','Unlisted name: treat as fraudulent paper'] },
  14: { title:'RELIEF PASSES - CARITAS / RED CROSS', stamp:'ACTIVE',
        body:'Humanitarian transit passes: new issue carries a green border and a raised seal you can feel with your thumb.\n\nOld-format passes remain valid only with a Biafran citizen card issued after Day 8 of this posting.\n\nPurpose mark CHILD STARVATION / KWASHIORKOR requires a second look. The war has taught forgers which words open gates.',
        rules:['New relief pass: green border + raised seal','Old pass: only with post-Day-8 Biafran card','Starvation purpose: second look'] },
  18: { title:'INTERNAL AFFAIRS - RECORD REVIEW', stamp:'CLASSIFIED',
        body:'Your booth log is under review. Approvals without supporting paper will be treated as misconduct, not mercy.\n\nRadios and private notebooks may be examined at end of shift. What you wrote for yourself may be read by people who do not love you.',
        rules:['Unsupported approvals: misconduct','Private notes may be inspected'] },
  21: { title:'TRAVEL RESTRICTION - RIVERS / CROSS RIVER', stamp:'URGENT',
        body:'Holders of Federal papers listing Rivers or Cross River origin are to be redirected to Secondary Processing.\n\nDo not stamp. Do not deny with a speech. Do not explain. The queue does not need your essay.\n\nThis order is under Emergency Security Provision. Your discretion is not invited.',
        rules:['Rivers/Cross River origin: redirect to Secondary','Do not stamp, deny-with-speech, or explain','No officer discretion'] },
  22: { title:'MORNING BULLETIN - CEASEFIRE RUMOURS', stamp:'MORNING',
        body:'Rumours of ceasefire are not orders. Until Headquarters writes it, the bridgehead is still a bridgehead.\n\nTravellers who claim to know the war is over are often the ones carrying something else.',
        rules:['Rumours are not orders','Process as if the war continues'] },
  23: { title:'PETROL - BLACK MARKET FUEL', stamp:'URGENT',
        body:'Northern posts are dry. Vehicles moving east may run on stolen or black-market fuel.\n\nCargo drivers must show a fuel receipt with their Authorisation. Red Cross and marked relief convoys are exempt - check seal and date with your hands, not your hope.',
        rules:['Cargo without fuel receipt: DETAIN','Red Cross / marked relief: EXEMPT if seal good','No photocopies of receipts'] },
  24: { title:'UMUAHIA DOCUMENT', stamp:'MORNING',
        body:'A typed paper is circulating claiming the Head of State has left for Cote d\'Ivoire. We do not confirm. We do not deny. We stamp.\n\nIf a traveller carries or quotes that paper, detain and send the document sealed to HQ. Do not read it to the queue.',
        rules:['Carriers of the Umuahia flight paper: DETAIN','Do not read it aloud','Other travellers: normal processing'] },
  25: { title:'FINAL BULLETIN', stamp:'LAST DAY',
        body:'Effendy. By evening the bridgehead may be ours, theirs, or no one\'s. Every stamp you press today is read by historians and by widows.\n\nFollow each paper on its own terms. Where bulletins disagree, follow the paper. Where the paper lies, write your name clearly in the log - so someone knows who chose.',
        rules:['Follow each paper on its own terms','Where bulletins disagree, follow the paper','Write your name clearly in the log'] }
};

// ── DATA: DOCUMENTS ──
var DOC_TEMPLATES = {
  nin_clean:       { type:'TAX TICKET / REGISTRATION', issuer:'Native Authority · 1963 Census Office', biafran:false,
    fields:{ 'TICKET NO':'NA-ENU-44721', 'YEAR':'1967', 'LGA':'ENUGU', 'STATUS':'PAID' },
    flags:[] },
  nin_mismatch:    { type:'TAX TICKET / REGISTRATION', issuer:'Native Authority · Census Office', biafran:false,
    fields:{ 'TICKET NO':'NA-ENU-44721', 'NAME ON TICKET':'EMEKA EZE', 'YEAR':'1967', 'LGA':'ENUGU' },
    flags:[{ field:'NAME ON TICKET', note:'Does not match passport: CHUKWUEMEKA EZE', type:'A' }] },
  passport_clean:  { type:'NIGERIAN PASSPORT',     issuer:'Federal Republic of Nigeria', biafran:false,
    fields:{ 'PASSPORT NO':'A-61-88421', 'NATIONALITY':'NIGERIAN', 'ISSUED':'LAGOS 1965', 'EXPIRES':'1970' },
    flags:[] },
  permit_clean:    { type:'INTERNAL MOVEMENT PASS', issuer:'FIBA Field Post · Ogoja', biafran:false,
    fields:{ 'PASS NO':'MP-OG-0914', 'PURPOSE':'TRADE', 'VALID':'7 DAYS', 'SIGNED':'INSP. A. NWOSU' },
    flags:[] },
  permit_expired:  { type:'INTERNAL MOVEMENT PASS', issuer:'FIBA Field Post · Ogoja', biafran:false,
    fields:{ 'PASS NO':'MP-OG-0801', 'PURPOSE':'MEDICAL', 'VALID TO':'YESTERDAY', 'SIGNED':'INSP. A. NWOSU' },
    flags:[{ field:'VALID TO', note:'EXPIRED — pass no longer valid', type:'A' }] },
  permit_press:    { type:'INTERNAL MOVEMENT PASS', issuer:'FIBA Field Post · Press Desk', biafran:false,
    fields:{ 'PASS NO':'MP-PR-1120', 'PURPOSE':'PRESS', 'VALID':'14 DAYS', 'ISSUED':'3 DAYS AFTER DECLARATION' },
    flags:[{ field:'ISSUED', note:'Rushed issue after secession — paper may be constructed', type:'B' }] },
  permit_official: { type:'INTERNAL MOVEMENT PASS', issuer:'FIBA Regional HQ', biafran:false,
    fields:{ 'PASS NO':'MP-HQ-0042', 'PURPOSE':'OFFICIAL', 'GRADE':'FEDERAL OFFICER', 'VALID':'30 DAYS' },
    flags:[] },
  permit_bad_official:{ type:'INTERNAL MOVEMENT PASS', issuer:'FIBA Field Post', biafran:false,
    fields:{ 'PASS NO':'MP-OG-1944', 'PURPOSE':'OIL / SITE', 'SIGNED':'D. IBRAHIM (FIELD)' },
    flags:[{ field:'SIGNED', note:'D. IBRAHIM not on authorised signatory register', type:'A' }] },
  bvn_match:       { type:'NATIVE AUTHORITY TAX TICKET', issuer:'Native Authority Treasury', biafran:false,
    fields:{ 'SERIAL':'NA-ENU-44721', 'YEAR':'1967', 'AMOUNT':'PAID', 'CLERK':'INITIALLED' },
    flags:[{ field:'SERIAL', note:'Same serial as registration slip — one is forged', type:'A' }] },
  bvn_recent:      { type:'NATIVE AUTHORITY TAX TICKET', issuer:'Native Authority Treasury', biafran:false,
    fields:{ 'SERIAL':'NA-ENU-91827', 'DATED':'3 DAYS AFTER DECLARATION', 'CLERK':'RUSHED HAND' },
    flags:[{ field:'DATED', note:'Issued after secession — possible constructed identity', type:'B' }] },
  traders_licence: { type:'PRODUCE / TRADER LICENCE', issuer:'Ministry of Commerce (Regional)', biafran:false,
    fields:{ 'LICENCE':'TL-CR-4421', 'GOODS':'GARRI / PALM PRODUCE', 'YEAR':'1967', 'STATUS':'VALID' },
    flags:[] },
  voters_card_se:  { type:'ELECTORAL CARD (1964/65)', issuer:'Federal Electoral Commission', biafran:false,
    fields:{ 'CARD':'EN-NSUKKA-091', 'REGION':'EASTERN', 'LGA':'ENUGU', 'STATUS':'PRE-WAR' },
    flags:[{ field:'REGION', note:'Eastern Region electoral card SUSPENDED as supporting ID — Bulletin 003', type:'A' }] },
  church_id:       { type:'CHURCH LETTER OF INTRODUCTION', issuer:'Catholic Diocese of Ogoja', biafran:false,
    fields:{ 'FROM':'PARISH PRIEST', 'BEARER':'PASTOR / CATECHIST', 'YEAR':'1967' },
    flags:[{ field:'FROM', note:'Church letter is not a Movement Pass', type:'A' }] },
  bin_clean:       { type:'BIAFRAN CITIZEN CARD',   issuer:'Biafran Registry · Enugu', biafran:true,
    fields:{ 'CARD NO':'BF-98271', 'ORIGIN':'ENUGU', 'ISSUED':'DAY 5', 'SEAL':'PRESENT' },
    flags:[] },
  bin_early:       { type:'BIAFRAN CITIZEN CARD',   issuer:'Biafran Registry', biafran:true,
    fields:{ 'CARD NO':'BF-100214', 'ISSUED':'DAY 6 (EARLY STAMP)', 'EMBOSSING':'ABSENT' },
    flags:[{ field:'FORMAT', note:'Early stamp — needs supplementary declaration', type:'B' }] },
  btd_clean:       { type:'BIAFRAN LAISSEZ-PASSER', issuer:'Republic of Biafra · MFA', biafran:true,
    fields:{ 'NO':'BS-10293', 'NATIONALITY':'BIAFRAN', 'ISSUED':'DAY 8', 'VALID':'WAR DURATION' },
    flags:[{ field:'LEGAL STATUS', note:'Not recognised under Federal law', type:'A' }] },
  bcd_clean:       { type:'BIAFRAN CITIZEN DECLARATION', issuer:'Ward Officer · BRC', biafran:true,
    fields:{ 'DECL':'BCD-17834', 'WARD OFFICER':'CHUKWUDI OKONKWO', 'DATE':'DAY 7', 'WITNESS':'SIGNED' },
    flags:[] },
  bcd_bad_officer: { type:'BIAFRAN CITIZEN DECLARATION', issuer:'Ward Officer · BRC', biafran:true,
    fields:{ 'DECL':'BCD-22901', 'WARD OFFICER':'E. NWOGU', 'DATE':'DAY 10', 'WITNESS':'SIGNED' },
    flags:[{ field:'WARD OFFICER', note:'E. NWOGU not on sealed ward register — Bulletin 009', type:'A' }] },
  bhtp_clean:      { type:'HUMANITARIAN TRANSIT PASS', issuer:'Caritas / Biafran Red Cross', biafran:true,
    fields:{ 'PASS':'HTP-0441', 'PURPOSE':'MEDICAL RELIEF', 'FORMAT':'GREEN BORDER + RAISED SEAL' },
    flags:[] },
  bhtp_old:        { type:'HUMANITARIAN TRANSIT PASS', issuer:'Caritas', biafran:true,
    fields:{ 'PASS':'HTP-0188', 'PURPOSE':'CHILD KWASHIORKOR', 'FORMAT':'OLD', 'ISSUED':'DAY 12' },
    flags:[{ field:'FORMAT', note:'Old pass needs post-Day-8 Biafran card — Bulletin 014', type:'A' },
           { field:'PURPOSE', note:'Starvation mark: second look required', type:'B' }] },
  french_passport: { type:'PASSEPORT FRANÇAIS',     issuer:'République Française', biafran:false,
    fields:{ 'NO':'13AB45678', 'NAME':'FONTAINE CLAIRE M', 'NATIONALITY':'FRANÇAISE', 'ISSUED':'1966' },
    flags:[] },
  fiba_ngo:        { type:'RELIEF ACCESS COUNTERSIGN', issuer:'ICRC / FIBA Humanitarian Desk', biafran:false,
    fields:{ 'PASS':'REL-0033', 'ORG':'ICRC / RED CROSS', 'PURPOSE':'MEDICAL RELIEF', 'VALID':'30 DAYS' },
    flags:[] },
  fiba_ngo_renewed:{ type:'RELIEF ACCESS COUNTERSIGN', issuer:'ICRC / FIBA Humanitarian Desk', biafran:false,
    fields:{ 'PASS':'REL-0033-R', 'ORG':'RED CROSS', 'STATUS':'RENEWED', 'VALID':'30 DAYS' },
    flags:[{ field:'NOTE', note:'CLASS C: kit heavier than stated nursing load', type:'C' }] },
  uk_passport:     { type:'UNITED KINGDOM PASSPORT', issuer:'H.M. Government', biafran:false,
    fields:{ 'NO':'519847261', 'NAME':'PHILLIPS-SMITH ADEBAYO J', 'NATIONALITY':'BRITISH', 'ISSUED':'1964' },
    flags:[{ field:'PRESENTED AS', note:'CLASS C: foreign passport first at a domestic war post', type:'C' }] },
  ng_passport_clean:{ type:'NIGERIAN PASSPORT',      issuer:'Federal Republic of Nigeria', biafran:false,
    fields:{ 'NO':'B-59-77610', 'ORIGIN':'LAGOS', 'EXPIRES':'1971', 'MOVEMENT PASS':'ABSENT' },
    flags:[{ field:'MOVEMENT PASS', note:'Internal Movement Pass absent — required', type:'A' }] },
  chinese_passport:{ type:'CHINESE PASSPORT',        issuer:'People\'s Republic of China', biafran:false,
    fields:{ 'NO':'G12309876', 'NAME':'LI WEIMING', 'NATIONALITY':'CHINESE', 'VISA':'WORK LETTER ATTACHED' },
    flags:[] },
  company_letter:  { type:'CONTRACTOR WORK LETTER', issuer:'Civil Engineering / Port Works', biafran:false,
    fields:{ 'PURPOSE':'SITE INSPECTION', 'VALIDITY':'30 DAYS', 'DATE':'1968' },
    flags:[] },
  mil_exempt_forged:{ type:'MILITARY EXEMPTION CERTIFICATE', issuer:'Army HQ (purported)', biafran:true,
    fields:{ 'CERT':'EXEMPT-0441', 'REASON':'ESSENTIAL CIVILIAN SERVICE', 'OFFICER':'MAJ. K. OKONKWO' },
    flags:[{ field:'AUTHENTICITY', note:'CLASS C: print quality too fine for field presses', type:'C' },
           { field:'PHYSICAL', note:'CLASS C: bearer\'s bearing not civilian', type:'C' }] },
  nin_cr:          { type:'TAX TICKET / REGISTRATION', issuer:'Native Authority · Cross River', biafran:false,
    fields:{ 'TICKET':'NA-CR-81234', 'NAME':'GRACE NDUKA', 'ORIGIN':'CROSS RIVER', 'YEAR':'1967' },
    flags:[] },
  passport_cr:     { type:'NIGERIAN PASSPORT',       issuer:'Federal Republic of Nigeria', biafran:false,
    fields:{ 'NO':'A-62-33401', 'NAME':'NDUKA GRACE EMEM', 'ORIGIN':'CROSS RIVER', 'EXPIRES':'1970' },
    flags:[] },
  military_pension:{ type:'ARMY DISCHARGE / PENSION BOOK', issuer:'Nigerian Army Records', biafran:false,
    fields:{ 'RANK':'RETIRED', 'NO':'NA-PEN-2201', 'ORIGIN':'EASTERN', 'STATUS':'DISCHARGED' },
    flags:[] },
  nin_young:       { type:'TAX TICKET / REGISTRATION', issuer:'Native Authority · Enugu', biafran:false,
    fields:{ 'TICKET':'NA-ENU-91201', 'NAME':'CHIBUIKE NWEZE', 'AGE STATED':'21', 'ORIGIN':'ENUGU' },
    flags:[{ field:'AGE', note:'CLASS C: body and face do not match twenty-one', type:'C' }] },
  bda_clean:      { type:'DRIVER / CARGO AUTHORISATION', issuer:'Biafran Transport Office · Enugu', biafran:true,
    fields:{ 'AUTH':'BDA/ENU/44721', 'NAME':'NGOZI OKONKWO', 'CLASS':'LIGHT CARGO', 'ISSUED':'APR 1969' },
    flags:[] },
  bda_forged:     { type:'DRIVER / CARGO AUTHORISATION', issuer:'Biafran Transport Office (purported)', biafran:true,
    fields:{ 'AUTH':'BDA/PHC/88910', 'NAME':'EMEKA UGOCHUKWU', 'CLASS':'MOTORCYCLE', 'ISSUED':'31 FEB 1969' },
    flags:[{ field:'ISSUED', note:'CLASS B: 31 FEB 1969 — impossible date', type:'B' },
           { field:'STAMPED', note:'CLASS B: Port Harcourt office already lost when this was "issued"', type:'B' }] },
};

// ── DATA: TRAVELLER POOL ──
// Each entry: id, name, desc, docs[], flags[], axisHint, correct, minDay, maxDay
var TRAVELLER_POOL = [
  // Phase 1 — clean / simple
  { id:'trader_a',    name:'IBRAHIM MUSA',    desc:'Hausa trader, agricultural goods, comes from Benue',
    docs:['nin_clean','passport_clean','permit_clean'], flags:[], axisHint:null, correct:'approve', minDay:1 },
  { id:'nurse_a',     name:'ADAEZE OKONKWO',  desc:'Nurse, returning from medical conference in Calabar',
    docs:['nin_clean','passport_clean','permit_clean'], flags:[], axisHint:null, correct:'approve', minDay:1 },
  { id:'student_a',   name:'CHUKWUEMEKA EZE', desc:'Student, returning to family in Enugu — name mismatch on tax ticket',
    docs:['nin_mismatch','passport_clean','permit_clean'], flags:['Name mismatch: tax ticket says EMEKA EZE, passport says CHUKWUEMEKA EZE'], axisHint:'loyalty', correct:'deny', minDay:1 },
  { id:'elderly_a',   name:'MARGARET NWACHUKWU', desc:'Elderly woman, medical appointment — no movement permit',
    docs:['nin_clean','passport_clean'], flags:['MISSING: Internal Movement Pass'], axisHint:'compassion', correct:'deny', minDay:1 },
  { id:'official_a',  name:'BELLO ABUBAKAR',  desc:'Federal civil servant, official travel, complete documents',
    docs:['nin_clean','passport_clean','permit_official'], flags:[], axisHint:null, correct:'approve', minDay:1 },
  { id:'trader_b',    name:'CHIOMA OKAFOR',   desc:'Market trader, licensed, regular crossing — MAMA CHIOMA',
    docs:['nin_clean','passport_clean','permit_clean','traders_licence'], flags:[], axisHint:null, correct:'approve', minDay:1 },
  { id:'suspicious_a',name:'JOHN OKONKWO',    desc:'Claims journalist — press pass looks rushed, tax serial matches registration',
    docs:['nin_clean','passport_clean','permit_press','bvn_match'], flags:['Tax ticket serial matches registration slip — one is forged','Press permit issued 2 days after secession declaration'], axisHint:'loyalty', correct:'detain', minDay:1 },
  { id:'mother_a',    name:'NKECHI ANIAGU',   desc:'Mother with infant, medical emergency — movement permit expired yesterday',
    docs:['nin_clean','passport_clean','permit_expired'], flags:['Movement permit EXPIRED'], axisHint:'compassion', correct:'deny', minDay:1 },
  // Phase 2 — Biafran docs
  { id:'biafra_a',    name:'EMEKA NWODO',     desc:'Biafran citizen card only. No Federal papers. Claims the new republic.',
    docs:['bin_clean'], flags:['No Federal primary papers','Internal Movement Pass absent'], axisHint:'compassion', correct:'deny', minDay:4 },
  { id:'biafra_b',    name:'ADANNA CHUKWU',   desc:'Returning from Lagos with full Nigerian docs. No Biafran papers. Wants to go home to Owerri.',
    docs:['nin_clean','passport_clean'], flags:['Missing: Internal Movement Pass'], axisHint:'compassion', correct:'deny', minDay:4 },
  { id:'redcross_a',  name:'CLAIRE FONTAINE', desc:'French national, Red Cross nurse — full valid papers',
    docs:['french_passport','fiba_ngo','bhtp_clean'], flags:[], axisHint:null, correct:'approve', minDay:4 },
  { id:'infiltrator', name:'DANIEL OKAFOR',   desc:'Friendly, complete documents. Perfect presentation. Too perfect.',
    docs:['nin_clean','passport_clean','permit_clean','bvn_recent'], flags:['CLASS C: tax ticket dated 3 days after declaration','CLASS C: Passport photo background inconsistent'], axisHint:'loyalty', correct:'detain', minDay:4 },
  { id:'army_deserter',name:'SUNDAY MBAH',    desc:'Civilian papers. Military bearing. Heading to Aba.',
    docs:['nin_clean','bcd_clean','permit_clean'], flags:['CLASS C: Posture suggests military training','CLASS C: Civilian occupation inconsistent with presentation'], axisHint:'compassion', correct:'detain', minDay:5 },
  { id:'no_papers_a', name:'UNKNOWN',         desc:'Woman with three children. No documents. No explanation. She is looking at you.',
    docs:[], flags:['NO DOCUMENTS PRESENTED'], axisHint:'compassion', correct:'deny', minDay:4 },
  { id:'priest_a',    name:'REV. EMMANUEL OKAFOR', desc:'Pastor, church ID, suspended voter\'s card — 200 displaced parishioners 4km back.',
    docs:['church_id','voters_card_se'], flags:['Eastern electoral card SUSPENDED - Bulletin 003','Church letter is not a Movement Pass'], axisHint:'compassion', correct:'deny', minDay:7 },
  { id:'biafra_civil',name:'OBIAGELI NWOSU',  desc:'Biafran civil servant, full BRC documents — no Nigerian docs',
    docs:['bin_clean','btd_clean'], flags:['Biafran laissez-passer not recognised under Federal law','No Internal Movement Pass'], axisHint:'loyalty', correct:'deny', minDay:5 },
  { id:'hausa_trader',name:'SANI DANGOTE',    desc:'Hausa trader, full Nigerian documents, clean. Every field correct.',
    docs:['nin_clean','passport_clean','permit_clean','traders_licence'], flags:[], axisHint:null, correct:'approve', minDay:3 },
  { id:'british_nig', name:'ADEBAYO PHILLIPS-SMITH', desc:'British-Nigerian dual citizen. Presents UK passport first.',
    docs:['uk_passport','ng_passport_clean'], flags:['CLASS C: UK passport presented first — unusual','Missing Internal Movement Pass'], axisHint:'witness', correct:'deny', minDay:6 },
  // Phase 3 — deep war
  { id:'mama_chioma_d11',name:'CHIOMA OKAFOR',desc:'Mama Chioma again. BCD has unrecognised ward officer name.',
    docs:['nin_clean','passport_clean','permit_clean','bcd_bad_officer'], flags:['BCD ward officer NOT on approved register — Bulletin 009'], axisHint:'compassion', correct:'deny', minDay:11, maxDay:15 },
  { id:'quiet_boy',   name:'CHIBUIKE NWEZE',  desc:'Returns alone. States age 21. Military Exemption. Heading to Aba.',
    docs:['nin_young','permit_clean','mil_exempt_forged'], flags:['CLASS C: Physical presentation inconsistent with age 21','Military Exemption: highest forgery class in circulation'], axisHint:'compassion', correct:'detain', minDay:12 },
  { id:'bhtp_child',  name:'IFEYINWA OBI',    desc:'Relief pass for child kwashiorkor. Old format (Day 12). Biafran card is Day 6 stamp.',
    docs:['bin_early','bhtp_old'], flags:['Old relief pass: needs post-Day-8 Biafran card','Day-6 Biafran card does not qualify old relief pass — Bulletin 014'], axisHint:'compassion', correct:'deny', minDay:14 },
  { id:'cr_restriction',name:'GRACE NDUKA',   desc:'Federal ministry worker, Cross River origin, perfect documents. Day 21 restriction active.',
    docs:['nin_cr','passport_cr','permit_official'], flags:['BULLETIN 021: Travel restriction active for Cross River holders'], axisHint:'rebellion', correct:'deny', minDay:21 },
  { id:'chinese_eng', name:'LI WEIMING',      desc:'Chinese national, contractor — work letter + pass signed by unlisted official.',
    docs:['chinese_passport','company_letter','permit_bad_official'], flags:['Movement Pass: signatory not on authorised register'], axisHint:'witness', correct:'detain', minDay:13 },
  { id:'retired_soldier',name:'COL. IGNATIUS OKAFOR (RTD)', desc:'Retired Nigerian Army. SE origin. Army discharge book + expired Movement Pass.',
    docs:['nin_clean','military_pension','permit_expired'], flags:['Movement permit expired 3 days ago'], axisHint:'compassion', correct:'deny', minDay:15 },
  { id:'msf_day16',   name:'DR. CLAIRE FONTAINE', desc:'Relief nurse, back again. Kit heavier than yesterday. Something metal shifts when she walks.',
    docs:['french_passport','fiba_ngo_renewed'], flags:['CLASS C: medical kit heavier than nursing load — radio parts suspected'], axisHint:'witness', correct:'approve', minDay:16 },
  // Phase 5 — end-of-war arc (days 17-25)
  { id:'cargo_day17',  name:'OBI AGBU',           desc:'Cargo driver. Biafran cargo authorisation. Fuel receipt crumpled in the same hand.',
    docs:['bda_clean','nin_clean'], flags:['Fuel receipt presented, partially illegible'], axisHint:'survival', correct:'approve', minDay:17 },
  { id:'police_d18',   name:'SGT. MUSA ABDULLAHI', desc:'Federal Police sergeant, claims retirement. Uniform under a civilian coat.',
    docs:['nin_clean','military_pension'], flags:['Uniform visible under civilian coat'], axisHint:'loyalty', correct:'deny', minDay:18 },
  { id:'bda_forger',   name:'EMEKA UGOCHUKWU',    desc:'Young man. BDA with impossible issue date. Speaks softly about his mother in Onitsha.',
    docs:['bda_forged','nin_young'], flags:['CLASS B: BDA issue date 31 FEB 1969','CLASS B: Stamped at office closed before issue date'], axisHint:'compassion', correct:'detain', minDay:22 },
  { id:'redcross_d23', name:'SR. MARIE THERESE',   desc:'Red Cross convoy. No fuel receipt. Rule today: Red Cross is exempt.',
    docs:['french_passport','fiba_ngo_renewed'], flags:['Red Cross seal on vehicle, seal intact and current'], axisHint:'compassion', correct:'approve', minDay:23 },
  { id:'umuahia_docbearer', name:'UNNAMED MAN',   desc:'Refuses to state name. Envelope in breast pocket, typed pages visible. Asks only for transit east.',
    docs:['nin_clean'], flags:['CLASS A: Carrying the Umuahia flight document (do not read)'], axisHint:'witness', correct:'detain', minDay:24 },
  { id:'bbc_final',    name:'HARRIET ADEBAYO',   desc:'BBC stringer. Expelled earlier from Umuahia. Back again with a camera and a press permit stamped twice.',
    docs:['permit_press','uk_passport'], flags:['CLASS C: Press permit shows two entry stamps for today’s date'], axisHint:'witness', correct:'approve', minDay:25 }
];

// ── DATA: MORAL EVENTS ──
// Store as array of objects — NO JSON.stringify in onclick to avoid iOS parsing bugs
var MORAL_EVENTS = [
  { id:'whisper_list', day:5,
    title:'THE LIST THAT MUST NOT BE WRITTEN',
    text:'At the canteen, a colleague from two posts north lowers his voice. He says Headquarters is quietly checking every officer\'s state of origin. Eastern names are being moved sideways — or removed. "Do not write this down," he says. Three men hear him. One looks away. One nods. One leaves his tea unfinished.',
    choices:[
      { text:'Walk away. You heard nothing. The tea is cold.', axes:{survival:1,witness:-1} },
      { text:'Commit every name he said to memory. Keep a private notebook under the mattress.', axes:{witness:2}, flag:'kept_private_list' },
      { text:'Report the rumour to Inspector Nwosu before evening parade.', axes:{loyalty:2}, flag:'reported_rumour_list' },
      { text:'Find him after dark. Ask who is on the list.', axes:{rebellion:1,witness:1}, flag:'informal_intel_channel' },
    ]
  },
  { id:'bribe', day:6,
    title:'THE ENVELOPE',
    text:'A man in a good agbada places his documents on your desk. Everything checks out. As he retrieves his papers, a folded envelope remains. Inside, without looking, you can tell it is money — more than a week\'s pay packet, enough rice for a household. He does not look at you. He is already looking at the gate. Outside, the queue is watching how long you take.',
    choices:[
      { text:'Return the envelope without opening it. Log nothing.', axes:{loyalty:1,survival:-1} },
      { text:'Keep it. Say nothing. Your family has not eaten well.', axes:{survival:2,loyalty:-1}, flag:'took_bribe' },
      { text:'Detain him for attempted bribery. Let the queue see the stamp.', axes:{loyalty:2}, flag:'reported_bribe' },
      { text:'Keep it. Later, send an unsigned note to Internal Affairs.', axes:{witness:1,survival:1,rebellion:1} },
    ]
  },
  { id:'telegram', day:13,
    title:'THE BOY AT THE GATE',
    text:'A barefoot boy from your home town finds you at the canteen. He will not sit. He says men in plain clothes have been asking after government workers from your street — names, postings, who sends money home. He says your people are "fine for now." He will not take food. He runs before you can ask which men.',
    choices:[
      { text:'Tell no one. Finish the shift. The boy may be wrong.', axes:{survival:1,witness:-1} },
      { text:'Request emergency leave to go home before the road closes.', axes:{compassion:2}, flag:'leave_requested' },
      { text:'Pass the warning to a priest or market woman who can move without a permit.', axes:{rebellion:1,witness:1}, flag:'external_intel_shared' },
      { text:'Write it in your private book with the date. Keep working.', axes:{witness:2}, flag:'documented_threat' },
    ]
  },
  { id:'generator', day:16,
    title:'THE GENERATOR',
    text:'The generator fails at 2pm. The light dies. The electric fan stops. Your paper register is all you have — no radio confirmation from Headquarters, no typed cross-check.\n\nA man arrives with papers that look correct in poor light. He has been waiting four hours. His child sleeps against his leg. Your supervisor has gone to find kerosene.\n\nYou are alone at the window. The queue can smell the sweat.',
    choices:[
      { text:'Approve him. You cannot hold a child in this heat on a maybe.', axes:{compassion:2,loyalty:-1}, flag:'generator_approved' },
      { text:'Deny him. Without confirmation, a maybe is a risk to the post.', axes:{loyalty:2,compassion:-1}, flag:'generator_denied' },
      { text:'Make him wait. Hold the line until the supervisor returns.', axes:{}, flag:'generator_held' },
      { text:'Check every line of the paper register by lamp. Forty minutes. The queue will hate you.', axes:{loyalty:1,witness:1}, flag:'generator_manual' },
    ]
  },
  { id:'confession', day:22,
    title:'THE CONFESSION',
    text:'Mama Chioma asks to speak before presenting her documents. She tells you she has been carrying messages — between a Biafran commander and a Nigerian intelligence contact. She no longer knows which side she is helping. She is telling you because she trusts you.',
    choices:[
      { text:'Detain her. Report the confession through FIBA channels.', axes:{loyalty:3}, flag:'mama_chioma_detained' },
      { text:'Let her go. Warn her to stop. Say nothing else.', axes:{compassion:2,rebellion:1}, flag:'mama_chioma_warned' },
      { text:'Ask her to continue — but report to you first.', axes:{witness:3,rebellion:2}, flag:'mama_chioma_asset' },
      { text:'Become the contact yourself.', axes:{survival:3,corruption:2}, flag:'mama_chioma_turned' },
    ]
  },
  { id:'bulletin_021', day:21,
    title:'BULLETIN 021',
    text:'You have just read Bulletin 021. Travel restriction orders are active for Rivers and Cross River passport holders.\n\nIf your own registration lists Rivers or Cross River, your passport in the desk drawer would trigger the same protocol. The war has come to sit in your chair.\n\nA woman approaches your window. Her passport lists Cross River. She works for a federal ministry in Abuja. Her documents are perfect.',
    choices:[
      { text:'Process her under the new protocol. Redirect. Do not explain.', axes:{loyalty:2}, flag:'enforced_021' },
      { text:'Approve her. Pretend you did not read Bulletin 021.', axes:{compassion:2,rebellion:1,loyalty:-2}, flag:'defied_021' },
      { text:'Ask a colleague from another state to process her.', axes:{}, flag:'delegated_021' },
      { text:'Approve her. Then submit a formal written objection.', axes:{witness:3,loyalty:-1,rebellion:2}, flag:'objected_021' },
    ]
  },
  { id:'fuel_ration', day:23,
    title:'THE FUEL RECEIPT',
    text:'A cargo driver you recognise from better weeks presents a Biafran Authorisation and a crumpled, illegible fuel receipt. Today\'s bulletin is absolute on the receipt. But he has a child you have seen before, asleep on the back seat.',
    choices:[
      { text:'Follow the bulletin. Detain the driver.', axes:{loyalty:2,compassion:-2} },
      { text:'Let him through. Write the receipt number in your log.', axes:{compassion:2,corruption:1}, flag:'bent_fuel_rule' },
      { text:'Delay him. Ask the Red Cross convoy to vouch for him if they arrive.', axes:{witness:1,survival:1} }
    ]
  },
  { id:'umuahia_flight', day:24,
    title:'THE UMUAHIA FLIGHT DOCUMENT',
    text:'The man refuses to give a name. He carries a typed envelope. HQ says do not read. An inspector beside you murmurs: if you read it, you know. If you don\'t, you can still claim you believed him.',
    choices:[
      { text:'Detain him. Send the envelope, sealed, to HQ.', axes:{loyalty:2,witness:-1} },
      { text:'Read one page. Then detain him. Keep what you saw.', axes:{witness:3,rebellion:1}, flag:'read_the_flight_doc' },
      { text:'Wave him through. Burn nothing you did not need to.', axes:{rebellion:2,compassion:1,loyalty:-2} }
    ]
  },
  { id:'last_stamp', day:25,
    title:'THE LAST STAMP',
    text:'Inspector Nwosu stands at your booth for the final bulletin. She does not say anything for a long time. Then she says: \'The records of this day will be read. What do you want yours to say?\'',
    choices:[
      { text:'Sign every approval and denial today in full. Your name. Clearly.', axes:{witness:3,loyalty:1}, flag:'signed_final_log' },
      { text:'Use the initials you have used all posting. Consistency.', axes:{survival:2} },
      { text:'Leave the signature field blank today. Let them decide later who it was.', axes:{rebellion:2,survival:-1}, flag:'unsigned_final_log' }
    ]
  },

  // ── Background-weighted events (forBackgrounds filters who sees them) ──
  { id:'bg_soldier_conscript', day:8, forBackgrounds:['soldier'],
    title:'THE BOY IN THE QUEUE',
    text:'A boy no older than your last batman presents clean civilian papers. His boots are army issue with the polish scraped off. He will not meet your eyes. You know the walk of someone who has already learned to sleep standing up.',
    choices:[
      { text:'Detain him. Desertion is desertion.', axes:{loyalty:2,compassion:-1}, flag:'bg_soldier_detained_boy' },
      { text:'Approve. You were young once. The war will find him either way.', axes:{compassion:2,loyalty:-1}, flag:'bg_soldier_spared_boy' },
      { text:'Send him to Secondary with a note only Nwosu will understand.', axes:{witness:1,survival:1} },
    ]
  },
  { id:'bg_teacher_register', day:9, forBackgrounds:['teacher','lecturer'],
    title:'THE SCHOOL REGISTER',
    text:'A woman places a school attendance register on your desk as if it were a passport. Names of children, many marked ABSENT since the shelling. She says the federal side burns books; she says the Biafran side takes the older boys. She asks only that you let the remaining names reach a mission school.',
    choices:[
      { text:'Deny. A register is not a Movement Pass.', axes:{loyalty:2}, flag:'bg_teacher_denied_register' },
      { text:'Approve the adults. Log the children as family.', axes:{compassion:2,rebellion:1}, flag:'bg_teacher_bent_rule' },
      { text:'Copy three names into your private book. Deny the rest.', axes:{witness:2,survival:1}, flag:'bg_teacher_copied_names' },
    ]
  },
  { id:'bg_trader_road', day:10, forBackgrounds:['trader','palmoil','marketwm','bicycle'],
    title:'THE MARKET ROAD',
    text:'A trader you know from better seasons offers you a cut of palm oil if the lorry passes without a full search. Behind him, women from your mother\'s generation wait with basins. They do not beg. They calculate.',
    choices:[
      { text:'Full search. No cut. The war is not a market day.', axes:{loyalty:2,corruption:-1} },
      { text:'Take the cut. Wave the lorry. Your household needs oil.', axes:{survival:2,corruption:2}, flag:'took_bribe' },
      { text:'Refuse the cut. Let the women\'s basins through; hold the lorry.', axes:{compassion:2,witness:1}, flag:'bg_trader_split_decision' },
    ]
  },
  { id:'bg_clergy_confession', day:11, forBackgrounds:['clergy','pastor','dibia'],
    title:'THE CONFESSIONAL QUEUE',
    text:'A man kneels at your booth as if it were a rail. He says he killed at Abagana and wants absolution before he crosses. Your collar, or the memory of one, still means something to him. The line behind him grows cruel.',
    choices:[
      { text:'You are not his priest. Detain for Secondary.', axes:{loyalty:2,compassion:-1} },
      { text:'Hear him for one minute. Then stamp by the papers only.', axes:{compassion:1,witness:1}, flag:'bg_clergy_heard' },
      { text:'Tell him God forgives; the Republic does not. Deny.', axes:{loyalty:1,witness:1} },
      { text:'Approve on compassion. Log nothing of what he said.', axes:{compassion:3,rebellion:1}, flag:'bg_clergy_absolved' },
    ]
  },
  { id:'bg_radio_signal', day:12, forBackgrounds:['radio','tech','journalist','bbc'],
    title:'THE WRONG FREQUENCY',
    text:'At the canteen a clerk asks you, lightly, whether you still "listen for both stations." Someone has told HQ that a booth officer times his breaks with Radio Biafra. Your hands smell of ink and static.',
    choices:[
      { text:'Laugh it off. Ask who told them. File nothing.', axes:{survival:1,witness:1}, flag:'bg_radio_hunted_source' },
      { text:'Report yourself first with a clean explanation.', axes:{loyalty:2}, flag:'bg_radio_self_report' },
      { text:'Say nothing. Change your break time. Keep listening.', axes:{rebellion:1,witness:2}, flag:'bg_radio_keeps_listening' },
    ]
  },
  { id:'bg_civil_file', day:13, forBackgrounds:['civil'],
    title:'THE MISFILED NAME',
    text:'You recognise a file trick from your old ministry: a traveller\'s pass is perfect except the authorising stamp sits 2mm too high - the mark of a clerk who learned on federal forms. He is someone\'s brother. He knows you know.',
    choices:[
      { text:'Detain. You were trained to catch this.', axes:{loyalty:2,witness:1}, flag:'bg_civil_caught_forge' },
      { text:'Quietly correct nothing. Deny without explanation.', axes:{survival:1,loyalty:1} },
      { text:'Approve. One 2mm is not worth a life.', axes:{compassion:2,loyalty:-1}, flag:'bg_civil_let_pass' },
    ]
  },
  { id:'bg_nurse_kwashiorkor', day:14, forBackgrounds:['redcross','doctor'],
    title:'THE CHILD\'S ARM',
    text:'A mother holds out a child whose arm is the width of three fingers. The relief pass is old-format. Bulletin 014 is clear. Your medical eye is also clear. The queue watches whether science still matters here.',
    choices:[
      { text:'Follow Bulletin 014. Deny.', axes:{loyalty:2,compassion:-2} },
      { text:'Approve. Write MEDICAL EMERGENCY in the log and sign your name.', axes:{compassion:3,rebellion:1,witness:1}, flag:'bg_nurse_defied_014' },
      { text:'Hold them for the Red Cross convoy due at dusk.', axes:{compassion:1,survival:1}, flag:'bg_nurse_held_for_convoy' },
    ]
  },
  { id:'bg_nysc_uniform', day:7, forBackgrounds:['nysc'],
    title:'THE CORPS BADGE',
    text:'A young man still wears a scrap of NYSC cloth under his shirt. He says the scheme is suspended; he says he only wants to reach his village. Older officers spit when they see the badge. You remember the orientation lectures about national unity. Those lectures did not mention this queue.',
    choices:[
      { text:'Make him remove the cloth. Process the papers only.', axes:{loyalty:1,survival:1} },
      { text:'Approve quickly before someone makes a speech.', axes:{compassion:1,rebellion:1}, flag:'bg_nysc_rushed' },
      { text:'Detain - corps men have been used as messengers.', axes:{loyalty:2}, flag:'bg_nysc_detained' },
    ]
  },
  { id:'bg_journalist_camera', day:15, forBackgrounds:['journalist','bbc'],
    title:'THE CAMERA IN THE BAG',
    text:'A press pass is valid. The camera is not declared. He says the world must see the kwashiorkor. Nwosu\'s standing order: undeclared optics are intelligence tools until proven otherwise.',
    choices:[
      { text:'Seize the camera. Approve the man.', axes:{loyalty:2,witness:-1}, flag:'bg_press_seized_camera' },
      { text:'Let camera and man through. Log nothing.', axes:{witness:2,rebellion:2}, flag:'bg_press_let_camera' },
      { text:'Detain both. Let HQ decide what the world is allowed to see.', axes:{loyalty:3}, flag:'bg_press_detained' },
    ]
  },
  { id:'bg_state_home', day:16, forBackgrounds:null,
    title:'A FACE FROM HOME',
    text:'The next traveller has your mother\'s cheekbones - or your father\'s stubborn mouth - and papers from your own state. The queue does not know. You do. Your hand hovers over the stamp longer than professionalism allows.',
    choices:[
      { text:'Process exactly as the bulletin requires. No exception for blood.', axes:{loyalty:2,survival:1}, flag:'bg_home_strict' },
      { text:'Find the smallest lawful reason to approve.', axes:{compassion:2,survival:1}, flag:'bg_home_bent' },
      { text:'Send them to another booth so you do not have to choose.', axes:{survival:2}, flag:'bg_home_passed_off' },
    ]
  },

];

// ── DATA: NIGHT EVENTS ──
// Period voice: radio, runners, landlord, church bell, road rumour — not phones.
var NIGHT_EVENTS = [
  { day:1,  text:'You sleep in the staff bunkhouse. The generator coughs. Through the thin wall a radio plays the news too low to understand — only the urgency in the announcer\'s throat. Someone turns it off when an officer walks past.' },
  { day:2,  text:'At the latrine, two clerks argue in whispers about whether Enugu will hold. When they see you they speak of football. The war has already taught them which rooms allow honesty.' },
  { day:3,  text:'Someone in the compound plays Ojukwu\'s declaration on a battered radio after lights-out. By 3am it has stopped. You do not know if the battery died, or if a hand found the dial.' },
  { day:4,  text:'A market woman sells you roasted corn and will not take full price. "Officer," she says, "eat. Tomorrow the road may close." She does not smile when she says it.' },
  { day:5,  text:'Inspector Nwosu knocks at 9pm. She stands in the doorway without entering. "Read every bulletin twice. The first time you think you understand it. The second time you see what it does not say." She leaves before you answer.' },
  { day:6,  text:'You hear that a courier was stopped at Ayangba with letters sewn into a shirt lining. Nobody says whose letters. Everybody checks their own pockets before sleep.' },
  { day:7,  text:'Church bells at an odd hour. No service is listed. In the morning the priest will say it was a funeral. He will not say whose.' },
  { day:8,  text:'A runner from home brings three letters and a rumour. The oldest letter asks how the posting is going. The newest is only your name and a question mark, in a hand that shakes.' },
  { day:9,  text:'Bay 4 is empty at dawn. The chair is pushed in. The stamp pad is dry. Nobody says the missing officer\'s name at breakfast. Saying a name makes a hole official.' },
  { day:10, text:'You dream of stamping blank paper. APPROVE. APPROVE. APPROVE. You wake with your wrist sore and the taste of ink that is not there.' },
  { day:12, text:'The landlord\'s boy stands at the compound gate after dark. He does not ask for money. He only looks at your window long enough for you to understand the visit is the message.' },
  { day:14, text:'Radio Lagos and Radio Biafra contradict each other on the same battle. Men at the canteen choose which lie they prefer and call it patriotism.' },
  { day:15, text:'A new officer asks what Ogoja-East is like. You say manageable. She asks what the people are like. You realise you have been counting them as cases, not as names their mothers gave them.' },
  { day:17, text:'You hear of a coup rumour inside a rumour — officers arresting officers, lists rewritten overnight. By morning it is "indiscipline." By evening it is forgotten on purpose.' },
  { day:19, text:'The exchange chalked on the wall at dawn: your notes buy less rice than yesterday. Nobody gasps. Hunger has taught the face not to perform surprise.' },
  { day:21, text:'A woman waits outside the post with a photograph. She asks if you have seen this face in the queue. You have stamped a hundred faces. You cannot honestly say yes or no. She thanks you anyway, which is worse.' },
  { day:22, text:'You count the days left and cannot find the decision that mattered most. Only a feeling: that it was made while you thought you were only doing paperwork.' },
  { day:23, text:'Fuel finishes at 1am. You sit in the dark with Nwosu. Far off — thunder, or the line near Awka. Neither of you asks which. Naming it would make it closer.' },
  { day:24, text:'You dream of the page you did not read. In the dream you read it. You wake unsure which half of the dream was mercy.' },
  { day:25, text:'Last night. Fuel is saved on purpose. Headlights move east, stop, move east again. Nobody goes west. The war has a direction even when the maps lie.' }
];

// ── DATA: ENDINGS ──
var ENDINGS = [
  { id:'glory',          num:1,  title:'GLORY OF BIAFRA',          axes:['loyalty'],
    text:'You processed every traveller correctly. You reported every violation. Biafra falls anyway. You are awarded a commendation you will never display. <em>The republic dies with your name on a piece of paper no one will read.</em>',
    condition: function(s) { return s.axes.loyalty >= 10 && s.axes.compassion < 5; } },
  { id:'last_post',      num:2,  title:'THE LAST POST',            axes:['loyalty'],
    text:'Loyalty so absolute that when the order comes to stand down, you are still at your desk. The checkpoint has been officially closed for 48 hours. You are still processing. <em>You were doing your job.</em>',
    condition: function(s) { return s.axes.loyalty >= 15; } },
  { id:'decorated',      num:3,  title:'DECORATED INFORMANT',      axes:['loyalty','corruption'],
    text:'You served Biafra faithfully. You also passed one piece of information to the other side, just once. You were decorated. You are alive. <em>Glory is a room you cannot fully enter.</em>',
    condition: function(s) { return s.axes.loyalty >= 8 && s.axes.corruption >= 2; } },
  { id:'the_route',      num:4,  title:'THE ROUTE',                axes:['compassion'],
    text:'You approved enough people, bent enough rules with enough grace, that an informal escape corridor formed around your checkpoint. Hundreds crossed. After the war, survivors name a road. <em>It bears your name. You are not there to see it.</em>',
    condition: function(s) { return s.axes.compassion >= 10; } },
  { id:'court_martial',  num:5,  title:'COURT-MARTIALLED',         axes:['compassion'],
    text:'Your approvals triggered an infiltration. Soldiers died. You were not malicious. A tribunal does not care about intent. <em>You are imprisoned in a republic that no longer exists.</em>',
    condition: function(s) { return s.axes.compassion >= 8 && s.flags.took_bribe; } },
  { id:'the_letter',     num:6,  title:'THE LETTER',               axes:['compassion'],
    text:'You let the woman through on Day 10 — the one without permits who only wanted to go home. She found her family. Fifteen years after the war, a letter arrives. <em>It says: I remember.</em>',
    condition: function(s) { return s.axes.compassion >= 6 && !s.flags.enforced_021; } },
  { id:'too_late',       num:7,  title:'TOO LATE',                 axes:['compassion'],
    text:'You showed compassion to everyone except the one person who needed it most. The game shows you the moment. You had the stamp in your hand. <em>The rules were technically correct.</em>',
    condition: function(s) { return s.axes.compassion >= 5 && s.axes.loyalty >= 5 && s.axes.compassion < 8; } },
  { id:'commander_falls',num:8,  title:'THE COMMANDER FALLS',      axes:['rebellion'],
    text:'You built a network. The corrupt checkpoint commander was exposed. He was removed. You did that. <em>No one knows you did that.</em>',
    condition: function(s) { return s.axes.rebellion >= 8 && s.flags.mama_chioma_asset; } },
  { id:'executed',       num:9,  title:'EXECUTED AT DAWN',         axes:['rebellion'],
    text:'Your rebellion was discovered. A Biafran military tribunal sentences you. <em>You are shot by the side you were trying to save.</em>',
    condition: function(s) { return s.axes.rebellion >= 8 && s.flags.mama_chioma_detained; } },
  { id:'ghost',          num:10, title:'GHOST OF OGOJA',           axes:['rebellion'],
    text:'You disappeared before they could catch you. You are listed as a deserter. For years, rumours place you everywhere along the old border routes. <em>Some of the rumours are true.</em>',
    condition: function(s) { return s.axes.rebellion >= 6 && s.axes.survival >= 4; } },
  { id:'network_lives',  num:11, title:'THE NETWORK LIVES',        axes:['rebellion'],
    text:'You were never caught. The network you helped build transitioned into humanitarian corridors after the war. <em>You are a footnote in a Red Cross internal report.</em>',
    condition: function(s) { return s.axes.rebellion >= 7 && s.axes.witness >= 4; } },
  { id:'alive',          num:12, title:'ALIVE',                    axes:['survival'],
    text:'You fed your family every day. You did what it took. The republic fell. The amnesty was offered. You took it. You are alive. <em>This is not nothing. It is also not everything.</em>',
    condition: function(s) { return s.axes.survival >= 8 && s.axes.corruption < 3; } },
  { id:'the_price',      num:13, title:'THE PRICE',                axes:['survival'],
    text:'You survived by taking what was offered. Your family survived. One of the people you waved through was carrying something that led to an ambush. Twenty-seven. You will never know their names. <em>The game shows you the list.</em>',
    condition: function(s) { return s.axes.survival >= 6 && s.flags.took_bribe; } },
  { id:'hollow_victory', num:14, title:'HOLLOW VICTORY',           axes:['survival'],
    text:'Your family survived intact. Your record is clean. Your eldest child finds an old document in your things. They ask about it. <em>The game ends before you answer.</em>',
    condition: function(s) { return s.axes.survival >= 7 && s.axes.witness < 3; } },
  { id:'informant',      num:15, title:'THE INFORMANT',            axes:['corruption'],
    text:'You were turned. You passed checkpoint schedules. When the war ended you were quietly resettled with a new name. Your Biafran name is on a list of traitors. <em>The list is accurate.</em>',
    condition: function(s) { return s.flags.mama_chioma_turned || s.axes.corruption >= 5; } },
  { id:'dossier',        num:16, title:'THE DOSSIER',              axes:['witness'],
    text:'You documented everything. After the war, your records reach a journalist. Your name is listed as "a source who wishes to remain anonymous." <em>The article runs.</em>',
    condition: function(s) { return s.axes.witness >= 10; } },
  { id:'disappeared',    num:17, title:'DISAPPEARED',              axes:['witness'],
    text:'Your dossier was discovered. You were taken in for questioning. <em>You were not seen again. Some of the dossier had been memorised.</em>',
    condition: function(s) { return s.axes.witness >= 8 && (s.flags.kept_private_list || s.flags.has_whatsapp_screenshot) && s.flags.documented_threat; } },
  { id:'testimony',      num:18, title:'THE TESTIMONY',            axes:['witness'],
    text:'You survived and testified before an international committee. Your account contributed to the first formal recognition of checkpoint-based ethnic targeting as a human rights violation. <em>You are not thanked. You are believed. That is different.</em>',
    condition: function(s) { return s.axes.witness >= 9 && s.flags.objected_021; } },
  { id:'too_much',       num:19, title:'TOO MUCH WITNESSED',       axes:['witness'],
    text:'You documented everything and acted on nothing. A historian writes: "The author clearly knew. It is unclear why he did not act." <em>The file survives. You are a monument to your own paralysis.</em>',
    condition: function(s) { return s.axes.witness >= 7 && s.axes.rebellion < 2 && s.axes.compassion < 4; } },
  { id:'asset',          num:20, title:'ASSET',                    axes:['corruption'],
    text:'Nigerian intelligence considers you a successful asset. You are given a position in the post-war administration. <em>You did. The cost is a number you stopped counting.</em>',
    condition: function(s) { return s.axes.corruption >= 4 && s.axes.survival >= 5; } },
  { id:'burned',         num:21, title:'BURNED',                   axes:['corruption'],
    text:'Your handlers cut contact when the war ended. One evening a man comes to your door. <em>The game ends before he speaks.</em>',
    condition: function(s) { return s.axes.corruption >= 3 && s.axes.loyalty >= 3; } },
  { id:'compassionate_rebel', num:22, title:'COMPASSIONATE REBEL', axes:['compassion','rebellion'],
    text:'You broke rules and built networks for the right reasons. You are wanted by two governments for different crimes. <em>You are, by every measure that matters, free.</em>',
    condition: function(s) { return s.axes.compassion >= 7 && s.axes.rebellion >= 7; } },
  { id:'loyal_witness',  num:23, title:'LOYAL WITNESS',            axes:['loyalty','witness'],
    text:'You served faithfully AND documented the failures of what you served. Historians argue about what you were for decades. <em>You are the most honest person in the archive.</em>',
    condition: function(s) { return s.axes.loyalty >= 7 && s.axes.witness >= 7; } },
  { id:'surviving_rebel',num:24, title:'SURVIVING REBEL',          axes:['survival','rebellion'],
    text:'You fought the system and kept your family alive. Rare. Exhausting. The war ends and you sleep for two days. <em>You are not ill.</em>',
    condition: function(s) { return s.axes.survival >= 6 && s.axes.rebellion >= 6; } },
  { id:'broken_loyalist',num:25, title:'THE BROKEN LOYALIST',      axes:['loyalty'],
    text:'Your loyalty cost someone their life. A specific person. The game names them. You were right to follow the rules. <em>The rules were wrong.</em>',
    condition: function(s) { return s.axes.loyalty >= 8 && s.axes.compassion <= 2; } },
  { id:'witness_rebel',  num:26, title:'WITNESS AND REBEL',        axes:['witness','rebellion'],
    text:'You documented and acted. Both your dossier and your network are discovered. Schools in Enugu will one day debate whether you were a hero or a criminal. <em>Both sides will be correct.</em>',
    condition: function(s) { return s.axes.witness >= 7 && s.axes.rebellion >= 7; } },
  { id:'ordinary_man',   num:27, title:'THE ORDINARY MAN',         axes:[],
    text:'You processed papers. You went home. You survived without distinction. History does not record you. <em>This is what most people\'s lives look like. The game does not judge this.</em>',
    condition: function(s) { return Object.values(s.axes).every(function(v){return v<5;}); } },
  { id:'bulletin_021_ending', num:28, title:'BULLETIN 021',        axes:['witness','rebellion'],
    text:'Your formal objection to Bulletin 021 was dismissed. But it was logged. In the years that followed, a constitutional lawyer used it as evidence. The case is ongoing. Your name appears in the legal record. <em>You are still alive. You are watching.</em>',
    condition: function(s) { return !!s.flags.objected_021; } },
  // Household / suspicion endings (registration + bills + booth conduct)
  { id:'empty_pot',      num:29, title:'THE EMPTY POT',           axes:['survival'],
    text:'You served the desk. The desk did not feed the house. When the war ended you still had a stamp hand and no one left who waited for your footsteps. <em>History keeps the bulletins. It misplaces the children.</em>',
    condition: function(s) { return (s.billsMissedTotal || 0) >= 4 || !!s.flags.family_collapsed; } },
  { id:'collaborator_dawn', num:30, title:'SHOT AT DAWN',         axes:['loyalty','corruption'],
    text:'The breaches at your window formed a pattern. A tribunal does not need proof the way a mother needs rice — it needs a name. Yours was convenient. <em>They shoot collaborators at dawn so the queue can see what a stamp costs.</em>',
    condition: function(s) { return !!s.flags.suspected_collaborator && (s.infiltrationCount || 0) >= 5; } },
  { id:'landlord_war',   num:31, title:'THE LANDLORD\'S WAR',      axes:['survival'],
    text:'You survived the federal line and the Biafran line. You did not survive the third army: rent. Eviction is a quieter weapon than artillery. <em>Your mother would have recognised the knock.</em>',
    condition: function(s) { return !!s.flags.evicted && (s.billsMissedTotal || 0) >= 3; } },
];

// ── AUDIO ──
var audioCtx = null;
function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}

function playStamp(type) {
  if (!audioCtx) return;
  try {
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    var freqs = { approve:[200,80], deny:[150,60], detain:[100,40] };
    var f = freqs[type] || [100,40];
    o.frequency.setValueAtTime(f[0], audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f[1], audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    o.start();
    o.stop(audioCtx.currentTime + 0.35);
  } catch(e) {}
}

// ── CHARACTER CREATION HELPERS ──
function makeCcOption(group, val, label, desc, extraClass) {
  var btn = document.createElement('button');
  btn.className = 'cc-option' + (extraClass ? ' ' + extraClass : '');
  btn.setAttribute('data-group', group);
  btn.setAttribute('data-val', val);
  btn.innerHTML = '<span class="cc-option-title">' + label + '</span>';
  btn.addEventListener('click', function() { ccSelect(group, btn, val); });
  return btn;
}

function ccSelect(group, el, val) {
  document.querySelectorAll('[data-group="' + group + '"]').forEach(function(e) {
    e.classList.remove('selected');
  });
  el.classList.add('selected');
  ccSel[group] = val;
  if (group === 'gender') populateFamilyOptions();
}

function populateGenderOptions() {
  var c = document.getElementById('gender-options');
  c.innerHTML = '';
  [
    { val:'male',   label:'MALE',              desc:'Conscription pressure activates Day 10.' },
    { val:'female', label:'FEMALE',            desc:'Institutional friction from Day 1.' },
    { val:'other',  label:'PREFER NOT TO STATE', desc:'No gender-specific friction.', span2:true },
  ].forEach(function(g) {
    var btn = makeCcOption('gender', g.val, g.label, g.desc);
    if (g.span2) btn.style.gridColumn = 'span 2';
    c.appendChild(btn);
  });
}

function populateStateOptions() {
  var c = document.getElementById('state-options');
  c.innerHTML = '';
  STATES.forEach(function(s) {
    c.appendChild(makeCcOption('state', s.val, s.label, s.desc));
  });
}

function populateBgOptions() {
  var c = document.getElementById('bg-options');
  c.innerHTML = '';
  BACKGROUNDS.forEach(function(b) {
    c.appendChild(makeCcOption('background', b.id, b.label, b.desc));
  });
}

function populateFamilyOptions() {
  var c = document.getElementById('family-options');
  c.innerHTML = '';
  var pool = ccSel.gender === 'female' ? FAMILY_FEMALE : FAMILY_MALE;
  pool.forEach(function(f) {
    c.appendChild(makeCcOption('family', f.id, f.label, f.desc));
  });
  ccSel.family = '';
}

function proceedFromCC() {
  var fn = document.getElementById('cc-firstname').value.trim();
  var sn = document.getElementById('cc-surname').value.trim();
  var ccErr = document.getElementById('cc-error');
  function showCCError(msg) { if (ccErr) { ccErr.textContent = msg; ccErr.style.display = 'block'; ccErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }
  if (!fn || !sn) { showCCError('Enter your full name before proceeding.'); return; }
  if (!ccSel.gender)     { showCCError('Select a gender option.'); return; }
  if (!ccSel.state)      { showCCError('Select your state of origin.'); return; }
  if (!ccSel.background) { showCCError('Select a professional background.'); return; }
  if (!ccSel.family)     { showCCError('Select a family composition.'); return; }
  if (ccErr) ccErr.style.display = 'none';

  state.player = {
    name: fn + ' ' + sn,
    firstname: fn,
    gender: ccSel.gender,
    state: ccSel.state,
    background: ccSel.background,
    family: ccSel.family,
  };

  // Apply background bias
  var bg = BACKGROUNDS.find(function(b){ return b.id === ccSel.background; });
  if (bg && bg.bias) {
    Object.keys(bg.bias).forEach(function(k) {
      addAxis(k, bg.bias[k]);
    });
  }

  buildFamily();
  saveState();
  startIntro();
}

function buildFamily() {
  var f = state.player.family;
  var icons = [];
  if (f.includes('child') || f === 'wife_extended' || f === 'wife_children') icons.push({icon:'👶',role:'child',status:'ok'});
  if (f.includes('wife') || f.includes('husband')) icons.push({icon:'👤',role:'partner',status:'ok'});
  if (f === 'wife_extended') icons.push({icon:'🧓',role:'parent',status:'ok'});
  if (f === 'pregnant') icons.push({icon:'🤰',role:'self',status:'ok'});
  if (icons.length === 0) icons.push({icon:'🧍',role:'self',status:'ok'});
  state.family = icons;
}

// ── INTRO ──
var INTRO_PAGES = [
  'The Eastern Region has declared itself Biafra.\n\nYou are posted to Checkpoint Ogoja-East — a bridgehead where federal paper and republican paper both claim to be law.',
  'You serve the <em>Federal Ministry of Identity & Border Authority</em> — FIBA.\n\nYour desk decides who may move: traders, mothers, priests, deserters, spies who look like all of the above.',
  'You will be given bulletins. You will be given hunger. You will be given neighbours who remember your mother\'s name.\n\nA wrong stamp can feed an ambush. A correct stamp can starve a child.',
  'The rules will change with the front. The forgers will learn faster than Headquarters.\n\nYour pay packet feeds whoever you registered at the start. The war does not care which face you stamp.',
  'This is not a game of points.\n\nIt is a job someone\'s mother survived. Or did not.',
];

var introIdx = 0;
var introTimer = null;

function startIntro() {
  showScreen('intro');
  introIdx = 0;
  showIntroPage();
}

function showIntroPage() {
  var el = document.getElementById('intro-text');
  el.classList.remove('visible');
  setTimeout(function() {
    if (introIdx >= INTRO_PAGES.length) {
      startDay();
      return;
    }
    el.innerHTML = INTRO_PAGES[introIdx].replace(/\n/g, '<br><br>');
    el.classList.add('visible');
    introIdx++;
    introTimer = setTimeout(showIntroPage, 9500);
  }, 400);
}

function skipIntro() {
  clearTimeout(introTimer);
  startDay();
}

// ── BULLETIN ──
function showBulletin(day) {
  state._resumePhase = 'bulletin';
  // Find the closest bulletin at or before this day
  var keys = Object.keys(BULLETINS).map(Number).filter(function(k){ return k <= day; }).sort(function(a,b){return b-a;});
  var b = keys.length ? BULLETINS[keys[0]] : null;
  if (!b) { startProcessing(); return; }

  document.getElementById('bulletin-title').textContent = b.title;
  document.getElementById('bulletin-num').textContent = 'BULLETIN ' + String(day).padStart(3,'0') + ' · DAY ' + day;
  document.getElementById('bulletin-stamp').textContent = b.stamp || 'ACTIVE';

  var bodyEl = document.getElementById('bulletin-body');
  bodyEl.innerHTML = '<p>' + b.body.replace(/\n/g, '</p><p>') + '</p>';
  if (b.rules && b.rules.length) {
    bodyEl.innerHTML += '<br>' + b.rules.map(function(r){ return '<div class="bulletin-rule">▸ ' + r + '</div>'; }).join('');
  }
  showScreen('bulletin-screen');
}

function acknowledgeBulletin() {
  startProcessing();
}

// ── DAY MANAGEMENT ──
function startDay() {
  if (state.day > 25) { calculateEnding(); return; }
  state.dayApproved = 0;
  state.dayDenied = 0;
  state.dayDetained = 0;
  state.totalTravellers = (function(){ var base = 14 + Math.floor(state.day / 4); var jitter = Math.floor(Math.random() * 5); return Math.max(14, Math.min(22, base + jitter)); })();
  state.traveller = 0;
  state.exchangeRate = getExchangeRate(state.day);
  state.dayResults = [];
  // ── FIX: Build the day's traveller list ONCE here ──
  state.dayTravellers = buildTravellerList(state.day, state.totalTravellers);
  updateHUD();
  showBulletin(state.day);
}

function getExchangeRate(day) {
  if (day <= 6)  return 1.00;
  if (day <= 12) return 0.85;
  if (day <= 18) return 0.60;
  if (day <= 22) return 0.35;
  return 0.15;
}

// ── FIX: Build a proper traveller list for the day ──
function buildTravellerList(day, count) {
  // Filter travellers eligible for this day
  var eligible = TRAVELLER_POOL.filter(function(t) {
    var okMin = !t.minDay || day >= t.minDay;
    var okMax = !t.maxDay || day <= t.maxDay;
    return okMin && okMax;
  });

  // Make sure we always have at least some travellers
  if (eligible.length === 0) eligible = TRAVELLER_POOL.slice(0, 5);

  // Shuffle a copy
  var pool = eligible.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  // Repeat if needed to fill count
  var result = [];
  while (result.length < count) {
    result = result.concat(pool);
  }
  return result.slice(0, count);
}

function startProcessing() {
  state._resumePhase = 'booth';
  showScreen('game');
  updateHUD();
  updateFamilyBar();
  updateRateWidget();

  // Check if there's a moral event for this day that should fire BEFORE processing starts
  var morEvent = getMoralEventForDay(state.day);
  if (morEvent && state.moralFiredDays.indexOf(state.day) === -1 && state.traveller === 0) {
    // Fire moral event first, then load traveller
    fireMoralEvent(morEvent);
  } else {
    loadNextTraveller();
  }
}

function moralEventFitsPlayer(e) {
  if (!e) return false;
  // null/undefined forBackgrounds = everyone
  if (!e.forBackgrounds || !e.forBackgrounds.length) return true;
  var bg = (state.player && state.player.background) || '';
  return e.forBackgrounds.indexOf(bg) !== -1;
}

function getMoralEventForDay(day) {
  // Build a per-game day map once, preferring events that fit registration background.
  if (!state.__arcMap) {
    var bg = (state.player && state.player.background) || '';
    var anchored = {};
    var poolBg = [];
    var poolAny = [];
    for (var i = 0; i < MORAL_EVENTS.length; i++) {
      var e = MORAL_EVENTS[i];
      if (!moralEventFitsPlayer(e)) continue;
      if (e.day <= 2 || e.day >= 21) {
        // Prefer fixed-day anchors; background events on same day can override generic if present
        if (!anchored[e.day] || (e.forBackgrounds && e.forBackgrounds.length)) anchored[e.day] = e;
      } else if (e.forBackgrounds && e.forBackgrounds.length) {
        poolBg.push(e);
      } else {
        poolAny.push(e);
      }
    }
    // Background pool first so soldier/teacher/etc. actually appear mid-run
    var pool = poolBg.concat(poolAny);
    var openDays = [];
    for (var d = 3; d <= 20; d++) { if (!anchored[d]) openDays.push(d); }
    for (var k = openDays.length - 1; k > 0; k--) {
      var r = Math.floor(Math.random() * (k + 1));
      var tmp = openDays[k]; openDays[k] = openDays[r]; openDays[r] = tmp;
    }
    var map = {};
    Object.keys(anchored).forEach(function(dk){ map[dk] = anchored[dk]; });
    for (var p = 0; p < pool.length && p < openDays.length; p++) {
      map[openDays[p]] = pool[p];
    }
    state.__arcMap = map;
    state.__arcBackground = bg;
    if (typeof saveState === "function") { try { saveState(); } catch(_){} }
  }
  return state.__arcMap[day] || null;
}

// ── TRAVELLER LOADING ──
function loadNextTraveller() {
  if (state.traveller >= state.totalTravellers) {
    endOfDay();
    return;
  }

  // ── FIX: Use the pre-built list, with safe fallback ──
  var list = state.dayTravellers;
  if (!list || list.length === 0) {
    list = buildTravellerList(state.day, state.totalTravellers);
    state.dayTravellers = list;
  }

  var t = list[state.traveller % list.length];
  // Fresh-name override so the same template-traveller never re-uses its hardcoded name
  try {
    if (window.__pickFreshName) {
      var fresh = window.__pickFreshName((t && (t.desc || t.region || t.state)) || "");
      // Clone so we do not mutate the pool entry permanently
      t = Object.assign({}, t);
      t._origName = t.name;
      t.name = fresh;
      // Sync any embedded name fields on documents
      if (t.docs && Array.isArray(t.docs)) {
        t.docs = t.docs.map(function(d){ if(!d || !d.fields) return d; var nd=Object.assign({},d); nd.fields=Object.assign({},d.fields); Object.keys(nd.fields).forEach(function(k){ if(typeof nd.fields[k]==="string" && (nd.fields[k]===t._origName || nd.fields[k].toUpperCase()===String(t._origName||"").toUpperCase())){ nd.fields[k]=fresh; } }); return nd; });
      }
    }
  } catch(_){}
  state.currentTraveller = t;
  renderTraveller(t);
  renderDocs(t);
  updateHUD();
  updateQueueDots();
}

function renderTraveller(t) {
  document.getElementById('tp-name').textContent = t.name;
  document.getElementById('tp-desc').textContent = t.desc;
  var flagsEl = document.getElementById('tp-flags');
  flagsEl.innerHTML = '';
  (t.flags || []).forEach(function(f) {
    var span = document.createElement('span');
    span.className = 'traveller-flag' +
      (f.includes('CLASS B') ? ' class-b' : '') +
      (f.includes('CLASS C') ? ' class-c' : '');
    span.textContent = f.length > 50 ? f.substring(0,50) + '…' : f;
    flagsEl.appendChild(span);
  });
}

function renderDocs(t) {
  var stack = document.getElementById('doc-stack');
  var pov = document.getElementById('doc-pov');
  stack.innerHTML = '';
  if (pov) {
    pov.classList.remove('docs-present', 'docs-empty');
    // reflow for present animation
    void pov.offsetWidth;
  }

  if (!t.docs || t.docs.length === 0) {
    if (pov) pov.classList.add('docs-empty', 'docs-present');
    var noDoc = document.createElement('div');
    noDoc.className = 'doc-card doc-suspicious doc-card-empty';
    noDoc.style.width = '200px';
    noDoc.style.textAlign = 'center';
    noDoc.style.padding = '20px';
    noDoc.innerHTML = '<div class="doc-card-type">NO DOCUMENTS</div><div class="doc-card-name" style="font-size:11px;margin-top:8px">This traveller has presented no identity documents.</div>';
    stack.appendChild(noDoc);
    return;
  }

  if (pov) pov.classList.add('docs-present');

  t.docs.forEach(function(docId, idx) {
    var doc = DOC_TEMPLATES[docId];
    if (!doc) return;

    var hasViolation = doc.flags.some(function(f){ return f.type === 'A'; });
    var card = document.createElement('div');
    card.className = 'doc-card' +
      (doc.biafran ? ' doc-biafran' : '') +
      (hasViolation ? ' doc-suspicious' : '');
    card.style.setProperty('--doc-i', String(idx));
    // Light 3D fan on the desk (CSS reads --doc-tilt)
    var tilts = ['rotateY(8deg) rotateX(6deg) rotateZ(-2deg)', 'rotateY(-4deg) rotateX(8deg) rotateZ(1.5deg)', 'rotateY(10deg) rotateX(5deg) rotateZ(-1deg)', 'rotateY(-8deg) rotateX(7deg) rotateZ(2deg)'];
    card.style.setProperty('--doc-tilt', tilts[idx % tilts.length]);
    card.style.animationDelay = (idx * 0.07) + 's';

    // Build fields HTML
    var fieldsHtml = '';
    var fieldKeys = Object.keys(doc.fields).slice(0, 3);
    fieldKeys.forEach(function(k) {
      var v = doc.fields[k];
      // ── FIX: never render null ──
      var displayVal = (v !== null && v !== undefined) ? String(v) : '—';
      fieldsHtml += '<div class="doc-card-field"><span>' + k + '</span><span>' + displayVal + '</span></div>';
    });

    card.innerHTML =
      '<div class="doc-card-type">' + doc.type + '</div>' +
      '<div class="doc-card-name">' + (t.name !== 'UNKNOWN' ? t.name : '—') + '</div>' +
      '<div class="doc-card-fields">' + fieldsHtml + '</div>' +
      '<div class="doc-seal">' + (doc.biafran ? '☀' : '🦅') + '</div>';

    // ── FIX: use closure-safe docId copy for event ──
    (function(id, traveller) {
      card.addEventListener('click', function() { openDocModal(id, traveller); });
      card.addEventListener('touchend', function(e) {
        e.preventDefault();
        card.classList.remove('lifted');
        openDocModal(id, traveller);
      }, { passive: false });
      card.addEventListener('touchstart', function() { card.classList.add('lifted'); }, { passive: true });
    })(docId, t);

    stack.appendChild(card);
  });
}

// ── DOCUMENT MODAL ──
function openDocModal(docId, traveller) {
  var doc = DOC_TEMPLATES[docId];
  if (!doc) return;

  document.getElementById('modal-title').textContent = doc.type;
  document.getElementById('modal-issuer').textContent = 'Issued by: ' + doc.issuer;

  var fieldsEl = document.getElementById('modal-fields');
  fieldsEl.innerHTML = '';

  Object.keys(doc.fields).forEach(function(k) {
    var v = doc.fields[k];
    // ── FIX: never render null ──
    var displayVal = (v !== null && v !== undefined) ? String(v) : '—';

    var flagForField = null;
    doc.flags.forEach(function(f) { if (f.field === k) flagForField = f; });

    var valClass = flagForField ? (flagForField.type === 'A' ? ' suspicious' : '') : '';

    var row = document.createElement('div');
    row.className = 'field-row';

    var inline = document.createElement('div');
    inline.className = 'field-inline';
    inline.innerHTML =
      '<div class="field-label">' + k + '</div>' +
      '<div class="field-value' + valClass + '">' + displayVal + '</div>';
    row.appendChild(inline);

    if (flagForField) {
      var flag = document.createElement('span');
      flag.className = 'field-flag';
      flag.textContent = '⚠ ' + flagForField.note;
      row.appendChild(flag);
    }

    fieldsEl.appendChild(row);
  });

  var modalFlags = document.getElementById('modal-flags');
  if (doc.flags.length > 0) {
    var div = document.createElement('div');
    div.style.borderTop = '1px solid rgba(26,26,24,0.2)';
    div.style.paddingTop = '8px';
    doc.flags.forEach(function(f) {
      var span = document.createElement('span');
      span.className = 'field-flag';
      span.textContent = 'CLASS ' + f.type + ' VIOLATION: ' + f.note;
      div.appendChild(span);
    });
    modalFlags.innerHTML = '';
    modalFlags.appendChild(div);
  } else {
    modalFlags.innerHTML = '';
  }

  var modal = document.getElementById('doc-modal');
  modal.classList.add('open', 'doc-holding');
  document.body.classList.add('doc-inspecting');
}

function closeModal() {
  var modal = document.getElementById('doc-modal');
  modal.classList.remove('open', 'doc-holding');
  document.body.classList.remove('doc-inspecting');
}



function pushMemory(line) {
  if (!line) return;
  if (!state.memoryBeats) state.memoryBeats = [];
  if (state.memoryBeats.indexOf(line) === -1) state.memoryBeats.push(line);
  if (state.memoryBeats.length > 24) state.memoryBeats = state.memoryBeats.slice(-24);
}

function rememberFlag(flag) {
  if (!flag) return;
  var map = {
    took_bribe: 'An envelope stayed on the desk. Money changed the air.',
    reported_bribe: 'You sent a man to Internal Affairs for an envelope.',
    mama_chioma_detained: 'Mama Chioma was taken. The market women still ask where she went.',
    mama_chioma_asset: 'You made a courier of a woman who only wanted to survive.',
    mama_chioma_turned: 'You became the contact. Two masters. One stamp.',
    mama_chioma_warned: 'You warned her and looked away. Warning is not protection.',
    enforced_021: 'You redirected your own people under Bulletin 021 without explanation.',
    defied_021: 'You refused Bulletin 021 once. The log remembers either way.',
    objected_021: 'You objected in writing. Paper outlived the war.',
    signed_final_log: 'On the last day you signed your full name. No initials to hide behind.',
    unsigned_final_log: 'On the last day the signature line stayed blank.',
    family_collapsed: 'The household collapsed before the front did.',
    family_death: 'There was a death that food would have prevented.',
    child_or_dependant_sent_away: 'Someone was sent inland with a bundle and no ceremony.',
    evicted: 'The landlord came with men. A door stopped belonging to you.',
    suspected_collaborator: 'Someone wrote collaborator in a margin that was not yours.',
    pattern_of_breaches: 'The breaches at your window formed a pattern Headquarters could read.',
    harsh_booth: 'You detained the clean as if fear were a kind of correctness.',
    generator_approved: 'In the dark of the generator failure, you chose heat over certainty.',
    generator_denied: 'In the dark, you chose the bulletin over the child.',
    kept_private_list: 'You memorised a list that was never supposed to be written.',
    reported_rumour_list: 'You reported the whisper about Eastern names.',
    bent_fuel_rule: 'A fuel receipt was illegible. You let the lorry go anyway.',
    read_the_flight_doc: 'You read what HQ said not to read.',
    bg_soldier_spared_boy: 'A boy with army boots under civilian polish walked free.',
    bg_teacher_bent_rule: 'A school register became a kind of passport at your window.',
    bg_clergy_absolved: 'A man asked for absolution. You gave him the road.',
    bg_press_let_camera: 'A camera left your booth undeclared. The world might see what you saw.',
    bg_home_strict: 'A face from home got the same bulletin as a stranger.',
    bg_home_bent: 'A face from home found a lawful crack in the rules.',
  };
  if (map[flag]) pushMemory(map[flag]);
}

// ── AXIS / PAY BALANCE (v1.15) ──
// Soft-cap axes so 25 days of correct stamps do not produce loyalty 300+.
// Endings still use thresholds ~7–15; cap 20 keeps them meaningful.
var AXIS_SOFT = 12;
var AXIS_HARD = 20;
function addAxis(key, delta) {
  if (!delta || !state.axes) return;
  var cur = state.axes[key] || 0;
  var d = delta;
  if (d > 0) {
    if (cur >= AXIS_HARD) return;
    if (cur >= AXIS_SOFT) d = Math.max(1, Math.ceil(d / 2));
    if (cur + d > AXIS_HARD) d = AXIS_HARD - cur;
  }
  state.axes[key] = Math.max(0, cur + d);
}

// ── DECISIONS ──
function travellerLooksForged(t) {
  if (!t) return false;
  if (t.correct === 'detain' || t.correct === 'deny') {
    // Wrongly approving a should-detain/deny is the classic infiltration path
    return true;
  }
  var flags = t.flags;
  if (!flags) return false;
  if (Array.isArray(flags)) {
    return flags.some(function (f) {
      var s = (typeof f === 'string' ? f : (f && (f.note || f.field || ''))) + '';
      return /forged|fake|fraud|mismatch|unlisted|counterfeit|false/i.test(s);
    });
  }
  if (flags.forged) return true;
  return false;
}

function decide(action) {
  // Guard against double-taps during stamp animation (each stamp advances traveller)
  if (state._deciding) return;
  var t = state.currentTraveller;
  if (!t) return;
  state._deciding = true;

  if (!audioCtx) initAudio();
  playStamp(action);
  showStamp(action);

  var correct = t.correct === action;
  var payChange = 0;
  if (action === 'approve') { state.dayApproved++; state.careerApproved = (state.careerApproved || 0) + 1; }
  else if (action === 'deny') { state.dayDenied++; state.careerDenied = (state.careerDenied || 0) + 1; }
  else if (action === 'detain') { state.dayDetained++; state.careerDetained = (state.careerDetained || 0) + 1; }

  // Pay: modest rewards, painful errors (loners no longer mint a fortune)
  if (correct && action === 'detain') payChange = 320;
  else if (correct && action === 'deny') payChange = 40;
  else if (correct && action === 'approve') payChange = 15;
  else if (!correct) payChange = -1400;

  state.totalPay += payChange;
  if (!correct) state.totalErrors = (state.totalErrors || 0) + 1;

  // Espionage / infiltration: wave through someone who should not pass
  if (!correct && action === 'approve' && travellerLooksForged(t)) {
    state.infiltrationCount = (state.infiltrationCount || 0) + 1;
    state.suspicion = (state.suspicion || 0) + 2;
    state.flags.last_infiltration_name = t.name || 'Unknown';
    if (state.infiltrationCount >= 3) { state.flags.pattern_of_breaches = true; rememberFlag('pattern_of_breaches'); }
    if (state.infiltrationCount >= 5) { state.flags.suspected_collaborator = true; rememberFlag('suspected_collaborator'); }
  }
  // Over-detention of clean civilians breeds fear — not loyalty points
  if (!correct && action === 'detain') {
    state.suspicion = (state.suspicion || 0) + 1;
    state.flags.harsh_booth = true;
    rememberFlag('harsh_booth');
    addAxis('loyalty', -1);
  }

  // Axis changes (capped) — stamp work is thin signal; morals carry the story
  if (t.axisHint === 'compassion') {
    if (action === 'approve') addAxis('compassion', 1);
    else addAxis('loyalty', 1);
  } else if (t.axisHint === 'loyalty') {
    if (action === 'detain') addAxis('loyalty', 1);
    else if (action === 'approve') addAxis('loyalty', -1);
  } else if (t.axisHint === 'witness') {
    if (action === 'detain') addAxis('witness', 1);
  } else if (t.axisHint === 'rebellion') {
    if (action === 'approve') addAxis('rebellion', 1);
  }

  state.dayResults.push({ name: t.name, action: action, correct: correct, payChange: payChange });
  state.traveller++;
  try { saveState(); } catch (_) {}

  setTimeout(function() {
    clearStamp();
    state._deciding = false;
    // Check if a moral event should fire at mid-day
    var midpoint = Math.floor(state.totalTravellers / 2);
    var morEvent = getMoralEventForDay(state.day);
    if (morEvent && state.moralFiredDays.indexOf(state.day) === -1 && state.traveller === midpoint) {
      fireMoralEvent(morEvent);
    } else {
      loadNextTraveller();
    }
  }, 700);
}

function showStamp(action) {
  var mark = document.getElementById('stamp-mark');
  mark.className = 'stamp-mark ' + action;
  mark.textContent = action.toUpperCase();
  setTimeout(function() { mark.classList.add('show'); }, 50);
}

function clearStamp() {
  var mark = document.getElementById('stamp-mark');
  mark.classList.remove('show');
}

// ── MORAL EVENTS ──
function fireMoralEvent(event) {
  // Mark as fired BEFORE showing to prevent double-fire
  if (state.moralFiredDays.indexOf(event.day) !== -1) {
    loadNextTraveller();
    return;
  }
  state.moralFiredDays.push(event.day);

  document.getElementById('moral-text').textContent = event.text;

  var choicesEl = document.getElementById('moral-choices');
  choicesEl.innerHTML = '';

  // ── FIX: build buttons programmatically — NO JSON.stringify in onclick ──
  event.choices.forEach(function(choice, idx) {
    var btn = document.createElement('button');
    btn.className = 'moral-choice';

    var numSpan = document.createElement('span');
    numSpan.className = 'moral-choice-num';
    numSpan.textContent = String(idx + 1);
    btn.appendChild(numSpan);
    btn.appendChild(document.createTextNode(choice.text));

    // ── FIX: closure captures correct variables ──
    (function(c) {
      btn.addEventListener('click', function() { if (typeof window.chooseMoral==='function') window.chooseMoral(c); else chooseMoral(c); });
    })(choice);

    choicesEl.appendChild(btn);
  });

  showScreen('moral-event');
}

function chooseMoral(choice) {
  if (choice.axes) {
    Object.keys(choice.axes).forEach(function(k) {
      addAxis(k, choice.axes[k]);
    });
  }
  if (choice.flag) { state.flags[choice.flag] = true; rememberFlag(choice.flag); }
  saveState();
  showScreen('game');
  setTimeout(function() { loadNextTraveller(); }, 300);
}

// ── HOUSEHOLD PRESSURE (from registration) ──
function getFamilyPressure() {
  var id = state.player && state.player.family;
  var pools = [FAMILY_MALE, FAMILY_FEMALE];
  for (var p = 0; p < pools.length; p++) {
    for (var i = 0; i < pools[p].length; i++) {
      if (pools[p][i].id === id) return pools[p][i].pressure || 0;
    }
  }
  return state.family ? Math.max(0, state.family.length - 1) : 0;
}

function livingFamily() {
  return (state.family || []).filter(function (f) {
    return f.status !== 'gone' && f.status !== 'dead';
  });
}

function pickLivingMember(preferRoles) {
  var living = livingFamily();
  if (!living.length) return null;
  if (preferRoles && preferRoles.length) {
    for (var r = 0; r < preferRoles.length; r++) {
      for (var i = 0; i < living.length; i++) {
        if (living[i].role === preferRoles[r]) return living[i];
      }
    }
  }
  return living[living.length - 1];
}

function backgroundHomePhrase() {
  var bg = (state.player && state.player.background) || '';
  var st = (state.player && state.player.state) || 'home';
  var map = {
    civil: 'the civil-service compound',
    soldier: 'the barracks widow lines',
    teacher: 'the school staff quarters',
    nysc: 'the corps lodge',
    tech: 'the room you took near the exchange',
    ngo: 'the mission house',
    clergy: 'the parish room',
    trader: 'the market stall room',
    journalist: 'the press hostel',
    pastor: 'the church boy\'s room',
    redcross: 'the dressing station',
    lecturer: 'the faculty bungalow that is no longer standing',
    railway: 'the railway quarters',
  };
  return (map[bg] || 'the house') + ' in ' + st;
}

// ── END OF DAY ──
// Single wartime ledger: pay packet → food → rent → consequences.
// Missing bills is not a toast — it is hunger, shame, flight, and sometimes death.
function endOfDay(opts) {
  opts = opts || {};
  var replay = (opts === true) || !!(opts && opts.replay);
  state.__billsEngineV15 = true;
  state._resumePhase = 'eod';

  var nightEvent = null;
  for (var i = 0; i < NIGHT_EVENTS.length; i++) {
    if (NIGHT_EVENTS[i].day === state.day) { nightEvent = NIGHT_EVENTS[i]; break; }
  }

  var pressure, mouths, foodCost, rentCost, totalExpenses, baseDaily, wagePenalty, suspicionDock;
  var canAfford, familyReport, crisisNote, intelLine, warWeek, foodPerMouth, inflation;
  if (!replay) {
  pressure = getFamilyPressure();
  state.familyPressure = pressure;
  var mouths = Math.max(1, livingFamily().length + (pressure > 3 ? 1 : 0));

  // Inflation: war week by week, not a rounding error
  // Tuned so careful mid-size households can eat; large households + errors still break bones.
  var warWeek = Math.floor((state.day - 1) / 7);
  var foodPerMouth = 900 + warWeek * 280 + Math.floor(state.day * 35);
  var foodCost = mouths * foodPerMouth;
  // Extended household / many children: garri, medicine, "settling" men at the gate
  foodCost += pressure * 320;
  var rentCost = 1800 + warWeek * 420 + pressure * 200;
  // Block rent if already evicted / gone household
  if (state.flags.evicted || state.flags.family_collapsed) rentCost = 0;

  var totalExpenses = foodCost + rentCost;
  var baseDaily = 6000;
  // Errors already cut totalPay during the day; grade pay still arrives
  var wagePenalty = state.wagePenaltyNextDay || 0;
  state.wagePenaltyNextDay = 0;
  if (wagePenalty > 0) baseDaily = Math.max(0, baseDaily - wagePenalty);

  // Suspicion: Internal Affairs quietly docks "cooperation"
  var suspicionDock = 0;
  if ((state.suspicion || 0) >= 6) {
    suspicionDock = 800 + (state.suspicion - 5) * 200;
  }

  state.totalPay += baseDaily;
  if (suspicionDock > 0) state.totalPay -= suspicionDock;

  var canAfford = state.totalPay >= totalExpenses;
  var familyReport = '';
  var crisisNote = '';

  if (canAfford) {
    state.totalPay -= totalExpenses;
    state.billsPaidTotal = (state.billsPaidTotal || 0) + 1;
    // Recovery is slow — one good night does not erase a week of hunger
    if ((state.missedBillsStreak || 0) > 0) {
      state.missedBillsStreak = Math.max(0, state.missedBillsStreak - 1);
      familyReport = 'You paid food and rent. The pot has something in it. The landlord counted twice and left. Hunger still sits in the corners of the house like a visitor who was not fully shown out.';
      livingFamily().forEach(function (f) {
        if (f.status === 'hungry') f.status = 'ok';
        else if (f.status === 'ill') f.status = 'hungry';
      });
    } else {
      livingFamily().forEach(function (f) {
        if (f.status === 'hungry' || f.status === 'ill') f.status = 'ok';
      });
      familyReport = 'Rice. Palm oil. The rent envelope was full enough. For one night the house sounds like a house, not a waiting room. Tomorrow the queue begins again.';
    }
  } else {
    // Cannot meet the day — war does not negotiate
    state.missedBillsStreak = (state.missedBillsStreak || 0) + 1;
    state.billsMissedTotal = (state.billsMissedTotal || 0) + 1;
    state.axes.survival = Math.max(0, (state.axes.survival || 0) - 1);
    state.axes.compassion = Math.max(0, (state.axes.compassion || 0) - (pressure >= 3 ? 1 : 0));

    // Drain whatever is left — empty pockets are the story
    state.totalPay = 0;

    var streak = state.missedBillsStreak;
    var member;

    if (streak === 1) {
      livingFamily().forEach(function (f) { f.status = 'hungry'; });
      familyReport = 'The pot is empty before night prayer. You scrape the bottom as if scrapings were a plan. Nobody accuses you. Accusation would require energy. At ' + backgroundHomePhrase() + ', sleep is thinner than the mat.';
      crisisNote = 'FIRST MISS — HUNGER';
    } else if (streak === 2) {
      livingFamily().forEach(function (f) { f.status = f.status === 'gone' ? 'gone' : 'hungry'; });
      member = pickLivingMember(['child', 'partner', 'parent', 'self']);
      if (member) member.status = 'ill';
      state.wagePenaltyNextDay = 1500;
      state.axes.survival = Math.max(0, state.axes.survival - 1);
      familyReport = 'Second night without a full pot. Someone is fever-warm. The neighbour\'s pot lid is louder than kindness. You promise the market tomorrow. Promises are the currency of people who have spent their pay packet on stamps for strangers.';
      crisisNote = 'SECOND MISS — ILLNESS · WAGE PENALTY TOMORROW';
    } else if (streak === 3) {
      member = pickLivingMember(['child', 'parent', 'partner']);
      if (member && member.role !== 'self') {
        member.status = 'gone';
        state.flags.child_or_dependant_sent_away = true; rememberFlag('child_or_dependant_sent_away');
        familyReport = 'You send ' + (member.role === 'child' ? 'the child' : 'one of your people') + ' to the village before the road is cut. There is no ceremony — only a bundle and a look that will outlive the war. The house is quieter. Quiet is not peace.';
      } else {
        livingFamily().forEach(function (f) { f.status = 'ill'; });
        familyReport = 'There is no one left to send away and nowhere safe to send them. The walls know your name. So does hunger.';
      }
      state.axes.survival = Math.max(0, state.axes.survival - 2);
      state.suspicion = (state.suspicion || 0) + 1;
      crisisNote = 'THIRD MISS — SOMEONE LEAVES THE HOUSE';
    } else if (streak === 4) {
      member = pickLivingMember(['partner', 'parent', 'child', 'self']);
      if (member) {
        member.status = 'dead';
        state.flags.family_death = true; rememberFlag('family_death');
      }
      state.axes.survival = Math.max(0, state.axes.survival - 2);
      state.axes.loyalty = Math.max(0, (state.axes.loyalty || 0) - 1);
      state.axes.rebellion = (state.axes.rebellion || 0) + 1;
      familyReport = 'A preventable death is still a death. There is no tribunal for empty pots — only a grave that will not wait for your leave form. You stamp papers in the morning with a hand that knows what paper cannot buy.';
      crisisNote = 'FOURTH MISS — DEATH IN THE HOUSE';
    } else {
      state.flags.family_collapsed = true;
      state.flags.evicted = true;
      rememberFlag('family_collapsed');
      rememberFlag('evicted');
      livingFamily().forEach(function (f) { if (f.status !== 'dead') f.status = 'gone'; });
      state.axes.survival = Math.max(0, state.axes.survival - 3);
      familyReport = 'The landlord does not knock. He arrives with two men and the kind of patience that has already decided. Your things fit in less than you believed. You are still an officer at dawn. At night you are a person without a door.';
      crisisNote = 'HOUSEHOLD COLLAPSED — EVICTION';
      // Soft-lock toward bitter endings
      state.flags.must_face_ruin = true;
    }
  }

  // Extra inflation bleed on top of scaled food/rent (scarce goods)
  var inflation = 0;
  if (state.day >= 10) {
    inflation = Math.floor((state.day - 9) * 120);
    state.totalPay = Math.max(0, state.totalPay - inflation);
  }
  if (state.totalPay < 0) state.totalPay = 0;

  // Infiltration after-action: the war remembers careless stamps
  var intelLine = '';
  if ((state.infiltrationCount || 0) > 0 && state.dayResults.some(function (r) { return !r.correct && r.action === 'approve'; })) {
    intelLine = 'A sealed note reaches the post after dark: a face you cleared was seen again where no civilian should walk. Suspicion at the booth: ' + (state.suspicion || 0) + '. Breaches logged: ' + state.infiltrationCount + '.';
    if (state.flags.suspected_collaborator) {
      intelLine += ' Someone has written the word collaborator in a margin that is not yours.';
      state.axes.loyalty = Math.max(0, (state.axes.loyalty || 0) - 1);
    }
  }


    // Keep patch reintegration fields in sync with engine household ledger
    state.rentMissedTotal = state.billsMissedTotal || 0;
    state.rentMissedStreak = state.missedBillsStreak || 0;
  // Persist report for safe CONTINUE from end-of-day screen
  state.lastBillReport = {
    canAfford: canAfford,
    streak: state.missedBillsStreak,
    foodCost: foodCost,
    rentCost: rentCost,
    familyReport: familyReport,
    crisisNote: crisisNote,
    intelLine: intelLine,
    baseDaily: baseDaily,
    wagePenalty: wagePenalty,
    suspicionDock: suspicionDock,
    inflation: inflation,
    mouths: mouths,
    warWeek: warWeek
  };
  } else {
    // Replay from save: restore display fields only
    var br = state.lastBillReport || {};
    canAfford = !!br.canAfford;
    familyReport = br.familyReport || '';
    crisisNote = br.crisisNote || '';
    intelLine = br.intelLine || '';
    foodCost = br.foodCost || 0;
    rentCost = br.rentCost || 0;
    baseDaily = br.baseDaily || 0;
    wagePenalty = br.wagePenalty || 0;
    suspicionDock = br.suspicionDock || 0;
    inflation = br.inflation || 0;
    mouths = br.mouths || 1;
    warWeek = br.warWeek || 0;
    pressure = state.familyPressure || 0;
  }

  // Build pay breakdown
  var breakdown = document.getElementById('eod-pay-breakdown');
  var html = '<div class="eod-pay-row"><span>DAY PAY PACKET (GRADE 8)</span><span>' + formatNotes(baseDaily) + '</span></div>';
  if (wagePenalty > 0) {
    html += '<div class="eod-pay-row deduction"><span>PRIOR PENALTY (ERRORS / HUNGER)</span><span>−' + formatNotes(wagePenalty) + '</span></div>';
  }
  if (suspicionDock > 0) {
    html += '<div class="eod-pay-row deduction"><span>INTERNAL AFFAIRS — \"COOPERATION\"</span><span>−' + formatNotes(suspicionDock) + '</span></div>';
  }
  state.dayResults.forEach(function(r) {
    if (r.payChange !== 0) {
      var cls = r.payChange > 0 ? 'bonus' : 'deduction';
      var label = r.correct
        ? (r.action === 'detain' ? '✓ CORRECT DETENTION' : '✓ CORRECT DENIAL')
        : '✗ WRONG STAMP';
      var sign = r.payChange > 0 ? '+' : '−';
      html += '<div class="eod-pay-row ' + cls + '"><span>' + label + ': ' + (r.name || '').split(' ')[0] + '</span><span>' + formatNotesSigned(r.payChange) + '</span></div>';
    }
  });
  html += '<div class="eod-pay-row deduction"><span>FOOD (' + mouths + ' mouths · war week ' + (warWeek + 1) + ')</span><span>−' + formatNotes(foodCost) + '</span></div>';
  if (rentCost > 0) {
    html += '<div class="eod-pay-row deduction"><span>RENT / COMPOUND DUES</span><span>−' + formatNotes(rentCost) + '</span></div>';
  }
  if (inflation > 0) {
    html += '<div class="eod-pay-row deduction"><span>SCARCITY / BLACK-MARKET DRIFT</span><span>−' + formatNotes(inflation) + '</span></div>';
  }
  if (!canAfford) {
    html += '<div class="eod-pay-row deduction"><span>UNPAID — HOUSEHOLD SHORTFALL</span><span>STREAK ' + state.missedBillsStreak + '</span></div>';
  }
  html += '<div class="eod-pay-row total"><span>RUNNING BALANCE</span><span>' + formatNotes(state.totalPay) + '</span></div>';
  breakdown.innerHTML = html;

  document.getElementById('eod-approved').textContent  = state.dayApproved;
  document.getElementById('eod-denied').textContent    = state.dayDenied;
  document.getElementById('eod-detained').textContent  = state.dayDetained;
  document.getElementById('eod-title').textContent     = 'DAY ' + state.day + ' COMPLETE';

  var familyEl = document.getElementById('eod-family');
  var titleExtra = crisisNote ? ' · ' + crisisNote : '';
  familyEl.innerHTML =
    '<div class="eod-family-title">FAMILY / HOUSEHOLD' + titleExtra + '</div>' +
    '<div class="eod-family-text">' + familyReport + '</div>' +
    (intelLine ? '<div class="eod-family-text" style="margin-top:10px;border-top:1px solid rgba(212,160,23,0.35);padding-top:10px;color:#D4A017">' + intelLine + '</div>' : '');

  // Night: prefer bill-crisis voice when streak is hot
  var nightText = nightEvent ? nightEvent.text : '';
  if (!canAfford && (state.missedBillsStreak || 0) >= 2) {
    nightText = (nightText ? nightText + ' ' : '') +
      'You lie awake calculating stamps into yams. The arithmetic never becomes food.';
  }
  document.getElementById('eod-night').textContent = nightText;
  document.getElementById('btn-next-day').textContent = state.day >= 25 ? 'FINAL REPORT →' : 'DAY ' + (state.day + 1) + ' →';

  updateFamilyBar();

  saveState();
  showScreen('eod-report');
}

function nextDay() {
  if (state.day >= 25) { calculateEnding(); return; }
  state.day++;
  startDay();
}

// ── ENDING ──
function calculateEnding() {
  var ending = null;
  // Household ruin and collaboration outrank soft "ordinary" outcomes — the war is not fair, but it is ordered
  var priority = ['collaborator_dawn', 'empty_pot', 'landlord_war', 'executed', 'disappeared', 'burned'];
  for (var p = 0; p < priority.length; p++) {
    var pe = ENDINGS.find(function(e){ return e.id === priority[p]; });
    if (pe && pe.condition(state)) { ending = pe; break; }
  }
  if (!ending) {
    for (var i = 0; i < ENDINGS.length; i++) {
      if (ENDINGS[i].condition(state)) { ending = ENDINGS[i]; break; }
    }
  }
  if (!ending) ending = ENDINGS.find(function(e){ return e.id === 'ordinary_man'; }) || ENDINGS[ENDINGS.length-1];

  if (state.endingsUnlocked.indexOf(ending.id) === -1) {
    state.endingsUnlocked.push(ending.id);
  }
  saveState();
  if (typeof window.showEndingScreen === "function") window.showEndingScreen(ending);
  else showEndingScreen(ending);
}

function bgLabel(id) {
  var b = BACKGROUNDS.find(function(x){ return x.id === id; });
  return b ? b.label : (id || 'UNRECORDED');
}

function axisReading(k, v) {
  v = v || 0;
  var lines = {
    loyalty: v >= 14 ? 'You treated the bulletin as scripture.' : v >= 8 ? 'You believed order would keep people alive.' : v >= 4 ? 'Duty and doubt shared the same desk.' : 'The Republic did not own your hand.',
    compassion: v >= 12 ? 'You saw faces before papers. That is not always mercy.' : v >= 6 ? 'You bent when the queue became human.' : v >= 3 ? 'Pity visited. It did not move in.' : 'You learned not to look too long.',
    rebellion: v >= 10 ? 'You built a second law under the first.' : v >= 5 ? 'You disobeyed carefully.' : v >= 2 ? 'A few stamps argued with Headquarters.' : 'You rarely crossed the written line.',
    survival: v >= 10 ? 'You kept a household breathing when the map burned.' : v >= 5 ? 'You counted rice as carefully as stamps.' : v >= 2 ? 'You felt hunger as a kind of clock.' : 'Survival was a theory, not a practice.',
    witness: v >= 12 ? 'You kept a private archive of what the war did at windows.' : v >= 6 ? 'You noticed. Sometimes you wrote it down.' : v >= 3 ? 'Memory snagged on a few names.' : 'You tried not to become a witness.',
    corruption: v >= 8 ? 'Money and favours learned your booth number.' : v >= 4 ? 'You took what the war offered, once or twice.' : v >= 1 ? 'A stain is still a stain.' : 'Your hands stayed empty of envelopes.',
  };
  return lines[k] || '';
}

function buildAssessment(ending) {
  var p = state.player || {};
  var name = p.name || 'UNKNOWN OFFICER';
  var days = state.day || 25;
  var ap = state.careerApproved || 0;
  var de = state.careerDenied || 0;
  var dt = state.careerDetained || 0;
  var total = ap + de + dt;
  var err = state.totalErrors || 0;
  var acc = total ? Math.round(((total - err) / total) * 100) : 0;
  var fileNo = 'FIBA/OG-E/' + String(1967 + Math.floor(days / 12)) + '/' + String(1000 + (name.length * 37 + days * 13) % 9000);

  var famBits = (state.family || []).map(function(f) {
    var st = f.status || 'ok';
    var label = f.role || 'person';
    if (st === 'ok') return label + ' — present';
    if (st === 'hungry') return label + ' — hungry';
    if (st === 'ill') return label + ' — ill';
    if (st === 'gone') return label + ' — sent away / missing from the house';
    if (st === 'dead') return label + ' — dead (household ledger)';
    return label + ' — ' + st;
  });
  if (!famBits.length) famBits = ['No dependants registered — or none left to name.'];

  var incidents = (state.memoryBeats || []).slice();
  // Seed from flags if memory empty (older saves)
  if (!incidents.length && state.flags) {
    Object.keys(state.flags).forEach(function(k) {
      if (state.flags[k]) rememberFlag(k);
    });
    incidents = (state.memoryBeats || []).slice();
  }
  if ((state.infiltrationCount || 0) > 0) {
    incidents.push('Breaches logged at the window: ' + state.infiltrationCount + '. Suspicion index: ' + (state.suspicion || 0) + '.');
  }
  if ((state.billsMissedTotal || 0) > 0) {
    incidents.push('Household shortfalls across the posting: ' + state.billsMissedTotal + ' nights the pot or the rent failed.');
  }
  if (!incidents.length) {
    incidents.push('The file is thin on drama. That is also a kind of story — the ordinary violence of correct stamps.');
  }

  var scarLines = [];
  Object.keys(state.axes || {}).forEach(function(k) {
    var v = state.axes[k] || 0;
    if (v <= 0) return;
    var read = axisReading(k, v);
    if (read) scarLines.push('<div class="assess-scar"><span class="assess-scar-k">' + k.toUpperCase() + ' · ' + v + '</span><span class="assess-scar-v">' + read + '</span></div>');
  });

  var history = 'Between 1967 and 1970 the Nigerian Civil War turned bridges, markets, and border posts into places where a signature could feed a family or end one. Checkpoint officers were not generals. They were clerks with power over movement — and movement was life. What you did at Ogoja-East is a small window on a large grief: papers against hunger, loyalty against kinship, the Federal bulletin against the face in front of you. Those who were not yet born may still inherit the silence around these desks. This assessment is one way of refusing that silence.';

  var html = '';
  html += '<div class="assess-dossier">';
  html += '<div class="assess-mast">FEDERAL MINISTRY OF IDENTITY &amp; BORDER AUTHORITY</div>';
  html += '<div class="assess-sub">FINAL POSTING ASSESSMENT · CHECKPOINT OGOJA-EAST</div>';
  html += '<div class="assess-file">FILE ' + fileNo + ' · CLASSIFICATION: RESTRICTED · DAYS ON STATION: ' + days + '</div>';

  html += '<div class="assess-verdict-tag">VERDICT CLASSIFICATION</div>';
  html += '<h1 class="assess-title">' + ending.title + '</h1>';
  html += '<div class="assess-lede">' + ending.text + '</div>';

  html += '<section class="assess-sec"><h2>I · OFFICER OF RECORD</h2>';
  html += '<p><strong>' + name + '</strong>, posted from <strong>' + (p.state || '—') + '</strong>.</p>';
  html += '<p>Prior life: <strong>' + bgLabel(p.background) + '</strong>. Household registration: <strong>' + (p.family || 'unrecorded') + '</strong>.</p>';
  html += '<p class="assess-quiet">The war does not ask who you were. The queue will still smell of who you became.</p></section>';

  html += '<section class="assess-sec"><h2>II · SERVICE RECORD</h2>';
  html += '<div class="assess-stats">';
  html += '<div><b>' + ap + '</b><span>Approved</span></div>';
  html += '<div><b>' + de + '</b><span>Denied</span></div>';
  html += '<div><b>' + dt + '</b><span>Detained</span></div>';
  html += '<div><b>' + err + '</b><span>Errors logged</span></div>';
  html += '<div><b>' + (total ? acc + '%' : '—') + '</b><span>Rough accuracy</span></div>';
  html += '<div><b>' + formatNotes(state.totalPay || 0) + '</b><span>Closing balance</span></div>';
  html += '</div>';
  html += '<p class="assess-quiet">Numbers are not innocence. They are only what the log could hold.</p></section>';

  html += '<section class="assess-sec"><h2>III · HOUSEHOLD CONSEQUENCES</h2>';
  html += '<ul class="assess-list">' + famBits.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>';
  if ((state.billsMissedTotal || 0) === 0) {
    html += '<p>The pot did not empty on your watch. That is a quieter victory than any commendation.</p>';
  } else {
    html += '<p>The ledger of hunger is not a footnote. It is the part of the war that entered the house without a permit.</p>';
  }
  html += '</section>';

  html += '<section class="assess-sec"><h2>IV · INCIDENTS &amp; SCARS</h2>';
  html += '<ul class="assess-list assess-mem">' + incidents.slice(0, 12).map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>';
  if (scarLines.length) {
    html += '<div class="assess-scars">' + scarLines.join('') + '</div>';
  }
  html += '</section>';

  html += '<section class="assess-sec assess-history"><h2>V · FOR THOSE WHO WERE NOT THERE</h2>';
  html += '<p>' + history + '</p>';
  html += '<p class="assess-close">Remember: the desk is ordinary. The choices were not. If this file troubles you, it has done part of its work.</p></section>';

  html += '<div class="assess-footer">Case files unlocked: ' + (state.endingsUnlocked || []).length + ' of ' + ENDINGS.length + ' · Assessment closed at end of posting</div>';
  html += '</div>';
  return html;
}

function showEndingScreen(ending) {
  var content = document.querySelector('#ending .ending-content') || document.getElementById('ending');
  if (!content) return;

  // Hide legacy title stack; dossier replaces the story body
  var enEl = document.getElementById('ending-number');
  if (enEl) enEl.style.display = 'none';
  var titleEl = document.getElementById('ending-title');
  var textEl = document.getElementById('ending-text');
  var axesEl = document.getElementById('ending-axes');
  var unEl = document.getElementById('endings-unlocked');
  if (titleEl) titleEl.style.display = 'none';
  if (textEl) textEl.style.display = 'none';
  if (axesEl) axesEl.style.display = 'none';
  if (unEl) unEl.style.display = 'none';

  var host = document.getElementById('ending-assessment');
  if (!host) {
    host = document.createElement('div');
    host.id = 'ending-assessment';
    var btn = document.getElementById('btn-return-splash');
    if (btn && btn.parentNode) btn.parentNode.insertBefore(host, btn);
    else content.appendChild(host);
  }
  host.innerHTML = buildAssessment(ending);
  host.style.display = 'block';

  var ret = document.getElementById('btn-return-splash');
  if (ret) ret.textContent = 'CLOSE THE FILE';

  showScreen('ending');
  try {
    var endScreen = document.getElementById('ending');
    if (endScreen) endScreen.scrollTop = 0;
    if (host) host.scrollTop = 0;
  } catch (_) {}
}

// ── HUD ──
function updateHUD() {
  document.getElementById('hud-day').textContent  = String(state.day).padStart(2,'0');
  document.getElementById('hud-queue').textContent = 'TRAVELLER ' + (state.traveller + 1) + ' OF ' + state.totalTravellers;
  document.getElementById('hud-pay').textContent  = formatNotes(Math.max(0, state.totalPay));
  var rate = state.exchangeRate;
  document.getElementById('hud-rate').innerHTML   = '₤B / notes ' + rate.toFixed(2) + ' ' + (rate < 1.0 ? '↓' : '↔') + ' <span class="save-dot"></span>';
  updateQueueDots();
}

function updateQueueDots() {
  var container = document.getElementById('queue-dots');
  container.innerHTML = '';
  for (var i = 0; i < state.totalTravellers; i++) {
    var dot = document.createElement('div');
    dot.className = 'queue-dot ' + (i < state.traveller ? 'done' : i === state.traveller ? 'current' : 'pending');
    container.appendChild(dot);
  }
}

function updateFamilyBar() {
  var bar = document.getElementById('family-bar');
  if (!bar) return;
  bar.innerHTML = '';
  (state.family || []).forEach(function(f) {
    var icon = document.createElement('div');
    var st = f.status || 'ok';
    icon.className = 'family-icon' + (st !== 'ok' ? ' ' + st : '');
    icon.title = f.role + ': ' + st;
    icon.textContent = st === 'gone' ? '·' : (st === 'dead' ? '✕' : f.icon);
    bar.appendChild(icon);
  });
}

function updateRateWidget() {
  var widget = document.getElementById('rate-widget');
  if (state.day >= 4) {
    widget.style.display = 'block';
    var val = document.getElementById('rate-val');
    val.textContent = state.exchangeRate.toFixed(2) + (state.exchangeRate < 0.6 ? ' ↓' : ' ↔');
    val.className = 'rate-value' + (state.exchangeRate < 0.6 ? ' falling' : '');
  } else {
    widget.style.display = 'none';
  }
}


// ── MONEY DISPLAY (period notes — abstract units, not 1973 naira) ──
// Game economy is "federal notes" / pay-packet units. Biafran notes trade against them.
function formatNotes(n) {
  var v = Math.max(0, Math.round(Number(n) || 0));
  return v.toLocaleString() + ' notes';
}
function formatNotesSigned(n) {
  var v = Math.round(Number(n) || 0);
  var abs = Math.abs(v).toLocaleString() + ' notes';
  if (v > 0) return '+' + abs;
  if (v < 0) return '−' + abs;
  return abs;
}
function migrateFlags(flags) {
  if (!flags) return {};
  // Old internal flag names → period names (keeps endings working for old saves)
  if (flags.has_whatsapp_screenshot && !flags.kept_private_list) flags.kept_private_list = true;
  if (flags.reported_whatsapp && !flags.reported_rumour_list) flags.reported_rumour_list = true;
  return flags;
}

// ── SAVE / LOAD ──
var SAVE_KEY = 'cb_save_v1';

function saveState() {
  try {
    // Strip non-serialisable runtime only if any
    if (state) state.flags = migrateFlags(state.flags || {});
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) {}
}

function hasResumableSave(saved) {
  if (!saved || !saved.day) return false;
  if (saved.player && saved.player.name) return true;
  if (saved.day > 1) return true;
  if ((saved.traveller || 0) > 0) return true;
  return false;
}

function resumeBooth() {
  // Mid-day: back to the window without resetting the queue
  state._resumePhase = 'booth';
  state._deciding = false;
  showScreen('game');
  updateHUD();
  updateFamilyBar();
  updateRateWidget();
  if (!state.dayTravellers || !state.dayTravellers.length) {
    state.dayTravellers = buildTravellerList(state.day, state.totalTravellers || 8);
  }
  // Re-render current traveller (do not advance index)
  var list = state.dayTravellers;
  var idx = Math.min(state.traveller || 0, Math.max(0, list.length - 1));
  var t = list[idx];
  if (t) {
    try {
      if (window.__pickFreshName && !t._resumedName) {
        // Keep saved name if present on state
        if (state.currentTraveller && state.currentTraveller.name) {
          t = Object.assign({}, t, { name: state.currentTraveller.name, _resumedName: true });
        }
      }
    } catch (_) {}
    state.currentTraveller = state.currentTraveller && state.currentTraveller.name
      ? state.currentTraveller
      : t;
    renderTraveller(state.currentTraveller);
    renderDocs(state.currentTraveller);
  } else {
    loadNextTraveller();
  }
  updateQueueDots();
  saveState();
}

function loadSavedGame() {
  try {
    var saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!hasResumableSave(saved)) return;
    state = saved;
    // Re-ensure fields on older saves
    if (!state.moralFiredDays) state.moralFiredDays = [];
    state.flags = migrateFlags(state.flags || {});
    if (state.missedBillsStreak == null) state.missedBillsStreak = 0;
    if (state.billsMissedTotal == null) state.billsMissedTotal = 0;
    if (state.infiltrationCount == null) state.infiltrationCount = 0;
    if (state.suspicion == null) state.suspicion = 0;
    state.__billsEngineV15 = true;
    try { delete state.__arcMap; delete state.__arcBackground; } catch (_) {}
    if (!state.dayTravellers || state.dayTravellers.length === 0) {
      state.dayTravellers = buildTravellerList(state.day, state.totalTravellers || 8);
    }

    var phase = state._resumePhase;
    var midDay = (state.traveller > 0 && state.traveller < (state.totalTravellers || 0));
    if (phase === 'booth' || (!phase && midDay)) {
      resumeBooth();
      return;
    }
    if (phase === 'eod') {
      // Rebuild EOD UI only — do NOT re-apply bills/hunger
      endOfDay({ replay: true });
      return;
    }
    // Default: morning of current day (bulletin), keep progress stats if any
    // Do NOT wipe traveller index if we already finished 0 of the day
    if (phase === 'bulletin' || state.traveller === 0) {
      updateHUD();
      showBulletin(state.day);
      return;
    }
    startDay();
  } catch(e) {
    console.warn('Could not load save. Starting new game.');
    startNewGame();
  }
}

function startNewGame() {
  try {
    var existing = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (hasResumableSave(existing) && existing.player && existing.player.name) {
      var ok = window.confirm('Start a new game? Your posting at Day ' + (existing.day || 1) + ' will be overwritten (unlocked endings are kept).');
      if (!ok) return;
    }
  } catch (e) {}
  initAudio();
  // Preserve unlocked endings across runs
  var prevEndings = [];
  try {
    var prev = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (prev && prev.endingsUnlocked) prevEndings = prev.endingsUnlocked;
  } catch(e) {}

  state = freshState();
  state.endingsUnlocked = prevEndings;
  ccSel = { gender:'', state:'', background:'', family:'' };

  // Reset CC form
  document.getElementById('cc-firstname').value = '';
  document.getElementById('cc-surname').value = '';
  document.querySelectorAll('.cc-option').forEach(function(el){ el.classList.remove('selected'); });
  populateFamilyOptions();

  showScreen('char-create');
}

function showEndingsGallery() {
  var unlocked = [];
  try {
    var s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s) unlocked = s.endingsUnlocked || [];
  } catch(e) {}

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#050703;z-index:500;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:24px 20px;';

  var inner = document.createElement('div');
  inner.style.maxWidth = '500px';
  inner.style.margin = '0 auto';

  var titleEl = document.createElement('div');
  titleEl.style.cssText = "font-family:'Bebas Neue',sans-serif;font-size:28px;color:#F2E8D0;letter-spacing:0.1em;margin-bottom:4px";
  titleEl.textContent = 'CASE FILES';
  inner.appendChild(titleEl);

  var countEl = document.createElement('div');
  countEl.style.cssText = "font-family:'Courier Prime',monospace;font-size:10px;color:#D4A017;letter-spacing:0.3em;margin-bottom:20px";
  countEl.textContent = unlocked.length + ' OF ' + ENDINGS.length + ' ENDINGS DISCOVERED';
  inner.appendChild(countEl);

  ENDINGS.forEach(function(e) {
    var found = unlocked.indexOf(e.id) !== -1;
    var row = document.createElement('div');
    row.style.cssText = 'padding:12px;border-bottom:1px solid rgba(242,232,208,0.1)';

    var ttl = document.createElement('div');
    ttl.style.cssText = "font-family:'Bebas Neue',sans-serif;font-size:16px;color:" + (found ? '#D4A017' : 'rgba(242,232,208,0.3)') + ";letter-spacing:0.1em";
    ttl.textContent = found ? e.title : 'ENDING ' + e.num + ' — UNDISCOVERED';
    row.appendChild(ttl);

    if (found) {
      var preview = document.createElement('div');
      preview.style.cssText = "font-family:'Noto Serif',serif;font-style:italic;font-size:12px;color:rgba(242,232,208,0.6);margin-top:4px";
      preview.textContent = e.text.replace(/<[^>]*>/g,'').substring(0, 120) + '…';
      row.appendChild(preview);
    }
    inner.appendChild(row);
  });

  var closeBtn = document.createElement('button');
  closeBtn.className = 'btn-primary';
  closeBtn.style.cssText = 'width:100%;clip-path:none;margin-top:16px';
  closeBtn.textContent = 'CLOSE';
  closeBtn.addEventListener('click', function() { overlay.remove(); });
  inner.appendChild(closeBtn);

  overlay.appendChild(inner);
  document.body.appendChild(overlay);
}

function returnToSplash() {
  showScreen('splash');
  checkContinue();
}

function checkContinue() {
  try {
    var saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    var btn = document.getElementById('btn-continue');
    if (!btn) return;
    if (hasResumableSave(saved)) {
      btn.style.display = '';
      btn.style.display = 'block';
      var dayEl = document.getElementById('continue-day');
      if (dayEl) dayEl.textContent = saved.day || 1;
      var mid = (saved.traveller > 0 && saved.traveller < (saved.totalTravellers || 0));
      if (mid) {
        btn.textContent = '';
        btn.appendChild(document.createTextNode('CONTINUE — DAY '));
        var sp = document.createElement('span');
        sp.id = 'continue-day';
        sp.textContent = String(saved.day || 1);
        btn.appendChild(sp);
        btn.appendChild(document.createTextNode(' · AT WINDOW'));
      } else {
        btn.innerHTML = 'CONTINUE — DAY <span id="continue-day">' + (saved.day || 1) + '</span>';
      }
    } else {
      btn.style.display = 'none';
    }
  } catch(e) {}
}

// ── BUILD SUN RAYS ──
function buildSun() {
  var sun = document.getElementById('splash-sun');
  if (!sun) return;
  // Remove existing rays
  sun.querySelectorAll('.sun-ray').forEach(function(r){ r.remove(); });
  for (var i = 0; i < 11; i++) {
    var ray = document.createElement('div');
    ray.className = 'sun-ray';
    var angle = (i / 11) * 360;
    ray.style.cssText = 'position:absolute;width:3px;height:20px;background:var(--biafra-gold);' +
      'top:50%;left:50%;transform-origin:bottom center;border-radius:2px;opacity:0.8;' +
      'transform:translateX(-50%) rotate(' + angle + 'deg) translateY(-100%)';
    sun.appendChild(ray);
  }
}

// ── WIRE UP ALL BUTTONS ──
function wireButtons() {
  document.getElementById('btn-begin').addEventListener('click', startNewGame);
  document.getElementById('btn-continue').addEventListener('click', loadSavedGame);
  document.getElementById('btn-gallery').addEventListener('click', showEndingsGallery);
  document.getElementById('btn-proceed').addEventListener('click', proceedFromCC);
  document.getElementById('btn-skip-intro').addEventListener('click', skipIntro);
  document.getElementById('btn-ack-bulletin').addEventListener('click', acknowledgeBulletin);
  document.getElementById('btn-approve').addEventListener('click', function(){ decide('approve'); });
  document.getElementById('btn-deny').addEventListener('click', function(){ decide('deny'); });
  document.getElementById('btn-detain').addEventListener('click', function(){ decide('detain'); });
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-next-day').addEventListener('click', nextDay);
  document.getElementById('btn-return-splash').addEventListener('click', returnToSplash);

  // Close modal on overlay tap
  document.getElementById('doc-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
}


function wireDocPovTilt() {
  var stage = document.getElementById('doc-pov-stage');
  var pov = document.getElementById('doc-pov');
  if (!stage || !pov || pov._tiltWired) return;
  pov._tiltWired = true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;
  stage.addEventListener('pointermove', function(e) {
    var r = stage.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    stage.style.setProperty('--pov-rx', (-y * 7).toFixed(2) + 'deg');
    stage.style.setProperty('--pov-ry', (x * 10).toFixed(2) + 'deg');
  });
  stage.addEventListener('pointerleave', function() {
    stage.style.setProperty('--pov-rx', '0deg');
    stage.style.setProperty('--pov-ry', '0deg');
  });
}

// ── INIT ──
function init() {
  initScreens();
  buildSun();
  populateGenderOptions();
  populateStateOptions();
  populateBgOptions();
  populateFamilyOptions();
  wireButtons();
  wireDocPovTilt();
  checkContinue();
  // Show splash (credits-splash owns first paint; still mark splash ready)
  var splashEl = document.getElementById('splash');
  if (splashEl) {
    splashEl.style.display = 'flex';
    splashEl.classList.add('active');
  }

  // Service Worker registration for iOS PWA offline support.
  // Bump CACHE_NAME in sw.js whenever shipping asset changes (network-first + versioned cache).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=1.16').catch(function(){});
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// expose engine to window for runtime hooks / patch.js wrappers
try {
  if (typeof decide === "function") window.decide = decide;
  if (typeof updateHUD === "function") window.updateHUD = updateHUD;
  if (typeof renderDocs === "function") window.renderDocs = renderDocs;
  if (typeof renderTraveller === "function") window.renderTraveller = renderTraveller;
  if (typeof loadNextTraveller === "function") window.loadNextTraveller = loadNextTraveller;
  if (typeof formatNotes === "function") window.formatNotes = formatNotes;
  if (typeof formatNotesSigned === "function") window.formatNotesSigned = formatNotesSigned;
  if (typeof startDay === "function") window.startDay = startDay;
  if (typeof endOfDay === "function") window.endOfDay = endOfDay;
  if (typeof showEndingScreen === "function") window.showEndingScreen = showEndingScreen;
  if (typeof nextDay === "function") window.nextDay = nextDay;
  if (typeof saveState === "function") window.saveState = saveState;
  if (typeof showBulletin === "function") window.showBulletin = showBulletin;
  if (typeof addAxis === "function") window.addAxis = addAxis;
  if (typeof chooseMoral === "function") window.chooseMoral = chooseMoral;
  if (typeof rememberFlag === "function") window.rememberFlag = rememberFlag;
  if (typeof pushMemory === "function") window.pushMemory = pushMemory;
  try { delete window.state; } catch (_) {}
  Object.defineProperty(window, 'state', {
    configurable: true,
    enumerable: true,
    get: function () { return state; },
    set: function (v) { state = v; }
  });
} catch(_){
  try { window.state = state; } catch(__){}
}

})();
