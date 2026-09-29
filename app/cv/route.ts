import {setting} from '@/lib/server';
export async function GET(req:Request){try{const key=await setting<string>('cv','');const download=new URL(req.url).searchParams.has('download');return Response.redirect(new URL(key?'/media/'+key+(download?'?download=1':''):'/Taimoor_Ali_Waris_CV.pdf',req.url),302)}catch{return Response.redirect(new URL('/Taimoor_Ali_Waris_CV.pdf',req.url),302)}}
