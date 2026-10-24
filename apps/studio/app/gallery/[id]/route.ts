import {handle,galleryAuth} from '../../../lib/auth.ts';
import {renderGallery,galleryHeaders} from '../../../lib/gallery.ts';
import {uuid} from '../../../lib/service.ts';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){return handle(async()=>{const id=uuid.parse((await params).id),g=galleryAuth(req,id);return new Response(renderGallery(g),{headers:galleryHeaders});});}
