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

// Phones in this set skip Twilio and accept code "000000" (dev/demo use only).
const DEV_PHONES = new Set([
  '+15550000001',
  '+15550000002',
  '+15550000003',
  '+15550000004',
  '+15550000005',
  '+15550000006',
  '+15550000007',
]);
const DEV_OTP_CODE = '000000';

export async function sendOtp(phone: string): Promise<void> {
  if (DEV_PHONES.has(phone)) {
    console.log(`[dev] OTP for ${phone}: ${DEV_OTP_CODE}`);
    return;
  }

  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid) throw new Error('Twilio Verify service SID not configured');

  await getTwilioClient().verify.v2.services(serviceSid).verifications.create({
    to: phone,
    channel: 'sms',
  });
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (DEV_PHONES.has(phone)) {
    return code === DEV_OTP_CODE;
  }

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
