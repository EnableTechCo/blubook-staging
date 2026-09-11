import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicEditorialPage } from "@/components/public/PublicEditorialPage";
import { publicPages } from "@/content/publicPages";

type PageProps = {
  params: Promise<{ publicPage: string }>;
};

export function generateStaticParams() {
  return Object.keys(publicPages).map((publicPage) => ({ publicPage }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicPage } = await params;
  const page = publicPages[publicPage];
  if (!page) return {};

  return {
    title: page.title + " · BluBook",
    description: page.intro,
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { publicPage } = await params;
  const page = publicPages[publicPage];
  if (!page) notFound();

  return <PublicEditorialPage page={page} />;
}
