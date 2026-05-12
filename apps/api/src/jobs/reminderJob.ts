import { Queue, Worker } from 'bullmq';
import { getRedis } from '../lib/redis';
import { sendEventReminder } from '../services/pushService';
import prisma from '../lib/prisma';

const REMINDER_QUEUE = 'event-reminders';
const AUTO_CLOSE_QUEUE = 'event-auto-close';

// ── Reminder queue ──────────────────────────────────────────────────

let reminderQueue: Queue | null = null;
let reminderWorker: Worker | null = null;

export function getReminderQueue(): Queue {
  if (!reminderQueue) {
    reminderQueue = new Queue(REMINDER_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 1000 },
    });
  }
  return reminderQueue;
}

export async function scheduleEventReminder(eventId: string, confirmedTime: Date): Promise<void> {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const fireAt = new Date(confirmedTime.getTime() - ONE_HOUR_MS);
  const delay = Math.max(0, fireAt.getTime() - Date.now());

  if (delay === 0 && fireAt < new Date()) return;

  const queue = getReminderQueue();
  await queue.add('remind', { eventId }, { delay, jobId: `reminder:${eventId}` });
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  const queue = getReminderQueue();
  const job = await queue.getJob(`reminder:${eventId}`);
  if (job) await job.remove();
}

export function startReminderWorker(): Worker {
  if (reminderWorker) return reminderWorker;

  reminderWorker = new Worker(
    REMINDER_QUEUE,
    async (job) => {
      const { eventId } = job.data as { eventId: string };
      await sendEventReminder(eventId);
    },
    { connection: getRedis(), concurrency: 5 }
  );

  reminderWorker.on('failed', (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err);
  });

  return reminderWorker;
}

// ── Auto-close queue ────────────────────────────────────────────────

let autoCloseQueue: Queue | null = null;
let autoCloseWorker: Worker | null = null;

function getAutoCloseQueue(): Queue {
  if (!autoCloseQueue) {
    autoCloseQueue = new Queue(AUTO_CLOSE_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 500 },
    });
  }
  return autoCloseQueue;
}

export async function scheduleEventAutoClose(eventId: string, closeAt: Date): Promise<void> {
  const delay = Math.max(0, closeAt.getTime() - Date.now());
  const queue = getAutoCloseQueue();
  await queue.add('close', { eventId }, { delay, jobId: `autoclose:${eventId}` });
}

export async function cancelEventAutoClose(eventId: string): Promise<void> {
  const queue = getAutoCloseQueue();
  const job = await queue.getJob(`autoclose:${eventId}`);
  if (job) await job.remove();
}

export function startAutoCloseWorker(): Worker {
  if (autoCloseWorker) return autoCloseWorker;

  autoCloseWorker = new Worker(
    AUTO_CLOSE_QUEUE,
    async (job) => {
      const { eventId } = job.data as { eventId: string };
      await prisma.event.updateMany({
        where: { id: eventId, status: { in: ['active', 'confirmed'] } },
        data: { status: 'ended' },
      });
    },
    { connection: getRedis(), concurrency: 10 }
  );

  autoCloseWorker.on('failed', (job, err) => {
    console.error(`Auto-close job ${job?.id} failed:`, err);
  });

  return autoCloseWorker;
}
