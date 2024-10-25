import * as winston from 'winston';

export const initLogger = ({ serviceName }: { serviceName: string }) => {
  const DATADOG_API_KEY = process.env.DATADOG_API_KEY;

  const httpTransportOptions = {
    host: 'http-intake.logs.ap1.datadoghq.com',
    path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=${serviceName}`,
    ssl: true,
  };

  const useDatadog = !!DATADOG_API_KEY;

  if (useDatadog) {
    // eslint-disable-next-line no-console
    console.log('Sending logs to Datadog');
  }

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    exitOnError: false,
    transports: useDatadog
      ? [
          new winston.transports.Http(httpTransportOptions),
          new winston.transports.Console(),
        ]
      : [new winston.transports.Console()],
  });

  return logger;
};
