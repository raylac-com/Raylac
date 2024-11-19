import winston from 'winston';

const DATADOG_API_KEY = process.env.DATADOG_API_KEY;

const SERVICE_NAME = 'raylac-sync';

const httpTransportOptions = {
  host: 'http-intake.logs.ap1.datadoghq.com',
  path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=${SERVICE_NAME}`,
  ssl: true,
};

const useDatadog = !!DATADOG_API_KEY;

if (useDatadog) {
  // eslint-disable-next-line no-console
  console.log('Sending logs to Datadog');
}

const logFileName = new Date().toISOString().replace('T', '-').split('.')[0];

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: useDatadog
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
  exitOnError: false,
  transports: useDatadog
    ? [
        new winston.transports.Http(httpTransportOptions),
        new winston.transports.Console(),
      ]
    : [
        new winston.transports.Console(),

        // File transport
        new winston.transports.File({
          filename: `logs/${logFileName}-app.log`,
          level: 'info', // Minimum logging level for this transport,
          format: winston.format.printf(({ message }) => message),
        }),

        // Error log file
        new winston.transports.File({
          filename: `logs/${logFileName}-error.log`,
          level: 'error', // Log only errors in this file
          format: winston.format.printf(({ message }) => message),
        }),
      ],
});
