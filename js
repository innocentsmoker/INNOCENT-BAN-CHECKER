// /api/check-number.js — uses Meta's official WhatsApp Cloud API
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/contacts

async function checkWhatsAppRegistration(e164) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return { status: 'unverified', source: 'no-provider' };
  }

  // Meta expects the number WITHOUT the leading +
  const to = e164.replace('+', '');

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneId}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocking: 'wait',
        contacts: [`+${to}`],
        force_check: true,
      }),
    }
  );

  if (!res.ok) {
    return { status: 'unverified', source: 'meta-error', httpStatus: res.status };
  }

  const data = await res.json();
  const contact = data.contacts?.[0];

  // Meta returns { status: "valid" | "invalid" }
  if (contact?.status === 'valid') {
    return { status: 'available', source: 'meta' };   // registered on WhatsApp
  }
  if (contact?.status === 'invalid') {
    return { status: 'restricted', source: 'meta' };  // not on WhatsApp
  }
  return { status: 'unverified', source: 'meta-unknown' };
}
