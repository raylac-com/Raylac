const AccountFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_accountImplementation',
        type: 'address',
        internalType: 'contract SutoriAccount',
      },
      { name: '_recoveryPubKey', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'accountImplementation',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract SutoriAccount' },
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
      { name: 'ret', type: 'address', internalType: 'contract SutoriAccount' },
    ],
    stateMutability: 'nonpayable',
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
  {
    type: 'function',
    name: 'recoveryPubKey',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
] as const;

export default AccountFactoryAbi;
