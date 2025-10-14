module.exports = {
  // Run type-check on TypeScript files (runs on whole project since types can affect multiple files)
  '**/*.{ts,tsx}': () => 'pnpm type-check',

  // Run ESLint on JavaScript/TypeScript files (staged files only would be ideal but turbo runs on all)
  '**/*.{js,jsx,ts,tsx}': () => 'pnpm lint',

  // Format only the staged files
  '**/*.{js,jsx,ts,tsx,json,md,css,scss}': filenames =>
    `prettier --write ${filenames.join(' ')}`,
};
