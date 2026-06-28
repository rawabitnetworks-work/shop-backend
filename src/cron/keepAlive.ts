import cron from 'node-cron';
import { supabase } from '../lib/supabase';
import { sendMail } from '../lib/mailer';

cron.schedule('0 0 */5 * *', async () => {
  try {
    await supabase.from('quotes').select('id').limit(1);
    console.log('✅ Supabase keep-alive ping sent');

    await sendMail(
      '✅ Supabase Keep-Alive Ping Successful',
      `<p>Supabase was pinged successfully at <strong>${new Date().toISOString()}</strong>.</p>
       <p>Everything is running fine.</p>`
    );
  } catch (err: any) {
    console.error('❌ Keep-alive ping failed:', err);

    await sendMail(
      '🚨 Supabase Keep-Alive Ping FAILED',
      `<p>The keep-alive ping to Supabase <strong>failed</strong> at ${new Date().toISOString()}.</p>
       <h3>Error:</h3>
       <pre>${err?.message}</pre>
       <pre>${err?.stack}</pre>
       <p>Supabase may be paused or unreachable. Please check immediately.</p>`
    );
  }
});