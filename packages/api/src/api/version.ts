import { logger } from '../utils';

const version = async () => {
  const RENDER_GIT_COMMIT = process.env.RENDER_GIT_COMMIT;

  if (!RENDER_GIT_COMMIT) {
    throw new Error('RENDER_GIT_COMMIT is not set');
  }

  logger.info(`RENDER_GIT_COMMIT: ${RENDER_GIT_COMMIT}`);

  return RENDER_GIT_COMMIT;
};

export default version;
