const RaylacAccountProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'impl', type: 'address', internalType: 'address' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  { type: 'receive', stateMutability: 'payable' },
];

export default RaylacAccountProxyAbi;
