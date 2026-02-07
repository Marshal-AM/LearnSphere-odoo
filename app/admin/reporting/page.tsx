import { getReportingData } from '@/lib/queries';
import ReportingClient from './reporting-client';

export default async function ReportingPage() {
  const data = await getReportingData();
  return <ReportingClient data={data} />;
}
