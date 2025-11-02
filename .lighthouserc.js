module.exports = {
  ci: {
    collect: {
      url: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
      numberOfRuns: 1,
      settings: {
        emulatedFormFactor: 'mobile',
        throttlingMethod: 'simulate',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
