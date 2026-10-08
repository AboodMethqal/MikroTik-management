import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/session";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest){
 const rl=withRateLimit("readonly")(request); if(!rl.allowed)return NextResponse.json({success:false,error:"Too many requests"},{status:429,headers:rl.headers});
 const guard=await requirePermission("network.read"); if(!guard.ok)return NextResponse.json({success:false,error:guard.status===401?"Unauthorized":"Forbidden"},{status:guard.status,headers:rl.headers});
 const {client,error}=await getAuthenticatedClient(); if(!client)return NextResponse.json({success:false,error:error||"Unauthorized"},{status:401,headers:rl.headers});
 try{
   const resource=await client.getSystemResource(); const interfaces=await client.getInterfaces(); const wireless=await client.getWirelessClients(); await client.disconnect();
   const cpu=Number(resource["cpu-load"]||0); const totalMem=Number(resource["total-memory"]||0); const freeMem=Number(resource["free-memory"]||0); const memUsed=totalMem?Math.round((1-freeMem/totalMem)*100):0;
   const down=interfaces.filter((x:any)=>x.running!=="true").map((x:any)=>x.name);
   const alerts=[...(cpu>=85?[{severity:"CRITICAL",title:"ارتفاع استهلاك المعالج",message:`استهلاك المعالج ${cpu}%`}]:cpu>=70?[{severity:"WARNING",title:"ارتفاع استهلاك المعالج",message:`استهلاك المعالج ${cpu}%` }]:[]),...(memUsed>=90?[{severity:"CRITICAL",title:"الذاكرة شبه ممتلئة",message:`استخدام الذاكرة ${memUsed}%`}]:memUsed>=75?[{severity:"WARNING",title:"ارتفاع استخدام الذاكرة",message:`استخدام الذاكرة ${memUsed}%`}]:[]),...(down.length?[{severity:"WARNING",title:"منافذ غير متصلة",message:`عدد المنافذ غير المتصلة ${down.length}`}]:[])];
   for(const a of alerts){const recent=await prisma.systemNotification.findFirst({where:{title:a.title,readAt:null,createdAt:{gte:new Date(Date.now()-15*60*1000)}}});if(!recent)await prisma.systemNotification.create({data:{severity:a.severity as any,title:a.title,message:a.message}});}
   const notifications=await prisma.systemNotification.findMany({where:{readAt:null},orderBy:{createdAt:"desc"},take:20});
   return NextResponse.json({success:true,data:{resource,cpu,memoryUsed:memUsed,interfaces,wirelessClients:wireless,downInterfaces:down,alerts,notifications}},{headers:rl.headers});
 }catch(e){await client.disconnect().catch(()=>undefined);return NextResponse.json({success:false,error:"تعذر قراءة صحة الراوتر"},{status:502,headers:rl.headers});}
}
