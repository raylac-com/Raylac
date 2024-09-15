export const JWT_PRIV_KEY = process.env.JWT_PRIV_KEY as string;

if (!JWT_PRIV_KEY) {
  throw new Error('JWT_PRIV_KEY is required');
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const poll = async (
  fn: () => Promise<boolean>, // Function that returns a promise resolving to a boolean (the condition)
  interval: number, // Interval between each poll (in milliseconds)
  timeout: number // Time limit for the polling process (in milliseconds)
): Promise<void> => {
  const endTime = Date.now() + timeout;

  while (Date.now() < endTime) {
    if (await fn()) {
      return; // Condition met
    }

    await sleep(interval);
  }

  throw new Error('Polling timed out');
};
