import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
export function configured(){return !!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;}
function config(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Supabase is not configured');return {url,key};}
const boundedFetch:typeof fetch=(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(8000)});
export async function userClient(){const {url,key}=config();const jar=await cookies();return createServerClient(url,key,{global:{fetch:boundedFetch},cookies:{getAll:()=>jar.getAll(),setAll:(list)=>{try{list.forEach(({name,value,options})=>jar.set(name,value,options))}catch{/* Refreshed by proxy for Server Components. */}}}});}
export function publicClient(){const {url,key}=config();return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:boundedFetch}});}
export function serviceClient(){const {url}=config(),key=process.env.SUPABASE_SECRET_KEY;if(!key)throw new Error('Server Supabase key is not configured');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:boundedFetch}});}
