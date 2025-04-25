declare module '*.csv' {
  interface CsvRow {
    [key: string]: string | number | undefined;
  }
  const content: CsvRow[];
  export default content;
}