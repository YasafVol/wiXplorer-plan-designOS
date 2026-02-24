import { jobs } from '@wix/jobs'

export default jobs.handler(async (job, metadata) => {
  void job
  void metadata

  // Hourly sync entry point for Contact collection maintenance.
})
