import type { Lang } from '@/design-preview/data';
import { TypeSpecimen } from '@/design-preview/matchnight/type-specimen';

export function generateStaticParams() {
  return [{ lang: 'ar' }, { lang: 'en' }];
}

export default async function Page({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  return <TypeSpecimen lang={lang} />;
}
