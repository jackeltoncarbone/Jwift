/**
 * Ambient declaration for `*.jss` imports — the consumer app's Angular
 * build inlines the file's UTF-8 text as the default export.
 */
declare module '*.jss' {
  const source: string;
  export default source;
}
