type NullableString = string | undefined;

type SqlServerConnection = {
  host: NullableString;
  port: number | undefined;
  username: NullableString;
  password: NullableString;
  database: NullableString;
  trustServerCertificate: boolean;
};

const normalizeKey = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, '');

const stripWrappingQuotes = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseBoolean = (value: string | undefined): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }

  switch (value.trim().toLowerCase()) {
    case 'true':
    case '1':
    case 'yes':
      return true;
    case 'false':
    case '0':
    case 'no':
      return false;
    default:
      return undefined;
  }
};

const parsePort = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return undefined;
};

const parseDataSource = (
  value: string,
): { host?: string; port?: number | undefined } => {
  const cleaned = stripWrappingQuotes(value);
  const [rawHost, rawPort] = cleaned.split(',');
  const host = rawHost?.trim();
  const port = parsePort(rawPort?.trim());

  return {
    host: host || undefined,
    port,
  };
};

export const resolveSqlServerConnection = (params: {
  connectionString?: string;
  host?: string;
  port?: string | number;
  username?: string;
  password?: string;
  database?: string;
  trustServerCertificate?: string | boolean;
}): SqlServerConnection => {
  const resolved: SqlServerConnection = {
    host: params.host,
    port: parsePort(params.port),
    username: params.username,
    password: params.password,
    database: params.database,
    trustServerCertificate:
      parseBoolean(String(params.trustServerCertificate ?? 'true')) ?? true,
  };

  const connectionString = params.connectionString?.trim();
  if (!connectionString) {
    return resolved;
  }

  const parts = connectionString
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const part of parts) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = normalizeKey(part.slice(0, separatorIndex));
    const value = stripWrappingQuotes(part.slice(separatorIndex + 1));

    if (!value) {
      continue;
    }

    if (
      key === 'datasource' ||
      key === 'server' ||
      key === 'address' ||
      key === 'addr' ||
      key === 'networkaddress'
    ) {
      const parsedDataSource = parseDataSource(value);
      resolved.host = parsedDataSource.host ?? resolved.host;
      resolved.port = parsedDataSource.port ?? resolved.port;
      continue;
    }

    if (key === 'initialcatalog' || key === 'database') {
      resolved.database = value;
      continue;
    }

    if (key === 'userid' || key === 'uid' || key === 'user') {
      resolved.username = value;
      continue;
    }

    if (key === 'password' || key === 'pwd') {
      resolved.password = value;
      continue;
    }

    if (key === 'trustservercertificate') {
      const parsed = parseBoolean(value);
      if (parsed !== undefined) {
        resolved.trustServerCertificate = parsed;
      }
    }
  }

  return resolved;
};
