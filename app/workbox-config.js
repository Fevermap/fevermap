module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{png,html,js,css}'],
  swDest: 'dist/service-worker.js',
  swSrc: 'src/service-worker.js',
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
};
