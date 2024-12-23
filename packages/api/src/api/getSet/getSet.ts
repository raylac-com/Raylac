import { TokenSet } from '@raylac/shared';
import { getTokensInSet } from '../../utils';

const getSet = async (set: TokenSet) => {
  return getTokensInSet(set);
};

export default getSet;
