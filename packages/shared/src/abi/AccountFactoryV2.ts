const AccountFactoryV2Abi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_entryPoint',
        type: 'address',
        internalType: 'contract IEntryPoint',
      },
      {
        name: '_accountImplementation',
        type: 'address',
        internalType: 'contract RaylacAccountV2',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'accountImplementation',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract RaylacAccountV2' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createAccount',
    inputs: [
      { name: 'stealthSigner', type: 'address', internalType: 'address' },
    ],
    outputs: [
      {
        name: 'ret',
        type: 'address',
        internalType: 'contract RaylacAccountV2',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'entryPoint',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IEntryPoint' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAddress',
    inputs: [
      { name: 'stealthSigner', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
] as const;

export default AccountFactoryV2Abi;
