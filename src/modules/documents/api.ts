import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChildDocument = Database["public"]["Tables"]["child_documents"]["Row"];

export const DOC_CATEGORIES = [
  { value: "laudo", label: "Laudo" },
  { value: "receita", label: "Receita médica" },
  { value: "pei", label: "PEI escolar" },
  { value: "relatorio", label: "Relatório terapêutico" },
  { value: "exame", label: "Exame" },
  { value: "geral", label: "Geral" },
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number]["value"];

export async function listDocuments(childId: string): Promise<ChildDocument[]> {
  const { data, error } = await supabase
    .from("child_documents")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadDocument(input: {
  childId: string;
  file: File;
  title: string;
  category: DocCategory;
  notes?: string;
  issuedAt?: string | null;
}): Promise<ChildDocument> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const cleanName = input.file.name.replace(/[^\w.\-]/g, "_");
  const path = `${input.childId}/${crypto.randomUUID()}-${cleanName}`;

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("child_documents")
    .insert({
      child_id: input.childId,
      uploaded_by: userId,
      title: input.title,
      category: input.category,
      storage_path: path,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
      notes: input.notes || null,
      issued_at: input.issuedAt || null,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from("documents").remove([path]);
    throw error;
  }
  return data;
}

export async function getDocumentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(doc: ChildDocument): Promise<void> {
  const { error } = await supabase.from("child_documents").delete().eq("id", doc.id);
  if (error) throw error;
  await supabase.storage.from("documents").remove([doc.storage_path]);
}
