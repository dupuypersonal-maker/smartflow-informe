module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fuente } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
  const RESEND_KEY = process.env.RESEND_KEY;

  const errors = [];

  // 1. Save to Airtable
  try {
    const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
         Name: email,
          Fuente: fuente || 'Informe Inmobiliario 2025',
          Fecha: new Date().toISOString().split('T')[0],
        }
      })
    });
    if (!atRes.ok) {
      const err = await atRes.text();
      errors.push('Airtable: ' + err);
    }
  } catch (e) {
    errors.push('Airtable error: ' + e.message);
  }

  // 2. Send confirmation email via Resend
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Smartflow <onboarding@resend.dev>',
        to: [email],
        subject: 'Tu informe inmobiliario 2025 — Smartflow',
        html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ec;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(14,14,14,0.1)">
<tr><td style="background:#0e0e0e;padding:32px 40px">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-family:Georgia,serif;font-size:20px;color:#f5f2ec;letter-spacing:-0.02em">&#9679;&nbsp;Smartflow</td>
<td align="right" style="font-size:11px;color:rgba(245,242,236,0.4);letter-spacing:0.12em;text-transform:uppercase">Informe 2025</td>
</tr></table>
</td></tr>
<tr><td style="padding:40px 40px 32px">
<p style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;font-weight:500;margin:0 0 16px">Tu acceso está listo</p>
<h1 style="font-family:Georgia,serif;font-size:30px;color:#0e0e0e;margin:0 0 16px;line-height:1.15;letter-spacing:-0.025em;font-weight:400">El Informe Inmobiliario<br>Iberoamérica 2025.</h1>
<p style="font-size:15px;color:#888076;line-height:1.7;font-weight:300;margin:0 0 28px">Ya tienes acceso completo. Aquí tienes el link para volver a leerlo cuando quieras — o compartirlo con tu equipo.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;margin-bottom:28px">
<tr><td style="padding:24px 28px">
<p style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#dc2626;font-weight:500;margin:0 0 8px">Dato clave del informe</p>
<p style="font-family:Georgia,serif;font-size:40px;color:#dc2626;margin:0 0 4px;line-height:1;letter-spacing:-0.03em">63%</p>
<p style="font-size:14px;color:#888076;font-weight:300;margin:0">de agencias nunca responde a un lead. ¿Estás en ese grupo?</p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
<tr><td align="center">
<a href="https://smartflow-informe.vercel.app" style="display:inline-block;padding:14px 32px;background:#0e0e0e;color:#f5f2ec;text-decoration:none;border-radius:50px;font-size:15px;font-weight:500">Volver al informe →</a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid rgba(14,14,14,0.1);padding-top:28px">
<p style="font-size:15px;color:#0e0e0e;font-weight:500;margin:0 0 8px">¿Quieres aplicar esto a tu agencia?</p>
<p style="font-size:14px;color:#888076;font-weight:300;line-height:1.65;margin:0 0 20px">Agenda 30 minutos y te mostramos exactamente qué automatizar primero para estar en el top del mercado en 90 días.</p>
<a href="https://cal.com/smartflow.es/30min?user=smartflow.es" style="display:inline-block;padding:11px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:50px;font-size:14px;font-weight:500">Agendar sesión gratuita →</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#faf9f6;padding:24px 40px;border-top:1px solid rgba(14,14,14,0.06)">
<p style="font-size:12px;color:#888076;margin:0;font-weight:300;line-height:1.6">Smartflow · Consultoría de IA para empresas</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
      })
    });
    if (!emailRes.ok) {
      const err = await emailRes.text();
      errors.push('Resend: ' + err);
    }
  } catch (e) {
    errors.push('Resend error: ' + e.message);
  }

  return res.status(200).json({
    success: true,
    errors: errors.length > 0 ? errors : undefined
  });
}
