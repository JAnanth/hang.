import { Queue, Worker } from 'bullmq';
import { getRedis } from '../lib/redis.js';
import { sendEventReminder } from '../services/pushService.js';

const QUEUE_NAME = 'event-reminders';

let reminderQueue: Queue | null = null;
let reminderWorker: Worker | null = null;

export function getReminderQueue(): Queue {
  if (!reminderQueue) {
    reminderQueue = new Queue(QUEUE_NAME, {
      connection: getRedis(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    });
  }
  return reminderQueue;
}

export async function scheduleEventReminder(eventId: string, confirmedTime: Date): Promise<void> {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const fireAt = new Date(confirmedTime.getTime() - ONE_HOUR_MS);
  const delay = Math.max(0, fireAt.getTime() - Date.now());

  if (delay === 0 && fireAt < new Date()) {
    return;
  }

  const queue = getReminderQueue();
  await queue.add(
    'remind',
    { eventId },
    {
      delay,
      jobId: `reminder:${eventId}`,
    }
  );
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  const queue = getReminderQueue();
  const job = await queue.getJob(`reminder:${eventId}`);
  if (job) {
    await job.remove();
  }
}

export function startReminderWorker(): Worker {
  if (reminderWorker) return reminderWorker;

  reminderWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { eventId } = job.data as { eventId: string };
      await sendEventReminder(eventId);
    },
    {
      connection: getRedis(),
      concurrency: 5,
    }
  );

  reminderWorker.on('failed', (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err);
  });

  return reminderWorker;
}
