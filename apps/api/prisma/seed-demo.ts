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

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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

// ─── Demo account ─────────────────────────────────────────────────────────────

const DEMO_PHONE = '+19493002274';

// ─── Friend pools ─────────────────────────────────────────────────────────────
// Each friend gets a unique phone so the seed is idempotent.

const HOODLEMS_FRIENDS = [
  { phone: '+15550001001', name: 'Marcus Webb',    username: 'marcuswebb'  },
  { phone: '+15550001002', name: 'Priya Sharma',   username: 'priyasharma' },
  { phone: '+15550001003', name: 'Ethan Park',     username: 'ethanpark'   },
  { phone: '+15550001004', name: 'Lily Chen',      username: 'lilychen'    },
  { phone: '+15550001005', name: 'Noah Williams',  username: 'noahw'       },
];

// Nu Class is a subset of PKS members — they appear in PKS, Nu Class, and Freshman Class groups
const PKS_NU_FRIENDS = [
  { phone: '+15550002001', name: 'Derek Santos',   username: 'dereks'      },
  { phone: '+15550002002', name: 'Connor Walsh',   username: 'connorw'     },
  { phone: '+15550002003', name: 'Aiden Tran',     username: 'aidentran'   },
  { phone: '+15550002004', name: 'Luke Petersen',  username: 'lukep'       },
  { phone: '+15550002005', name: 'Matt Huang',     username: 'matthuang'   },
  { phone: '+15550002006', name: 'Jake Morales',   username: 'jakem'       },
  { phone: '+15550002007', name: 'Ryan Brooks',    username: 'ryanbrooks'  },
];

// Broader PKS brothers (not Nu class)
const PKS_BROAD_FRIENDS = [
  { phone: '+15550003001', name: 'Tyler Nguyen',   username: 'tylern'      },
  { phone: '+15550003002', name: 'Ben Foster',     username: 'benfoster'   },
  { phone: '+15550003003', name: 'Sam Ellis',      username: 'samellis'    },
  { phone: '+15550003004', name: 'Chris Diaz',     username: 'chrisd'      },
  { phone: '+15550003005', name: 'Alex Kim',       username: 'alexkim'     },
  { phone: '+15550003006', name: 'Zach Turner',    username: 'zacht'       },
  { phone: '+15550003007', name: 'Jordan Baker',   username: 'jordanb'     },
  { phone: '+15550003008', name: 'Caleb Ross',     username: 'calebr'      },
  { phone: '+15550003009', name: 'Austin Powell',  username: 'austinp'     },
  { phone: '+15550003010', name: 'Will Cooper',    username: 'willc'       },
  { phone: '+15550003011', name: 'Nick Reed',      username: 'nickr'       },
  { phone: '+15550003012', name: 'Owen Bell',      username: 'owenbell'    },
];

// Voyager friend group (mix of people, some overlap with hoodlems)
const VOYAGER_FRIENDS = [
  { phone: '+15550004001', name: 'Sofia Reyes',    username: 'sofiareyes'  },
  { phone: '+15550004002', name: 'Mia Johnson',    username: 'miaj'        },
  { phone: '+15550004003', name: 'Emma Davis',     username: 'emmad'       },
  { phone: '+15550004004', name: 'Chloe Martinez', username: 'chloemtz'    },
  { phone: '+15550004005', name: 'Ava Wilson',     username: 'avaw'        },
  { phone: '+15550004006', name: 'Grace Lee',      username: 'gracel'      },
  { phone: '+15550004007', name: 'Zoe Anderson',   username: 'zoea'        },
  { phone: '+15550004008', name: 'Nate Thomas',    username: 'natet'       },
  { phone: '+15550004009', name: 'Isaac Jackson',  username: 'isaacj'      },
  { phone: '+15550004010', name: 'Liam Harris',    username: 'liamh'       },
  { phone: '+15550004011', name: 'Ellie Scott',    username: 'ellies'      },
  { phone: '+15550004012', name: 'Olivia Young',   username: 'oliviay'     },
  { phone: '+15550004013', name: 'Maya Clark',     username: 'mayac'       },
  { phone: '+15550004014', name: 'Hannah White',   username: 'hannahw'     },
];

