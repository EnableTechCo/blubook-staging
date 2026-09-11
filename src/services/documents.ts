import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

/** The caller's document archive and folder tree. RLS scopes both to the caller. */

export interface DocumentRow {
  id: string;
  title: string;
  category: Enums<"document_category">;
  expires_at: string | null;
  created_at: string;
  // Where the current owner has filed this document in their own tree (null =
  // unfiled). Populated from document_filings scoped to the caller.
  folder_id: string | null;
}

export interface DocumentFolder {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  sort_order: number;
}

// The caller's own folder tree, parents ordered first with their children.
export async function getDocumentFolders(): Promise<DocumentFolder[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_categories")
    .select("id,parent_id,slug,name,sort_order")
    .eq("active", true)
    .order("sort_order")
    .returns<DocumentFolder[]>();
  return data ?? [];
}

// The caller's own document archive, RLS-scoped to the client's documents.
// Each row carries where the caller has filed it in their own tree
// (document_filings is RLS-scoped to the caller, so the embedded filing is
// theirs alone). A partner's archive is arranged differently and read through
// services/partnerArchive.ts.
export async function getDocumentArchive(): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id,title,category,expires_at,created_at,document_filings(category_id)")
    .order("created_at", { ascending: false })
    .returns<{
      id: string;
      title: string;
      category: Enums<"document_category">;
      expires_at: string | null;
      created_at: string;
      document_filings: { category_id: string }[];
    }[]>();

  return (data ?? []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    expires_at: doc.expires_at,
    created_at: doc.created_at,
    folder_id: doc.document_filings[0]?.category_id ?? null,
  }));
}
