import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
export async function GET(request: NextRequest){
  const rl=withRateLimit("readonly")(request); if(!rl.allowed)return NextResponse.json({success:false,error:"Too many requests"},{status:429,headers:rl.headers});
  const guard=await requirePermission("network.read"); if(!guard.ok)return NextResponse.json({success:false,error:guard.status===401?"Unauthorized":"Forbidden"},{status:guard.status,headers:rl.headers});
  const q=new URL(request.url).searchParams; const search=q.get("search")?.trim()||""; const since=new Date(Date.now()-7*86400000);
  const where:any={recordedAt:{gte:since}}; if(search) where.OR=[{username:{contains:search}},{macAddress:{contains:search}},{address:{contains:search}}];
  const rows=await prisma.sessionSnapshot.findMany({where,orderBy:{recordedAt:"desc"},take:1000});
  const byMac=new Map<string,{mac:string;username:string;bytesIn:number;bytesOut:number;sessions:number;lastSeen:Date}>();
  for(const r of rows){const mac=r.macAddress||"-";const x=byMac.get(mac)||{mac,username:r.username,bytesIn:0,bytesOut:0,sessions:0,lastSeen:r.recordedAt};x.bytesIn+=r.bytesIn;x.bytesOut+=r.bytesOut;x.sessions++;if(r.recordedAt>x.lastSeen)x.lastSeen=r.recordedAt;byMac.set(mac,x)}
  return NextResponse.json({success:true,data:{snapshots:rows,byMac:Array.from(byMac.values()).sort((a,b)=>b.bytesIn+b.bytesOut-a.bytesIn-a.bytesOut)}},{headers:rl.headers});
}