// Flag football team (Jay + 14 others = 15 players)
const FLAG_FRIENDS = [
  { phone: '+15550005001', name: 'Darius Green',   username: 'dariusg'     },
  { phone: '+15550005002', name: 'Trey Hall',      username: 'treyh'       },
  { phone: '+15550005003', name: 'Marcus Cole',    username: 'marcusc'     },
  { phone: '+15550005004', name: 'Jalen Price',    username: 'jalenp'      },
  { phone: '+15550005005', name: 'Kobe Stewart',   username: 'kobes'       },
  { phone: '+15550005006', name: 'Andre King',     username: 'andrek'      },
  { phone: '+15550005007', name: 'Carlos Simmons', username: 'carloss'     },
  { phone: '+15550005008', name: 'Devon Wright',   username: 'devonw'      },
  { phone: '+15550005009', name: 'Jordan Mitchell',username: 'jordanm'     },
  { phone: '+15550005010', name: 'Cam Robinson',   username: 'camr'        },
  { phone: '+15550005011', name: 'Brandon Lewis',  username: 'brandonl'    },
  { phone: '+15550005012', name: 'Malik Walker',   username: 'malikw'      },
  { phone: '+15550005013', name: 'Omar Perez',     username: 'omarp'       },
  { phone: '+15550005014', name: 'Finn Carter',    username: 'finncarter'  },
];

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertUser(data: { phone: string; name: string; username: string; isVerified?: boolean }) {
  return prisma.user.upsert({
    where: { phone: data.phone },
    update: {},
    create: { ...data, isVerified: data.isVerified ?? false },
  });
}

