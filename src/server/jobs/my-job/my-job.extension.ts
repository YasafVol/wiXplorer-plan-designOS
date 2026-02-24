import { jobs } from '@wix/astro/builders'

export default jobs.job({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  cron: '0 * * * *', // every hour
  source: './my-job.ts',
})
