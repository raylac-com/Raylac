// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from '@sentry/node';

if (process.env.RENDER === 'true') {
  // Only initialize Sentry on Render
  Sentry.init({
    dsn: 'https://7080936148b18dee5d51aeb4e45a1968@o4507910178799616.ingest.us.sentry.io/4508601520816128',
  });
}

export default Sentry;
