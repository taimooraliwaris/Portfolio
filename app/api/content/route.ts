import {content,fail} from '@/lib/server';
export async function GET(){try{return Response.json(await content(),{headers:{'Cache-Control':'no-store'}})}catch(e){console.error('content',e);return fail('Portfolio updates are temporarily unavailable.',503)}}
