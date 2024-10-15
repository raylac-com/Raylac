//Import Mixpanel API
import { Mixpanel } from 'mixpanel-react-native';

// Set up an instance of Mixpanel
const trackAutomaticEvents = false;
const mixpanel = new Mixpanel(
  '1797576dbf6f20d8e4efdabfedf8c05b',
  trackAutomaticEvents
);
mixpanel.init();

export default mixpanel;
