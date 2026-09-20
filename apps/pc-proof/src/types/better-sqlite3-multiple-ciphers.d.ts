/**
 * Declarations for `better-sqlite3-multiple-ciphers`.
 *
 * The package ships `index.d.ts` but omits types from `package.json#exports`,
 * so TypeScript (moduleResolution: Bundler) cannot resolve them. This ambient
 * module mirrors the subset we use — no `any`, no silent widening.
 */
declare module 'better-sqlite3-multiple-ciphers' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement<BindParameters extends unknown[] = unknown[], Result = unknown> {
    run(...params: BindParameters): RunResult;
    get(...params: BindParameters): Result | undefined;
    all(...params: BindParameters): Result[];
  }

  interface Database {
    prepare<BindParameters extends unknown[] = unknown[], Result = unknown>(
      source: string,
    ): Statement<BindParameters, Result>;
    exec(source: string): Database;
    pragma(source: string, options?: { simple?: boolean }): unknown;
    transaction<T extends unknown[], R>(fn: (...args: T) => R): (...args: T) => R;
    close(): Database;
  }

  interface DatabaseConstructor {
    new (
      filename?: string | Buffer,
      options?: {
        readonly?: boolean;
        fileMustExist?: boolean;
        timeout?: number;
      },
    ): Database;
    prototype: Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
