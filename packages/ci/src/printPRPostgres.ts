import axiosBase from 'axios';

const RENDER_API_KEY = process.env.RENDER_API_KEY;

if (!RENDER_API_KEY) {
  throw new Error('RENDER_API_KEY is not set');
}

const axios = axiosBase.create({
  baseURL: 'https://api.render.com/v1',
  headers: {
    Authorization: `Bearer ${RENDER_API_KEY}`,
    Accept: 'application/json',
  },
});

interface RenderPostgresListResponse {
  postgres: {
    createdAt: string;
    dashboardUrl: string;
    databaseName: string;
    databaseUser: string;
    highAvailabilityEnabled: boolean;
    id: string;
    ipAllowList: string[];
    name: string;
    owner: {
      email: string;
      id: string;
      name: string;
      type: string;
    };
    plan: string;
    readReplicas: [];
    region: string;
    role: string;
    status: string;
    suspended: string;
    suspenders: [];
    updatedAt: string;
    version: string;
  };
}

interface RenderPostgresConnectionInfoResponse {
  password: 'string';
  internalConnectionString: 'string';
  externalConnectionString: 'string';
  psqlCommand: 'string';
}

const getDBNameForPr = (prNumber: number) => {
  return `raylac PR #${prNumber}`;
};

/**
 * Get the Postgres instance for a Pull Request
 * @returns The Postgres instance for the PR returned by the list endpoint
 */
const getPRPostgresInstance = async () => {
  const response = await axios.get<RenderPostgresListResponse[]>('/postgres');

  const raylacPostgres = response.data.filter(
    postgres => postgres.postgres.owner.name === 'Raylac'
  );

  const PR_NUMBER = process.env.PR_NUMBER;

  if (!PR_NUMBER) {
    throw new Error('PR_NUMBER is not set');
  }

  const prDBName = getDBNameForPr(Number(PR_NUMBER));

  const prDB = raylacPostgres.find(
    postgres => postgres.postgres.name === prDBName
  );

  if (!prDB) {
    throw new Error(`Database for PR #${PR_NUMBER} not found`);
  }

  return prDB;
};

/**
 * Get the connection info for a Postgres database
 * @param postgresId - The ID of the Postgres database (returned by the list endpoint)
 * @returns The connection info
 */
const getPostgresConnectionInfo = async (postgresId: string) => {
  const result = await axios.get<RenderPostgresConnectionInfoResponse>(
    `/postgres/${postgresId}/connection-info`
  );

  return result.data;
};

/**
 * Get the connection string for a Postgres database for a Pull Request
 * @returns The connection string
 */
const getPRPostgresConnectionString = async (): Promise<string> => {
  const prDB = await getPRPostgresInstance();
  const connectionInfo = await getPostgresConnectionInfo(prDB.postgres.id);

  return connectionInfo.externalConnectionString;
};

const printPRPostgresConnectionString = async () => {
  const connectionString = await getPRPostgresConnectionString();

  // eslint-disable-next-line no-console
  console.log(connectionString);
};

printPRPostgresConnectionString();
