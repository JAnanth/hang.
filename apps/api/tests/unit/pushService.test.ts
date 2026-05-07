import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPushNotification } from '../../src/lib/apns';

describe('pushService', () => {
  it('sendPushNotification is a mock in test environment', () => {
    expect(typeof sendPushNotification).toBe('function');
  });

  it('mock resolves without throwing', async () => {
    await expect(
      sendPushNotification({
        deviceToken: 'fake-token',
        title: 'Test',
        body: 'Test body',
        data: { type: 'NEW_EVENT', eventId: '123' },
      })
    ).resolves.toBeUndefined();
  });
});
