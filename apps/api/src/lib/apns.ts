import apn from 'apn';
import { readFileSync, existsSync } from 'fs';

let provider: apn.Provider | null = null;

export function getApnsProvider(): apn.Provider {
  if (!provider) {
    const keyPath = process.env.APNS_KEY_PATH ?? './apns-key.p8';
    const keyId = process.env.APNS_KEY_ID ?? '';
    const teamId = process.env.APNS_TEAM_ID ?? '';
    const production = process.env.APNS_ENV === 'production';

    let token: apn.ProviderOptions['token'];

    if (existsSync(keyPath)) {
      token = {
        key: readFileSync(keyPath),
        keyId,
        teamId,
      };
    } else if (process.env.APNS_KEY_CONTENT) {
      token = {
        key: Buffer.from(process.env.APNS_KEY_CONTENT, 'base64').toString('utf-8'),
        keyId,
        teamId,
      };
    } else {
      throw new Error('APNs key not found. Set APNS_KEY_PATH or APNS_KEY_CONTENT.');
    }

    provider = new apn.Provider({ token, production });
  }

  return provider;
}

export async function sendPushNotification(params: {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}): Promise<void> {
  const apnsProvider = getApnsProvider();
  const bundleId = process.env.APNS_BUNDLE_ID ?? 'com.hang.app';

  const notification = new apn.Notification();
  notification.alert = { title: params.title, body: params.body };
  notification.sound = 'default';
  notification.topic = bundleId;
  if (params.badge !== undefined) notification.badge = params.badge;
  if (params.data) {
    Object.assign(notification.payload, params.data);
  }

  const result = await apnsProvider.send(notification, params.deviceToken);

  if (result.failed.length > 0) {
    const failure = result.failed[0];
    console.error('APNs send failed:', failure.error ?? failure.response);
  }
}
