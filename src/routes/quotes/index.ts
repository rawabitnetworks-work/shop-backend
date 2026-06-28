import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { supabase } from '../../lib/supabase';
import { sendMail } from '../../lib/mailer';

const router = Router();

// POST /api/quotes/submit
router.post('/submit', asyncHandler(async (req, res) => {
  const { name, phone, email, service, message } = req.body;

  if (!name || !phone || !email || !service || !message) {
    return res.status(400).json({
      success: false,
      error: { message: 'Missing required fields', required: ['name', 'phone', 'email', 'service', 'message'] }
    });
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({ name, phone, email, service, message })
    .select()
    .single();

  if (error) throw error;

  // Send email notification (non-blocking — don't fail the request if mail fails)
  sendMail(
    '📩 New Quote Request Received',
    `<h2>New Quote from ${name}</h2>
     <p><strong>Phone:</strong> ${phone}</p>
     <p><strong>Email:</strong> ${email}</p>
     <p><strong>Service:</strong> ${service}</p>
     <p><strong>Message:</strong></p>
     <p>${message}</p>
     <em>Received at ${new Date().toISOString()}</em>`
  ).catch(err => console.error('❌ Failed to send quote email:', err));

  return res.status(201).json({ success: true, data });
}));
// GET /api/quotes
router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return res.json({ success: true, data });
}));

// GET /api/quotes/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) throw error;
  if (!data) return res.status(404).json({ success: false, error: { message: 'Quote not found' } });

  return res.json({ success: true, data });
}));

// PUT /api/quotes/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, phone, email, service, message } = req.body;

  const { data, error } = await supabase
    .from('quotes')
    .update({ name, phone, email, service, message })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;

  return res.json({ success: true, data });
}));

// PATCH /api/quotes/:id/marked
router.patch('/:id/marked', asyncHandler(async (req, res) => {
  const { marked } = req.body;

  const { data, error } = await supabase
    .from('quotes')
    .update({ marked })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;

  return res.json({ success: true, data });
}));

// DELETE /api/quotes/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;

  return res.json({ success: true, message: 'Quote deleted successfully' });
}));

export default router;