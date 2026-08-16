import { getAllClasses } from "./actions";
import ClassroomListClient from "./client-page";

export const dynamic = "force-dynamic";

export default async function ClassroomIndexPage() {
  const classes = await getAllClasses();
  
  return <ClassroomListClient initialClasses={classes} />;
}
