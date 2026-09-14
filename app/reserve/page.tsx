import { listSchoolsPublic } from "./actions";
import ReserveWizard from "./ReserveWizard";

export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const schools = await listSchoolsPublic();
  return <ReserveWizard schools={schools} />;
}
