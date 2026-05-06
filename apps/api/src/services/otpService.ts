import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    client = twilio(accountSid, authToken);
  }

  return client;
}

export async function sendOtp(phone: string): Promise<void> {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error('Twilio Verify service SID not configured');

  await getTwilioClient().verify.v2.services(serviceSid).verifications.create({
    to: phone,
    channel: 'sms',
  });
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error('Twilio Verify service SID not configured');

  try {
    const check = await getTwilioClient().verify.v2.services(serviceSid).verificationChecks.create({
      to: phone,
      code,
    });

    return check.status === 'approved';
  } catch {
    return false;
  }
}
