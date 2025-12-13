'use client';

import JobScheduleView from '@/components/schedule/JobScheduleView';

export default function Page({ params }: { params: { jobId: string } }) {
  const jobId = Number(params.jobId);
  return <JobScheduleView jobId={jobId} />;
}
