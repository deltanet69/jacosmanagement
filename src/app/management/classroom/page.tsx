import { getAllClassesWithStats } from "./actions";
import ClassroomListClient from "./client-page";

export const dynamic = "force-dynamic";

export default async function ClassroomIndexPage() {
  const { classes, stats } = await getAllClassesWithStats();

  return <ClassroomListClient initialClasses={classes} initialStats={stats} />;
}
