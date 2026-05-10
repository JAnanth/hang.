/**
 * Demo seed for Jay Ananth's account.
 *
 * Demo login:  +19493002274  →  OTP: 000000
 *
 * Run: pnpm db:seed-demo   (from apps/api/)
 */
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

function generateInviteCode(): string {
  return randomBytes(6).toString('hex').toUpperCase();
}
function generateToken(): string {
  return randomBytes(32).toString('hex');
}
function hashToken(t: string): string {
  return createHash('sha256').update(t).digest('hex');
}
function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}
function daysFromNow(d: number, hour = 19): Date {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// ─── Name generator ───────────────────────────────────────────────────────────

const FIRST = [
  'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
  'Daniel','Matthew','Anthony','Mark','Donald','Paul','Steven','Andrew','Kenneth','Joshua',
  'Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob',
  'Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin',
  'Samuel','Patrick','Alexander','Frank','Raymond','Jack','Dennis','Jerry','Tyler','Aaron',
  'Jose','Henry','Adam','Douglas','Nathan','Peter','Zachary','Kyle','Walter','Harold',
  'Jeremy','Ethan','Carl','Keith','Roger','Gerald','Christian','Terry','Sean','Austin',
  'Arthur','Noah','Lawrence','Jesse','Joe','Bryan','Billy','Jordan','Albert','Dylan',
  'Bruce','Willie','Gabriel','Alan','Juan','Logan','Wayne','Ralph','Roy','Eugene',
  'Randy','Vincent','Russell','Louis','Philip','Bobby','Johnny','Bradley','Marcus','Derek',
  'Connor','Aiden','Luke','Matt','Jake','Ryan','Caleb','Owen','Nate','Isaac',
  'Liam','Finn','Darius','Trey','Jalen','Kobe','Andre','Carlos','Devon','Cam',
];

const LAST = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor',
  'Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young','Allen',
  'King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson',
  'Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans',
  'Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Morales',
  'Murphy','Cook','Rogers','Peterson','Cooper','Reed','Bailey','Bell','Gonzalez','Butler',
  'Ward','Cox','Richardson','Howard','Brooks','Watson','Kelly','Sanders','Price','Bennett',
  'Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long','Patterson',
  'Hughes','Flores','Washington','Butler','Simmons','Foster','Gonzales','Bryant','Alexander','Russell',
  'Griffin','Diaz','Hayes','Myers','Ford','Hamilton','Graham','Sullivan','Wallace','West',
  'Brooks','Mendez','Ramos','Ortiz','Perez','Santos','Lopez','Ramirez','Hernandez','Martinez',
  'Kim','Lee','Park','Nguyen','Tran','Pham','Le','Vo','Dang','Bui',
];

function makeName(index: number): string {
  return `${FIRST[index % FIRST.length]} ${LAST[Math.floor(index / FIRST.length) % LAST.length]}`;
}

function makeUsername(name: string, index: number): string {
  return name.toLowerCase().replace(/\s+/g, '') + index;
}

interface PersonData { phone: string; name: string; username: string }

/** Generate `count` people with phones +1555_GGG_XXXX (GGG = group bucket, XXXX = seq) */
function makePool(groupBucket: number, count: number, nameOffset: number): PersonData[] {
  return Array.from({ length: count }, (_, i) => {
    const seq = i + 1;
    const name = makeName(nameOffset + i);
    return {
      phone: `+1555${String(groupBucket).padStart(3, '0')}${String(seq).padStart(4, '0')}`,
      name,
      username: makeUsername(name, nameOffset + i),
    };
  });
}

// ─── Pools ────────────────────────────────────────────────────────────────────
// PKS:              Jay + 16 (Nu) + 25 (Freshman non-Nu) + 73 (older brothers) = 115
// PKS Nu Class:     Jay + 16 = 17
// PKS Freshman:     Jay + 16 (Nu) + 25 (non-Nu) = 42
// Voyager:          Jay + 15 = 16
// Hoodlems:         Jay + 5  = 6
// Flag Football:    Jay + 14 = 15

