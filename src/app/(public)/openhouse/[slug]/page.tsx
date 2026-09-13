import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import OpenHouseRegistration from '../open-house-registration';
import { getOpenHouseEventBySlug } from '@/app/management/openhouse/event-actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getOpenHouseEventBySlug(slug);

  if (!event) {
    return {
      title: 'Open House Tidak Ditemukan - JACOS',
      description: 'Acara Open House yang Anda cari tidak tersedia atau telah berakhir.',
    };
  }

  return {
    title: `Pendaftaran ${event.name} - Jakarta Cosmopolite Islamic School`,
    description: event.description || 'Daftarkan putra-putri tercinta untuk mengikuti JACOS Open House.',
    openGraph: {
      title: event.name,
      description: event.description,
      images: event.banner_url ? [{ url: event.banner_url }] : [],
    },
  };
}

export default async function PublicOpenHouseEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getOpenHouseEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return <OpenHouseRegistration event={event} />;
}