async function upsertGroup(data: {
  name: string;
  description: string;
  type: 'official' | 'custom';
  orgSlug?: string | null;
  createdBy: string;
}): Promise<{ id: string; name: string }> {
  if (data.orgSlug) {
    const existing = await prisma.group.findUnique({ where: { orgSlug: data.orgSlug } });
    if (existing) return existing;
  } else {
    const existing = await prisma.group.findFirst({
      where: { name: data.name, type: data.type },
    });
    if (existing) return existing;
  }

  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      orgSlug: data.orgSlug ?? null,
      inviteCode: generateInviteCode(),
      createdBy: data.createdBy,
      memberCount: 0,
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

async function syncMemberCount(groupId: string) {
  const count = await prisma.groupMember.count({ where: { groupId } });
  await prisma.group.update({ where: { id: groupId }, data: { memberCount: count } });
  return count;
}

async function createEventWithRsvps(data: {
  title: string;
  description?: string;
  location?: string;
  type: string;
  status: string;
  createdBy: string;
  confirmedTime?: Date;
  groupId: string;
  attendees: { id: string }[];
  timeOptionTimes?: Date[];
  comments?: { userId: string; body: string }[];
}) {
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      type: data.type,
      status: data.status,
      createdBy: data.createdBy,
      confirmedTime: data.confirmedTime ?? null,
      eventGroups: { create: { groupId: data.groupId } },
    },
  });

  if (data.timeOptionTimes?.length) {
    await prisma.eventTimeOption.createMany({
      data: data.timeOptionTimes.map((t) => ({
        eventId: event.id,
        proposedTime: t,
        voteCount: Math.floor(Math.random() * 5) + 1,
      })),
    });
  }

  const statuses: Array<'going' | 'maybe' | 'cant'> = ['going', 'going', 'going', 'going', 'maybe', 'maybe', 'cant'];
  for (let i = 0; i < data.attendees.length; i++) {
    await prisma.rsvp.upsert({
      where: { eventId_userId: { eventId: event.id, userId: data.attendees[i].id } },
      update: {},
      create: {
        eventId: event.id,
        userId: data.attendees[i].id,
        status: statuses[i % statuses.length],
        seenAt: new Date(),
      },
    });
  }

  for (const c of data.comments ?? []) {
    await prisma.eventComment.create({
      data: { eventId: event.id, userId: c.userId, body: c.body },
    });
  }

  return event;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding demo account for Jay Ananth…\n');

  // ── Demo user ──────────────────────────────────────────────────────────────
  const jay = await prisma.user.upsert({
    where: { phone: DEMO_PHONE },
    update: { name: 'Jay Ananth', username: 'jayananth', isVerified: true },
    create: { phone: DEMO_PHONE, name: 'Jay Ananth', username: 'jayananth', isVerified: true },
  });

  // Fresh session
  const rawToken = generateToken();
  await prisma.authSession.deleteMany({ where: { userId: jay.id } });
  await prisma.authSession.create({
    data: {
      userId: jay.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✓ Demo user: ${jay.name} (${DEMO_PHONE})`);
  console.log(`  Session token: ${rawToken}\n`);

  // ── Create all friends ─────────────────────────────────────────────────────
  const hoodlems  = await Promise.all(HOODLEMS_FRIENDS.map(upsertUser));
  const nuClass   = await Promise.all(PKS_NU_FRIENDS.map(upsertUser));
  const pksBroad  = await Promise.all(PKS_BROAD_FRIENDS.map(upsertUser));
  const voyagers  = await Promise.all(VOYAGER_FRIENDS.map(upsertUser));
  const flagPlayers = await Promise.all(FLAG_FRIENDS.map(upsertUser));
  console.log('✓ Friend accounts created\n');

  // ── Create groups ──────────────────────────────────────────────────────────

  // 1. The Hoodlems  (6 total)
  const hoodlemsGroup = await upsertGroup({
    name: 'The Hoodlems',
    description: 'Floor crew',
    type: 'custom',
    createdBy: jay.id,
  });
  await addMember(hoodlemsGroup.id, jay.id, 'admin');
  for (const f of hoodlems) await addMember(hoodlemsGroup.id, f.id);
  const hoodlemsCount = await syncMemberCount(hoodlemsGroup.id);
  console.log(`✓ The Hoodlems — ${hoodlemsCount} members`);

  // 2. Phi Kappa Sigma  (Jay + Nu class + broad brothers)
  const pksGroup = await upsertGroup({
    name: 'Phi Kappa Sigma',
    description: 'PKS — UC Berkeley chapter',
    type: 'official',
    orgSlug: 'pks',
    createdBy: jay.id,
  });
  await addMember(pksGroup.id, jay.id, 'admin');
  for (const f of [...nuClass, ...pksBroad]) await addMember(pksGroup.id, f.id);
  const pksCount = await syncMemberCount(pksGroup.id);
  console.log(`✓ Phi Kappa Sigma — ${pksCount} members`);

  // 3. PKS Nu Class  (Jay + 7 Nu brothers)
  const nuClassGroup = await upsertGroup({
    name: 'PKS Nu Class',
    description: 'Nu pledge class — Phi Kappa Sigma',
    type: 'custom',
    createdBy: jay.id,
  });
  await addMember(nuClassGroup.id, jay.id, 'admin');
  for (const f of nuClass) await addMember(nuClassGroup.id, f.id);
  const nuCount = await syncMemberCount(nuClassGroup.id);
  console.log(`✓ PKS Nu Class — ${nuCount} members`);

  // 4. PKS Freshman Class  (Jay + all Nu class + some broad brothers = ~14)
  const freshmanClassGroup = await upsertGroup({
    name: 'PKS Freshman Class',
    description: 'Freshman class — Phi Kappa Sigma',
    type: 'custom',
    createdBy: jay.id,
  });
  await addMember(freshmanClassGroup.id, jay.id, 'admin');
  const freshmanMembers = [...nuClass, ...pksBroad.slice(0, 6)];
  for (const f of freshmanMembers) await addMember(freshmanClassGroup.id, f.id);
  const freshmanCount = await syncMemberCount(freshmanClassGroup.id);
  console.log(`✓ PKS Freshman Class — ${freshmanCount} members`);

  // 5. Voyager  (Jay + 14 friends = 15)
  const voyagerGroup = await upsertGroup({
    name: 'Voyager',
    description: 'The friend group',
    type: 'custom',
    createdBy: jay.id,
  });
  await addMember(voyagerGroup.id, jay.id, 'admin');
  for (const f of voyagers) await addMember(voyagerGroup.id, f.id);
  const voyagerCount = await syncMemberCount(voyagerGroup.id);
  console.log(`✓ Voyager — ${voyagerCount} members`);

  // 6. IM Flag Football  (Jay + 14 players = 15)
  const flagGroup = await upsertGroup({
    name: 'IM Flag Football',
    description: 'Intramural flag football — Spring 2026',
    type: 'custom',
    createdBy: jay.id,
  });
  await addMember(flagGroup.id, jay.id, 'admin');
  for (const f of flagPlayers) await addMember(flagGroup.id, f.id);
  const flagCount = await syncMemberCount(flagGroup.id);
  console.log(`✓ IM Flag Football — ${flagCount} members`);

  console.log('');

  // ── Events ────────────────────────────────────────────────────────────────

  // Hoodlems events
  await createEventWithRsvps({
    title: 'Rooftop night 🌙',
    description: 'Bring drinks, good vibes only',
    location: 'Unit 1 Roof',
    type: 'quick',
    status: 'active',
    createdBy: hoodlems[0].id,
    groupId: hoodlemsGroup.id,
    attendees: [jay, ...hoodlems],
    comments: [
      { userId: hoodlems[1].id, body: 'already on my way 🏃' },
      { userId: hoodlems[2].id, body: 'bringing White Claws' },
      { userId: jay.id, body: 'see y\'all in 10' },
    ],
  });

  await createEventWithRsvps({
    title: 'Dinner at Crossroads 🍝',
    type: 'planned',
    status: 'confirmed',
    createdBy: jay.id,
    confirmedTime: hoursFromNow(3),
    location: 'Crossroads Dining',
    groupId: hoodlemsGroup.id,
    attendees: [jay, ...hoodlems.slice(0, 4)],
    comments: [
      { userId: hoodlems[0].id, body: 'I called a table' },
    ],
  });

  // PKS events
  await createEventWithRsvps({
    title: 'Chapter meeting',
    location: 'PKS House — Channing Way',
    type: 'planned',
    status: 'confirmed',
    createdBy: pksBroad[0].id,
    confirmedTime: daysFromNow(2, 20),
    groupId: pksGroup.id,
    attendees: [jay, ...nuClass.slice(0, 5), ...pksBroad.slice(0, 6)],
  });

  await createEventWithRsvps({
    title: 'PKS Fall Social 🎉',
    description: 'Annual social — bring a plus one',
    location: 'PKS House',
    type: 'planned',
    status: 'confirmed',
    createdBy: pksBroad[1].id,
    confirmedTime: daysFromNow(5, 21),
    groupId: pksGroup.id,
    attendees: [jay, ...nuClass, ...pksBroad.slice(0, 8)],
    comments: [
      { userId: nuClass[0].id, body: 'let\'s gooo 🔥' },
      { userId: pksBroad[2].id, body: 'who\'s DJing?' },
      { userId: nuClass[1].id, body: 'I got the playlist' },
    ],
  });

  await createEventWithRsvps({
    title: 'Bid day celebration 🎊',
    description: 'Welcoming the new class!',
    type: 'voting',
    status: 'active',
    createdBy: pksBroad[3].id,
    timeOptionTimes: [
      daysFromNow(7, 18),
      daysFromNow(8, 19),
      daysFromNow(9, 17),
    ],
    groupId: pksGroup.id,
    attendees: [jay, ...nuClass.slice(0, 4), ...pksBroad.slice(0, 5)],
  });

  // Nu Class events
  await createEventWithRsvps({
    title: 'Nu class bonding night',
    description: 'Just us — game night at my place',
    location: 'Derek\'s place',
    type: 'planned',
    status: 'confirmed',
    createdBy: nuClass[0].id,
    confirmedTime: daysFromNow(1, 19),
    groupId: nuClassGroup.id,
    attendees: [jay, ...nuClass],
    comments: [
      { userId: nuClass[2].id, body: 'bringing Catan 🎲' },
      { userId: jay.id, body: 'I got snacks covered' },
      { userId: nuClass[4].id, body: 'can someone pick me up?' },
    ],
  });

  await createEventWithRsvps({
    title: 'Study sesh before midterms 📚',
    location: 'Moffitt Library — 4th floor',
    type: 'quick',
    status: 'active',
    createdBy: jay.id,
    groupId: nuClassGroup.id,
    attendees: [jay, ...nuClass.slice(0, 5)],
  });

  // Freshman Class events
  await createEventWithRsvps({
    title: 'Freshman class cookout 🔥',
    description: 'End of semester cookout, everyone\'s invited',
    location: 'Willard Park',
    type: 'voting',
    status: 'active',
    createdBy: nuClass[1].id,
    timeOptionTimes: [
      daysFromNow(10, 13),
      daysFromNow(11, 12),
      daysFromNow(14, 14),
    ],
    groupId: freshmanClassGroup.id,
    attendees: [jay, ...nuClass, ...pksBroad.slice(0, 4)],
    comments: [
      { userId: nuClass[3].id, body: 'vote for Sunday!' },
      { userId: pksBroad[0].id, body: 'I\'ll bring the speakers 🔊' },
    ],
  });

  // Voyager events
  await createEventWithRsvps({
    title: 'Voyager Tahoe trip 🏔️',
    description: 'Presidents\' Day weekend — ski trip, let\'s lock it in',
    type: 'voting',
    status: 'active',
    createdBy: voyagers[0].id,
    timeOptionTimes: [
      daysFromNow(60, 12),
      daysFromNow(67, 12),
    ],
    groupId: voyagerGroup.id,
    attendees: [jay, ...voyagers.slice(0, 10)],
    comments: [
      { userId: voyagers[1].id, body: 'I\'m so ready 🎿' },
      { userId: voyagers[2].id, body: 'who\'s driving?' },
      { userId: jay.id, body: 'I can drive one car' },
      { userId: voyagers[3].id, body, },
    ].filter(c => c.body),
  });

  await createEventWithRsvps({
    title: 'Movie night 🎬',
    description: 'Dune Part 3 — finally',
    location: 'Sophia\'s place',
    type: 'planned',
    status: 'confirmed',
    createdBy: voyagers[0].id,
    confirmedTime: hoursFromNow(5),
    groupId: voyagerGroup.id,
    attendees: [jay, ...voyagers.slice(0, 8)],
    comments: [
      { userId: voyagers[4].id, body: 'I\'ve been waiting forever for this' },
      { userId: voyagers[5].id, body: 'bringing popcorn 🍿' },
    ],
  });

  await createEventWithRsvps({
    title: 'Brunch Sunday ☀️',
    location: 'Cheeseboard — Telegraph',
    type: 'planned',
    status: 'confirmed',
    createdBy: jay.id,
    confirmedTime: daysFromNow(3, 11),
    groupId: voyagerGroup.id,
    attendees: [jay, ...voyagers.slice(0, 6)],
  });

  // Flag Football events
  await createEventWithRsvps({
    title: 'Game vs. EECS FC ⚡',
    description: 'Win this and we\'re in playoffs. Everyone show up.',
    location: 'RSF Field',
    type: 'planned',
    status: 'confirmed',
    createdBy: jay.id,
    confirmedTime: daysFromNow(4, 17),
    groupId: flagGroup.id,
    attendees: [jay, ...flagPlayers],
    comments: [
      { userId: flagPlayers[0].id, body: 'let\'s get it 🏈' },
      { userId: flagPlayers[1].id, body: 'playoffs baby' },
      { userId: flagPlayers[2].id, body: 'everyone stretch before — last week was embarrassing 😭' },
      { userId: jay.id, body: 'lmaoo facts. see y\'all at 4:30' },
    ],
  });

  await createEventWithRsvps({
    title: 'Flag Football practice',
    location: 'Underhill Field',
    type: 'planned',
    status: 'confirmed',
    createdBy: flagPlayers[0].id,
    confirmedTime: daysFromNow(1, 16),
    groupId: flagGroup.id,
    attendees: [jay, ...flagPlayers.slice(0, 10)],
  });

  await createEventWithRsvps({
    title: 'Team dinner after playoffs 🍕',
    type: 'voting',
    status: 'active',
    createdBy: flagPlayers[3].id,
    timeOptionTimes: [
      daysFromNow(4, 20),
      daysFromNow(5, 19),
    ],
    groupId: flagGroup.id,
    attendees: [jay, ...flagPlayers.slice(0, 8)],
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('🎉  Demo seed complete!\n');
  console.log('  Login: +19493002274  →  OTP: 000000');
  console.log('  Groups: The Hoodlems · Phi Kappa Sigma · PKS Nu Class · PKS Freshman Class · Voyager · IM Flag Football\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
