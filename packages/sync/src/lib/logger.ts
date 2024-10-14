import * as winston from 'winston';

const DATADOG_API_KEY = process.env.DATADOG_API_KEY;

const SERVICE_NAME = 'raylac-sync';

const httpTransportOptions = {
  host: 'http-intake.logs.datadoghq.com',
  path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=${SERVICE_NAME}`,
};

const useDatadog = !!DATADOG_API_KEY;

if (useDatadog) {
  console.log('Sending logs to Datadog');
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: useDatadog
    ? [
        new winston.transports.Http(httpTransportOptions),
        new winston.transports.Console(),
      ]
    : [new winston.transports.Console()],
});

export default logger;
