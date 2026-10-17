import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedStateChangeOrigin } from "@/lib/security/request";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAllowedStateChangeOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: actor } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (actor?.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: "Cannot delete the active super admin" }, { status: 409 });
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
  if (target?.role === "super_admin") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
    if ((count ?? 0) <= 1) return NextResponse.json({ error: "Cannot delete the last super admin" }, { status: 409 });
  }
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: "Unable to delete user" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
