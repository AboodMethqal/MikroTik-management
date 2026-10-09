"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roles = ["ADMIN", "NETWORK_ADMIN", "SALES_MANAGER", "CASHIER", "VIEWER"];
export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]); const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", role: "VIEWER" });
  async function load(){ const r=await fetch("/api/admin-users"); const j=await r.json(); if(j.success)setUsers(j.data); else setError(j.error||"فشل التحميل"); }
  useEffect(()=>{load()},[]);
  async function create(){setError(""); const r=await fetch("/api/admin-users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});const j=await r.json();if(!j.success)setError(j.error);else{setForm({username:"",password:"",role:"VIEWER"});load();}}
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">مستخدمو النظام</h1><p className="text-sm text-muted-foreground">إدارة الحسابات والصلاحيات</p></div>{error&&<p className="text-destructive">{error}</p>}<Card><CardHeader><CardTitle>إضافة مستخدم</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><Label>اسم المستخدم</Label><Input value={form.username} onChange={e=>setForm({...form,username:e.target.value})}/></div><div><Label>كلمة المرور (12 حرفًا على الأقل)</Label><Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div><div><Label>الصلاحية</Label><select className="w-full rounded-md border p-2" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{roles.map(r=><option key={r}>{r}</option>)}</select></div><div className="flex items-end"><Button onClick={create}>إضافة</Button></div></CardContent></Card><Card><CardHeader><CardTitle>الحسابات</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="p-2 text-right">المستخدم</th><th className="p-2 text-right">الصلاحية</th><th className="p-2 text-right">الحالة</th><th className="p-2 text-right">آخر دخول</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-b"><td className="p-2">{u.username}</td><td className="p-2">{u.role}</td><td className="p-2">{u.active?"فعال":"معطل"}</td><td className="p-2">{u.lastLoginAt?new Date(u.lastLoginAt).toLocaleString("ar"):"-"}</td></tr>)}</tbody></table></div></CardContent></Card></div>;
}
