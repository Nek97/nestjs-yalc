export const DBCONF_PREFIX = 'dbConf_';
export const CONN_SUFFIX = 'Connection';

export function getConfNameByConnection(connName: string): string {
  return `${DBCONF_PREFIX}${connName}`;
}

export function getConnectionName(dbName: string): string {
  return `${dbName}${CONN_SUFFIX}`;
}

export function getDBNameByConnection(connName: string): string {
  return connName.substring(0, connName.indexOf(CONN_SUFFIX));
}
