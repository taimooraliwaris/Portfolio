import {userClient} from '@/lib/supabase/server';
import {fail,sameOrigin} from '@/lib/server';
export async function POST(req:Request){if(!sameOrigin(req))return fail('Invalid origin',403);try{await (await userClient()).auth.signOut();return Response.json({ok:true})}catch{return fail('Could not sign out. Try again.',503)}}
