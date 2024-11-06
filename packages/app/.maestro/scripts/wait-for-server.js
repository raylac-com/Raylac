/* eslint-disable no-console */
/* eslint-disable no-undef */

const sleep = async interval => {
  return await new Promise(resolve => setTimeout(resolve, interval));
};

const waitForServer = async () => {
  const url = `${process.env.API_URL}/version`;
  const gitCommit = process.env.GIT_COMMIT;

  const startTime = Date.now();
  const timeout = 60 * 10 * 1000;

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      const data = await response.text();

      if (data === gitCommit) {
        return;
      }

      console.log('Waiting for expected value, current response:', data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    // Wait for the specified interval before retrying
    await sleep(5000);
  }

  throw new Error('Timeout waiting for expected API response');
};

waitForServer();
