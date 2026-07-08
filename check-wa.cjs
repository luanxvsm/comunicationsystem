require('dotenv').config();
const { Pool } = require('pg');
const twilio = require('twilio');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

pool.query(
  `SELECT id, "to", status, "providerMessageId", error, "createdAt"
   FROM "Message"
   WHERE "messageType" = 'WHATSAPP'
   ORDER BY "createdAt" DESC
   LIMIT 5`,
  [],
  async (err, res) => {
    if (err) { console.error('DB Erro:', err.message); pool.end(); return; }

    console.log('\n=== Últimas mensagens WhatsApp ===\n');
    for (const r of res.rows) {
      console.log('Para:      ', r.to);
      console.log('Status DB: ', r.status);
      console.log('Erro DB:   ', r.error ?? 'nenhum');
      console.log('Data:      ', new Date(r.createdAt).toLocaleString('pt-BR'));

      if (r.providerMessageId) {
        try {
          const msg = await client.messages(r.providerMessageId).fetch();
          console.log('Status Twilio:', msg.status);
          console.log('Erro código:  ', msg.errorCode ?? 'nenhum');
          console.log('Erro msg:     ', msg.errorMessage ?? 'nenhuma');
        } catch(e) {
          console.log('Twilio fetch erro:', e.message);
        }
      } else {
        console.log('Twilio SID:  (não registrado)');
      }
      console.log('-'.repeat(50));
    }
    pool.end();
  }
);
