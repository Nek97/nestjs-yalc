/* istanbul ignore file */

type EnvObj = { [key: string]: string };

/**
 *  Used as a helper to make jest tests cleaner when working with process.env
 */
export function envTestHelper(env?: EnvObj) {
  const OLD_ENV = process.env;

  if (env) {
    process.env = env;
  }

  return {
    build(env: EnvObj): void {
      process.env = env;
    },

    getEnv(): NodeJS.ProcessEnv {
      return process.env;
    },

    getEnvValue(key: string): string | undefined {
      return process.env[key];
    },

    setEnv(key: string, value: string): void {
      process.env[key] = value;
    },

    reset(): void {
      process.env = OLD_ENV;
    },
  };
}
