import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { withRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { distributionPointUpdateSchema } from "@/lib/validations";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id:string }> }) {
  const rl=withRateLimit("api")(request);
  const guard=await requirePermission("network.write");
  if(!guard.ok)return NextResponse.json({success:false,error:guard.status===401?"Unauthorized":"Forbidden"},{status:guard.status,headers:rl.headers});
  if(!rl.allowed)return NextResponse.json({success:false,error:"Too many requests"},{status:429,headers:rl.headers});
  const {id}=await params;
  const parsed=distributionPointUpdateSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success)return NextResponse.json({success:false,error:parsed.error.issues.map(x=>x.message).join(", ")},{status:400,headers:rl.headers});
  try{const data=await prisma.distributionPoint.update({where:{id},data:parsed.data});await auditLog({action:"UPDATE",resource:"DISTRIBUTION_POINT",resourceId:id,actorName:guard.session?.user?.name||undefined,details:parsed.data});return NextResponse.json({success:true,data},{headers:rl.headers});}
  catch{return NextResponse.json({success:false,error:"قطعة التوزيع غير موجودة"},{status:404,headers:rl.headers});}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const rl=withRateLimit("sensitive")(request);const guard=await requirePermission("network.write");
  if(!guard.ok)return NextResponse.json({success:false,error:guard.status===401?"Unauthorized":"Forbidden"},{status:guard.status,headers:rl.headers});
  if(!rl.allowed)return NextResponse.json({success:false,error:"Too many requests"},{status:429,headers:rl.headers});
  const {id}=await params;try{await prisma.distributionPoint.delete({where:{id}});await auditLog({action:"DELETE",resource:"DISTRIBUTION_POINT",resourceId:id,actorName:guard.session?.user?.name||undefined});return NextResponse.json({success:true},{headers:rl.headers});}catch{return NextResponse.json({success:false,error:"قطعة التوزيع غير موجودة"},{status:404,headers:rl.headers});}
}