const NU_CLASS_POOL      = makePool(1,  16, 0);    // also in Freshman + PKS
const FRESHMAN_EXTRA     = makePool(2,  25, 16);   // in Freshman + PKS (not Nu Class)
const PKS_OLDER          = makePool(3,  73, 41);   // PKS only (older brothers)
const VOYAGER_POOL       = makePool(4,  15, 114);
const HOODLEMS_POOL      = makePool(5,   5, 129);
const FLAG_POOL          = makePool(6,  14, 134);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(p: PersonData) {
  return prisma.user.upsert({
    where: { phone: p.phone },
    update: {},
    create: { phone: p.phone, name: p.name, username: p.username, isVerified: false },
  });
}

async function upsertGroup(data: {
  name: string; description: string; type: 'official' | 'custom';
  orgSlug?: string | null; createdBy: string;
}) {
  if (data.orgSlug) {
    const ex = await prisma.group.findUnique({ where: { orgSlug: data.orgSlug } });
    if (ex) return ex;
  } else {
    const ex = await prisma.group.findFirst({ where: { name: data.name, type: data.type } });
    if (ex) return ex;
  }
  return prisma.group.create({
    data: {
      name: data.name, description: data.description, type: data.type,
      orgSlug: data.orgSlug ?? null, inviteCode: generateInviteCode(),
      createdBy: data.createdBy, memberCount: 0,
    },
  });
}

async function addMember(groupId: string, userId: string, role: 'admin' | 'member' = 'member') {
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: {},
    create: { groupId, userId, role },
  });
}

async function syncCount(groupId: string) {
  const count = await prisma.groupMember.count({ where: { groupId } });
  await prisma.group.update({ where: { id: groupId }, data: { memberCount: count } });
  return count;
}

