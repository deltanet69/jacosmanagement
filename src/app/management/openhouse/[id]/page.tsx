import { notFound } from 'next/navigation';
import OpenHouseClient from '../client-page';
import OpenHouseEventHeader from './event-header';
import { getOpenHouseRegistrations } from '../actions';
import { getOpenHouseEventById } from '../event-actions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getOpenHouseEventById(id);
  return {
    title: event ? `${event.name} - Audience Open House` : 'Detail Open House',
    description: 'Kelola data audience dan pendaftar Open House JACOS',
  };
}

export default async function OpenHouseEventAudiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, { registrations, stats, setting }] = await Promise.all([
    getOpenHouseEventById(id),
    getOpenHouseRegistrations(id),
  ]);

  if (!event) notFound();

  return (
    <div className="space-y-8">
      <OpenHouseEventHeader event={event} />
      <OpenHouseClient
        eventId={id}
        event={event}
        initialRegistrations={registrations}
        initialStats={stats}
        initialSetting={setting}
      />
    </div>
  );
}
