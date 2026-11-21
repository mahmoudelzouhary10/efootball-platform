import Link from 'next/link';
import { CONCEPTS, SCREENS } from '@/design-preview/preview-bar';

export default async function PreviewIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <main className="mx-auto max-w-3xl p-8 font-mono text-sm" dir="ltr">
      <h1 className="mb-6 text-xl">Design concepts — preview</h1>
      {CONCEPTS.map((c) => (
        <section key={c.id} className="mb-6">
          <h2 className="mb-2 text-base">{c.label}</h2>
          <ul className="flex flex-wrap gap-3">
            {SCREENS.map((s) => (
              <li key={s}>
                <Link className="underline" href={`/design/${lang}/${c.id}/${s}`}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
