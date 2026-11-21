import { notFound } from 'next/navigation';
import type { Lang } from '@/design-preview/data';
import { PreviewBar, SCREENS, type Screen } from '@/design-preview/preview-bar';
import { FEDERATION } from '@/design-preview/federation/screens';

export function generateStaticParams() {
  return ['ar', 'en'].flatMap((lang) => SCREENS.map((screen) => ({ lang, screen })));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Lang; screen: Screen }>;
  searchParams: Promise<{ clean?: string }>;
}) {
  const [{ lang, screen }, { clean }] = await Promise.all([params, searchParams]);
  const View = FEDERATION[screen];
  if (!View) notFound();
  return (
    <>
      <View lang={lang} />
      {!clean && <PreviewBar lang={lang} concept="federation" screen={screen} />}
    </>
  );
}
