declare module '@wix/jobs' {
  export const jobs: {
    handler: <TResult = void>(
      fn: (job: unknown, metadata: unknown) => TResult | Promise<TResult>,
    ) => unknown
  }
}

declare module '@wix/astro/builders' {
  export const jobs: {
    job: (config: {
      id: string
      cron: string
      source: string
    }) => unknown
  }
}
