export const TEST_ACCOUNT_MNEMONIC = process.env
  .TEST_ACCOUNT_MNEMONIC as string;

if (!TEST_ACCOUNT_MNEMONIC) {
  throw new Error('TEST_ACCOUNT_MNEMONIC not found');
}
