import {createHmac} from 'node:crypto';
import {serviceClient,fail,sameOrigin,readBody} from '@/lib/server';
import {contactSchema} from '@/lib/validation';
import {notifyOwner} from '@/lib/email';
export const runtime='nodejs';
export async function POST(req:Request){if(!sameOrigin(req))return fail('Please submit from this website.',403);let body;try{body=JSON.parse(await readBody(req,15000))}catch{return fail('Invalid or oversized submission.',400)}const parsed=contactSchema.safeParse(body);if(!parsed.success)return fail('Check your name, email, subject, and message (10–5,000 characters).');if(parsed.data.website)return fail('Unable to accept this submission.');
try{const secret=process.env.RATE_LIMIT_SECRET;if(!secret)throw Error('Rate limit configuration missing');const ip=process.env.VERCEL?req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim():req.headers.get('x-real-ip');const hash=createHmac('sha256',secret).update(ip||'unknown').digest('hex');const {name,email,subject,message}=parsed.data;const {data:id,error}=await serviceClient().rpc('portfolio_submit_contact',{p_name:name,p_email:email,p_subject:subject,p_message:message,p_rate_key:hash});if(error){if(error.message.includes('RATE_LIMIT'))return fail('Too many messages. Try later or use email.',429);throw error}
// Store first, then notify. Email failure never discards a saved enquiry.
await notifyOwner(String(id),{name,email,subject,message}).catch(()=>console.error('Notification deferred'));return Response.json({ok:true});}catch{console.error('Contact submission could not be stored');return fail('Your message could not be saved. Please retry or use the email/WhatsApp links.',503)}}
