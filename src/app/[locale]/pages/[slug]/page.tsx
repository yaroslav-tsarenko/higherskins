import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
  });

  if (!page || !page.isActive) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 [overflow-wrap:anywhere]">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: page.title }]} />
      <h1 className="mb-5 break-words font-serif text-3xl font-medium tracking-tight text-[color:var(--color-text)] sm:text-[40px]">
        {page.title}
      </h1>
      <div
        className="text-[15px] leading-[1.75] text-[color:var(--color-text-secondary)]"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
