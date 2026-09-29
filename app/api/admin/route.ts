import {adminClient,content,fail,sameOrigin,readBody} from '@/lib/server';
import {profileSchema,projectSchema} from '@/lib/validation';
import {notifyOwner} from '@/lib/email';
export async function GET(){try{const client=await adminClient();if(!client)return fail('Not authorized',403);const {data:messages,error}=await client.from('portfolio_messages').select('*').order('created_at',{ascending:false}).limit(500);if(error)throw error;return Response.json({...await content(true),messages},{headers:{'Cache-Control':'private, no-store'}})}catch{return fail('Unable to load your workspace.',503)}}
export async function POST(req:Request){if(!sameOrigin(req))return fail('Not authorized',403);try{const client=await adminClient();if(!client)return fail('Not authorized',403);const body=JSON.parse(await readBody(req,50000));let result;
if(body.action==='project'){const p=projectSchema.safeParse(body.value);if(!p.success)return fail(p.error.issues[0].message);const v=p.data;result=await client.from('portfolio_projects').upsert({id:v.id,data:v,published:v.published,position:v.position});}
else if(body.action==='profile'){const p=profileSchema.safeParse(body.value);if(!p.success)return fail(p.error.issues[0].message);result=await client.from('portfolio_settings').upsert({key:'profile',value:p.data});}
else if(body.action==='deleteProject')result=await client.from('portfolio_projects').delete().eq('id',String(body.id));
else if(body.action==='readMessage')result=await client.from('portfolio_messages').update({read:true}).eq('id',String(body.id));
else if(body.action==='deleteMessage')result=await client.from('portfolio_messages').delete().eq('id',String(body.id));
else if(body.action==='retryEmail'){const {data,error}=await client.from('portfolio_messages').select('*').eq('id',String(body.id)).maybeSingle();if(error||!data)return fail('Message not found',404);if(data.email_status==='sent')return Response.json({ok:true});const status=await notifyOwner(data.id,data);if(status!=='sent')return fail('Email not sent. Check Resend configuration or quota. The message remains saved.',503);return Response.json({ok:true});}
else return fail('Unknown action');if(result.error)throw result.error;return Response.json({ok:true});}catch{return fail('Changes were not saved. Please retry.',503)}}
