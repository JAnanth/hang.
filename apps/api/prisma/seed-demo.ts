/**
 * Demo seed: creates a ready-to-use account with groups, events, RSVPs, and comments.
 *
 * Demo login phone: +15550000001
 * OTP: use the /auth/verify endpoint with any code in dev (or check server logs)
 *
 * Run: pnpm db:seed-demo
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

// ─── Users ──────────────────────────────────────────────────────────────────

const DEMO_PHONE = '+15550000001';

const FRIEND_USERS = [
  { phone: '+15550000002', name: 'Alex Chen',     username: 'alexchen'   },
  { phone: '+15550000003', name: 'Maya Patel',    username: 'mayapatel'  },
  { phone: '+15550000004', name: 'Jordan Lee',    username: 'jordanlee'  },
  { phone: '+15550000005', name: 'Sam Rivera',    username: 'samrivera'  },
  { phone: '+15550000006', name: 'Riley Kim',     username: 'rileykim'   },
  { phone: '+15550000007', name: 'Taylor Nguyen', username: 'taylorn'    },
];

// ─── Groups ──────────────────────────────────────────────────────────────────

const GROUPS = [
  {
    key: 'cs189',
    name: 'CS 189 Study Group',
    description: 'CS 189 Machine Learning — Spring 2026',
    type: 'official' as const,
    orgSlug: 'cs189-spring2026',
  },
  {
    key: 'soccer',
    name: 'Intramural Soccer',
    description: 'Spring 2026 intramural soccer league',
    type: 'official' as const,
    orgSlug: 'intramural-soccer-spring2026',
  },
  {
    key: 'apartment',
    name: 'Unit 3 Apt 204',
    description: 'The apartment group chat',
    type: 'custom' as const,
    orgSlug: null,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function daysFromNow(d: number, hour = 18): Date {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding demo account…');

  // ── 1. Upsert demo user ──────────────────────────────────────────────────

  const demoUser = await prisma.user.upsert({
    where: { phone: DEMO_PHONE },
    update: {},
    create: {
      phone: DEMO_PHONE,
      name: 'Demo User',
      username: 'demouser',
      isVerified: true,
    },
  });

  console.log(`  ✓ Demo user: ${demoUser.name} (${demoUser.phone})`);

  // Create a long-lived session token so you can log in without OTP
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.authSession.upsert({
    where: { tokenHash },
    update: { expiresAt },
    create: {
      userId: demoUser.id,
      tokenHash,
      expiresAt,
    },
  });

  console.log(`  ✓ Demo session token (Bearer): ${rawToken}`);
  console.log('    Copy this into your API client to authenticate as the demo user.\n');

  // ── 2. Upsert friend users ───────────────────────────────────────────────

  const friends: typeof demoUser[] = [];
  for (const f of FRIEND_USERS) {
    const friend = await prisma.user.upsert({
      where: { phone: f.phone },
      update: {},
      create: { ...f, isVerified: Math.random() > 0.4 },
    });
    friends.push(friend);
    console.log(`  ✓ Friend: ${friend.name}`);
  }

  // ── 3. Upsert groups and add members ────────────────────────────────────

  const groupMap: Record<string, { id: string; name: string }> = {};

  for (const g of GROUPS) {
    const existing = g.orgSlug
      ? await prisma.group.findUnique({ where: { orgSlug: g.orgSlug } })
      : null;

    const group = existing
      ? existing
      : await prisma.group.upsert({
          where: g.orgSlug ? { orgSlug: g.orgSlug } : { id: 'never-matches' },
          update: {},
          create: {
            name: g.name,
            description: g.description,
            type: g.type,
            orgSlug: g.orgSlug,
            inviteCode: generateInviteCode(),
            createdBy: demoUser.id,
            memberCount: 0,
          },
        });

    groupMap[g.key] = { id: group.id, name: group.name };

    // Add demo user as admin
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: demoUser.id } },
      update: {},
      create: { groupId: group.id, userId: demoUser.id, role: 'admin' },
    });

    // Add all friends as members
    for (const friend of friends) {
      await prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId: friend.id } },
        update: {},
        create: { groupId: group.id, userId: friend.id, role: 'member' },
      });
    }

    // Update memberCount
    const count = await prisma.groupMember.count({ where: { groupId: group.id } });
    await prisma.group.update({ where: { id: group.id }, data: { memberCount: count } });

    console.log(`  ✓ Group "${group.name}" — ${count} members`);
  }

  // ── 4. Create events ────────────────────────────────────────────────────

  type EventData = {
    title: string;
    description?: string;
    location?: string;
    type: string;
    status: string;
    createdBy: string;
    confirmedTime?: Date;
    groupKey: string;
  };

  const eventsToCreate: EventData[] = [
    // CS 189 group — upcoming study session (planned)
    {
      title: 'CS 189 Midterm Study Session',
      description: 'Covering SVMs, kernel methods, and decision trees. Bring your notes!',
      location: 'Moffitt Library, 4th Floor',
      type: 'planned',
      status: 'confirmed',
      createdBy: friends[0].id,
      confirmedTime: daysFromNow(2, 14),
      groupKey: 'cs189',
    },
    // CS 189 group — voting event
    {
      title: 'Final exam review session',
      description: 'Let\'s figure out when works for everyone before finals week.',
      type: 'voting',
      status: 'active',
      createdBy: friends[1].id,
      groupKey: 'cs189',
    },
    // Soccer group — practice (quick)
    {
      title: 'Pickup soccer 🎮',
      location: 'Underhill Field',
      type: 'quick',
      status: 'active',
      createdBy: friends[2].id,
      groupKey: 'soccer',
    },
    // Soccer group — upcoming game (planned, confirmed)
    {
      title: 'Intramural game vs. EECS FC',
      description: 'Everyone show up by 6:45. Bring cleats.',
      location: 'RSF Field',
      type: 'planned',
      status: 'confirmed',
      createdBy: demoUser.id,
      confirmedTime: daysFromNow(3, 19),
      groupKey: 'soccer',
    },
    // Apartment group — dinner (planned, happening tonight)
    {
      title: 'Apartment dinner night 🍝',
      description: 'Making pasta. Who\'s in?',
      location: 'Unit 3 Apt 204',
      type: 'planned',
      status: 'confirmed',
      createdBy: friends[3].id,
      confirmedTime: hoursFromNow(4),
      groupKey: 'apartment',
    },
    // Apartment group — quick hangout
    {
      title: 'Roof vibes 🌅',
      description: 'Bring drinks',
      type: 'quick',
      status: 'active',
      createdBy: friends[4].id,
      groupKey: 'apartment',
    },
    // CS 189 — past event (ended, for feed history)
    {
      title: 'Problem Set 3 Work Session',
      location: 'Soda Hall 380',
      type: 'planned',
      status: 'ended',
      createdBy: friends[5].id,
      confirmedTime: daysFromNow(-2, 16),
      groupKey: 'cs189',
    },
  ];

  for (const ev of eventsToCreate) {
    const groupId = groupMap[ev.groupKey].id;

    const event = await prisma.event.create({
      data: {
        title: ev.title,
        description: ev.description ?? null,
        location: ev.location ?? null,
        type: ev.type,
        status: ev.status,
        createdBy: ev.createdBy,
        confirmedTime: ev.confirmedTime ?? null,
        eventGroups: { create: { groupId } },
      },
    });

    // Add time options for voting events
    if (ev.type === 'voting') {
      await prisma.eventTimeOption.createMany({
        data: [
          { eventId: event.id, proposedTime: daysFromNow(5, 14), voteCount: 3 },
          { eventId: event.id, proposedTime: daysFromNow(5, 18), voteCount: 2 },
          { eventId: event.id, proposedTime: daysFromNow(6, 11), voteCount: 4 },
        ],
      });
    }

    // RSVPs — demo user + friends
    const participants = [demoUser, ...friends].slice(0, Math.floor(Math.random() * 5) + 2);
    const statuses: Array<'going' | 'maybe' | 'cant'> = ['going', 'going', 'going', 'maybe', 'cant'];

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const status = statuses[i % statuses.length];
      await prisma.rsvp.upsert({
        where: { eventId_userId: { eventId: event.id, userId: p.id } },
        update: {},
        create: {
          eventId: event.id,
          userId: p.id,
          status,
          seenAt: new Date(),
        },
      });
    }

    // A couple of comments on the first two events
    if (eventsToCreate.indexOf(ev) < 2) {
      const commenters = friends.slice(0, 3);
      const sampleComments = [
        'I\'ll be there!',
        'Can someone share the Zoom link?',
        'Bringing snacks 🍕',
        'Running 5 min late, save me a spot',
        'This is going to be so fun',
      ];
      for (let i = 0; i < commenters.length; i++) {
        await prisma.eventComment.create({
          data: {
            eventId: event.id,
            userId: commenters[i].id,
            body: sampleComments[i % sampleComments.length],
          },
        });
      }
    }

    console.log(`  ✓ Event "${ev.title}" (${ev.type}, ${ev.status})`);
  }

  // ── 5. Summary ───────────────────────────────────────────────────────────

  console.log('\n🎉  Demo seed complete!\n');
  console.log('  Demo account:');
  console.log(`    Phone:  ${DEMO_PHONE}`);
  console.log(`    Name:   ${demoUser.name}`);
  console.log(`    Groups: ${Object.values(groupMap).map((g) => g.name).join(', ')}`);
  console.log('\n  To log in on device: use phone +15550000001 and enter any OTP code');
  console.log('  (dev mode OTP verification accepts any 6-digit code)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
