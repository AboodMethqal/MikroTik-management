import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/session";
import { withRateLimit } from "@/lib/rate-limit";
import { requirePermission } from "@/lib/authz";
import { buildClientCounts } from "@/lib/client-counting";
const check = withRateLimit("readonly");
export async function GET(request: Request) {
  const rl=check(request); if(!rl.allowed)return NextResponse.json({success:false,error:"Too many requests"},{status:429,headers:rl.headers});
  const {client,error}=await getAuthenticatedClient(); if(!client)return NextResponse.json({success:false,error:error||"Unauthorized"},{status:401,headers:rl.headers});
  try{
    // Optional sources: a router without ARP/IP-address data must still work.
    const [interfaces,wireless,hotspotActive,ipBindings,addresses,arp,leases]=await Promise.all([
      client.getInterfaces(),
      client.getWirelessClients(),
      client.getHotspotActive(),
      client.getHotspotIpBindings(),
      client.getInterfaceAddresses().catch(()=>[] as Awaited<ReturnType<typeof client.getInterfaceAddresses>>),
      client.getArpEntries().catch(()=>[] as Awaited<ReturnType<typeof client.getArpEntries>>),
      client.getDhcpLeases().catch(()=>[] as Awaited<ReturnType<typeof client.getDhcpLeases>>),
    ]);

    const clientCounts = buildClientCounts({interfaces,addresses,wireless,arp,leases,hotspotActive});

    const result=await Promise.all(interfaces.map(async item=>{
      const name=item.name||"";
      try{
        const t=await client.getInterfaceMonitorTraffic(name);
        return {...item,clientCount:clientCounts.get(name)||0,rxBitsPerSecond:Number(t["rx-bits-per-second"]||0),txBitsPerSecond:Number(t["tx-bits-per-second"]||0),rxBytes:Number(item["rx-byte"]||0),txBytes:Number(item["tx-byte"]||0)};
      }catch{return {...item,clientCount:clientCounts.get(name)||0,rxBytes:Number(item["rx-byte"]||0),txBytes:Number(item["tx-byte"]||0)};}
    }));
    await client.disconnect();
    return NextResponse.json({success:true,data:{interfaces:result,wirelessClients:wireless,hotspotActive,blockedClients:ipBindings.filter((x:any)=>x.type==="blocked")}},{headers:rl.headers});
  }
  catch(e){await client.disconnect().catch(()=>undefined);console.error(e);return NextResponse.json({success:false,error:"Failed to read network interfaces"},{status:500,headers:rl.headers});}
}