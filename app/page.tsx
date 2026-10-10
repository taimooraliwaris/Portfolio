import Portfolio from './portfolio';
import {content} from '@/lib/server';
import {initialProfile,initialProjects} from '@/lib/content';
export const dynamic='force-dynamic';
export default async function Page(){let data;try{data=await content()}catch{data={profile:initialProfile,projects:initialProjects}}return <Portfolio initial={data}/>}