async function mkEvent(data: {
  title: string; description?: string; location?: string;
  type: string; status: string; createdBy: string; confirmedTime?: Date;
  groupId: string; attendees: { id: string }[];
  timeopts?: Date[];
  comments?: { userId: string; body: string }[];
}) {
  const event = await prisma.event.create({
    data: {
      title: data.title, description: data.description ?? null,
      location: data.location ?? null, type: data.type, status: data.status,
      createdBy: data.createdBy, confirmedTime: data.confirmedTime ?? null,
      eventGroups: { create: { groupId: data.groupId } },
    },
  });
  if (data.timeopts?.length) {
    await prisma.eventTimeOption.createMany({
      data: data.timeopts.map((t) => ({
        eventId: event.id, proposedTime: t,
        voteCount: Math.floor(Math.random() * 8) + 1,
      })),
    });
  }
  const statuses: Array<'going' | 'maybe' | 'cant'> = ['going','going','going','going','maybe','maybe','cant'];
  for (let i = 0; i < data.attendees.length; i++) {
    await prisma.rsvp.upsert({
      where: { eventId_userId: { eventId: event.id, userId: data.attendees[i].id } },
      update: {},
      create: { eventId: event.id, userId: data.attendees[i].id, status: statuses[i % statuses.length], seenAt: new Date() },
    });
  }
  for (const c of data.comments ?? []) {
    await prisma.eventComment.create({ data: { eventId: event.id, userId: c.userId, body: c.body } });
  }
  return event;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding demo account for Jay Ananth…\n');

  // Demo user
  const jay = await prisma.user.upsert({
    where: { phone: '+19493002274' },
    update: { name: 'Jay Ananth', username: 'jayananth', isVerified: true },
    create: { phone: '+19493002274', name: 'Jay Ananth', username: 'jayananth', isVerified: true },
  });
  await prisma.authSession.deleteMany({ where: { userId: jay.id } });
  const rawToken = generateToken();
  await prisma.authSession.create({
    data: { userId: jay.id, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });
  console.log(`✓ Jay Ananth (+19493002274) — session: ${rawToken}\n`);

  // Upsert all friends
  console.log('Creating friend accounts…');
  const nuUsers       = await Promise.all(NU_CLASS_POOL.map(upsertUser));
  const freshExtraUsers = await Promise.all(FRESHMAN_EXTRA.map(upsertUser));
  const pksOlderUsers = await Promise.all(PKS_OLDER.map(upsertUser));
  const voyagerUsers  = await Promise.all(VOYAGER_POOL.map(upsertUser));
  const hoodlemsUsers = await Promise.all(HOODLEMS_POOL.map(upsertUser));
  const flagUsers     = await Promise.all(FLAG_POOL.map(upsertUser));
  console.log(`✓ ${NU_CLASS_POOL.length + FRESHMAN_EXTRA.length + PKS_OLDER.length + VOYAGER_POOL.length + HOODLEMS_POOL.length + FLAG_POOL.length} friend accounts ready\n`);

  // ── Groups ────────────────────────────────────────────────────────────────

  // 1. The Hoodlems (6)
  const hoodlemsG = await upsertGroup({ name: 'The Hoodlems', description: 'Floor crew', type: 'custom', createdBy: jay.id });
  await addMember(hoodlemsG.id, jay.id, 'admin');
  for (const u of hoodlemsUsers) await addMember(hoodlemsG.id, u.id);
  console.log(`✓ The Hoodlems — ${await syncCount(hoodlemsG.id)} members`);

  // 2. Phi Kappa Sigma (115)
  const pksG = await upsertGroup({ name: 'Phi Kappa Sigma', description: 'PKS — UC Berkeley chapter', type: 'official', orgSlug: 'pks', createdBy: jay.id });
  await addMember(pksG.id, jay.id, 'admin');
  for (const u of [...nuUsers, ...freshExtraUsers, ...pksOlderUsers]) await addMember(pksG.id, u.id);
  console.log(`✓ Phi Kappa Sigma — ${await syncCount(pksG.id)} members`);

  // 3. PKS Nu Class (17)
  const nuG = await upsertGroup({ name: 'PKS Nu Class', description: 'Nu pledge class — Phi Kappa Sigma', type: 'custom', createdBy: jay.id });
  await addMember(nuG.id, jay.id, 'admin');
  for (const u of nuUsers) await addMember(nuG.id, u.id);
  console.log(`✓ PKS Nu Class — ${await syncCount(nuG.id)} members`);

  // 4. PKS Freshman Class (42)
  const freshG = await upsertGroup({ name: 'PKS Freshman Class', description: 'Freshman class — Phi Kappa Sigma', type: 'custom', createdBy: jay.id });
  await addMember(freshG.id, jay.id, 'admin');
  for (const u of [...nuUsers, ...freshExtraUsers]) await addMember(freshG.id, u.id);
  console.log(`✓ PKS Freshman Class — ${await syncCount(freshG.id)} members`);

  // 5. Voyager (16)
  const voyagerG = await upsertGroup({ name: 'Voyager', description: 'The friend group', type: 'custom', createdBy: jay.id });
  await addMember(voyagerG.id, jay.id, 'admin');
  for (const u of voyagerUsers) await addMember(voyagerG.id, u.id);
  console.log(`✓ Voyager — ${await syncCount(voyagerG.id)} members`);

  // 6. IM Flag Football (15)
  const flagG = await upsertGroup({ name: 'IM Flag Football', description: 'Intramural flag football — Spring 2026', type: 'custom', createdBy: jay.id });
  await addMember(flagG.id, jay.id, 'admin');
  for (const u of flagUsers) await addMember(flagG.id, u.id);
  console.log(`✓ IM Flag Football — ${await syncCount(flagG.id)} members\n`);

  // ── Events ────────────────────────────────────────────────────────────────

  // Hoodlems
  await mkEvent({
    title: 'Rooftop night 🌙', description: 'Bring drinks, good vibes only', location: 'Unit 1 Roof',
    type: 'quick', status: 'active', createdBy: hoodlemsUsers[0].id, groupId: hoodlemsG.id,
    attendees: [jay, ...hoodlemsUsers],
    comments: [
      { userId: hoodlemsUsers[1].id, body: 'already on my way 🏃' },
      { userId: hoodlemsUsers[2].id, body: 'bringing White Claws' },
      { userId: jay.id, body: 'see y\'all in 10' },
    ],
  });
  await mkEvent({
    title: 'Dinner at Crossroads 🍝', location: 'Crossroads Dining',
    type: 'planned', status: 'confirmed', createdBy: jay.id,
    confirmedTime: hoursFromNow(3), groupId: hoodlemsG.id,
    attendees: [jay, ...hoodlemsUsers.slice(0, 4)],
    comments: [{ userId: hoodlemsUsers[0].id, body: 'I called a table' }],
  });

  // PKS
  await mkEvent({
    title: 'Chapter meeting', location: 'PKS House — Channing Way',
    type: 'planned', status: 'confirmed', createdBy: pksOlderUsers[0].id,
    confirmedTime: daysFromNow(2, 20), groupId: pksG.id,
    attendees: [jay, ...nuUsers.slice(0, 8), ...freshExtraUsers.slice(0, 5), ...pksOlderUsers.slice(0, 10)],
  });
  await mkEvent({
    title: 'PKS Fall Social 🎉', description: 'Annual social — bring a plus one', location: 'PKS House',
    type: 'planned', status: 'confirmed', createdBy: pksOlderUsers[1].id,
    confirmedTime: daysFromNow(5, 21), groupId: pksG.id,
    attendees: [jay, ...nuUsers, ...freshExtraUsers.slice(0, 10), ...pksOlderUsers.slice(0, 15)],
    comments: [
      { userId: nuUsers[0].id, body: 'let\'s gooo 🔥' },
      { userId: pksOlderUsers[2].id, body: 'who\'s DJing?' },
      { userId: nuUsers[1].id, body: 'I got the playlist' },
    ],
  });
  await mkEvent({
    title: 'Bid day celebration 🎊', description: 'Welcoming the new class!',
    type: 'voting', status: 'active', createdBy: pksOlderUsers[3].id,
    timeopts: [daysFromNow(7, 18), daysFromNow(8, 19), daysFromNow(9, 17)],
    groupId: pksG.id,
    attendees: [jay, ...nuUsers.slice(0, 6), ...freshExtraUsers.slice(0, 4), ...pksOlderUsers.slice(0, 8)],
  });

  // Nu Class
  await mkEvent({
    title: 'Nu class bonding night', description: 'Game night — just us',
    location: `${nuUsers[0].name.split(' ')[0]}'s place`,
    type: 'planned', status: 'confirmed', createdBy: nuUsers[0].id,
    confirmedTime: daysFromNow(1, 19), groupId: nuG.id,
    attendees: [jay, ...nuUsers],
    comments: [
      { userId: nuUsers[2].id, body: 'bringing Catan 🎲' },
      { userId: jay.id, body: 'I got snacks covered' },
      { userId: nuUsers[4].id, body: 'can someone pick me up?' },
    ],
  });
  await mkEvent({
    title: 'Study sesh before midterms 📚', location: 'Moffitt Library — 4th floor',
    type: 'quick', status: 'active', createdBy: jay.id, groupId: nuG.id,
    attendees: [jay, ...nuUsers.slice(0, 8)],
  });

  // Freshman Class
  await mkEvent({
    title: 'Freshman class cookout 🔥', description: 'End of semester — everyone\'s invited',
    location: 'Willard Park',
    type: 'voting', status: 'active', createdBy: nuUsers[1].id,
    timeopts: [daysFromNow(10, 13), daysFromNow(11, 12), daysFromNow(14, 14)],
    groupId: freshG.id,
    attendees: [jay, ...nuUsers, ...freshExtraUsers.slice(0, 12)],
    comments: [
      { userId: nuUsers[3].id, body: 'vote for Sunday!' },
      { userId: freshExtraUsers[0].id, body: 'I\'ll bring the speakers 🔊' },
    ],
  });
  await mkEvent({
    title: 'Pledge class photo 📸', location: 'Sproul Plaza',
    type: 'planned', status: 'confirmed', createdBy: freshExtraUsers[1].id,
    confirmedTime: daysFromNow(6, 14), groupId: freshG.id,
    attendees: [jay, ...nuUsers.slice(0, 10), ...freshExtraUsers.slice(0, 8)],
  });

  // Voyager
  await mkEvent({
    title: 'Voyager Tahoe trip 🏔️', description: 'Presidents\' Day weekend — ski trip',
    type: 'voting', status: 'active', createdBy: voyagerUsers[0].id,
    timeopts: [daysFromNow(60, 12), daysFromNow(67, 12)],
    groupId: voyagerG.id,
    attendees: [jay, ...voyagerUsers],
    comments: [
      { userId: voyagerUsers[1].id, body: 'I\'m so ready 🎿' },
      { userId: voyagerUsers[2].id, body: 'who\'s driving?' },
      { userId: jay.id, body: 'I can drive one car' },
    ],
  });
  await mkEvent({
    title: 'Movie night 🎬', description: 'Dune Part 3 — finally',
    location: `${voyagerUsers[0].name.split(' ')[0]}'s place`,
    type: 'planned', status: 'confirmed', createdBy: voyagerUsers[0].id,
    confirmedTime: hoursFromNow(5), groupId: voyagerG.id,
    attendees: [jay, ...voyagerUsers.slice(0, 9)],
    comments: [
      { userId: voyagerUsers[4].id, body: 'been waiting forever for this' },
      { userId: voyagerUsers[5].id, body: 'bringing popcorn 🍿' },
    ],
  });
  await mkEvent({
    title: 'Brunch Sunday ☀️', location: 'Cheeseboard — Telegraph',
    type: 'planned', status: 'confirmed', createdBy: jay.id,
    confirmedTime: daysFromNow(3, 11), groupId: voyagerG.id,
    attendees: [jay, ...voyagerUsers.slice(0, 7)],
  });

  // Flag Football
  await mkEvent({
    title: 'Game vs. EECS FC ⚡', description: 'Win this and we\'re in playoffs. Everyone show up.',
    location: 'RSF Field',
    type: 'planned', status: 'confirmed', createdBy: jay.id,
    confirmedTime: daysFromNow(4, 17), groupId: flagG.id,
    attendees: [jay, ...flagUsers],
    comments: [
      { userId: flagUsers[0].id, body: 'let\'s get it 🏈' },
      { userId: flagUsers[1].id, body: 'playoffs baby' },
      { userId: flagUsers[2].id, body: 'everyone stretch before — last week was embarrassing 😭' },
      { userId: jay.id, body: 'lmaoo facts. see y\'all at 4:30' },
    ],
  });
  await mkEvent({
    title: 'Practice — RSF', location: 'Underhill Field',
    type: 'planned', status: 'confirmed', createdBy: flagUsers[0].id,
    confirmedTime: daysFromNow(1, 16), groupId: flagG.id,
    attendees: [jay, ...flagUsers.slice(0, 10)],
  });
  await mkEvent({
    title: 'Team dinner after playoffs 🍕',
    type: 'voting', status: 'active', createdBy: flagUsers[3].id,
    timeopts: [daysFromNow(4, 20), daysFromNow(5, 19)],
    groupId: flagG.id, attendees: [jay, ...flagUsers.slice(0, 9)],
  });

  console.log('🎉  Done!\n');
  console.log('  Login: +19493002274  →  OTP: 000000');
  console.log('  Groups: The Hoodlems (6) · Phi Kappa Sigma (115) · PKS Nu Class (17) · PKS Freshman Class (42) · Voyager (16) · IM Flag Football (15)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
