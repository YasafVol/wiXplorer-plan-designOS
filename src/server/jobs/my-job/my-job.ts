import { jobs } from '@wix/jobs'

export default jobs.handler(async (job: unknown, metadata: unknown) => {
  void job
  void metadata

  // Hourly sync entry point for Contact collection maintenance.
})
