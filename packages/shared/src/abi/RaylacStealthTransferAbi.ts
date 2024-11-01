const RaylacStealthTransferAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      { name: 'proof', type: 'bytes', internalType: 'bytes' },
      {
        name: 'inputs',
        type: 'tuple[]',
        internalType: 'struct RaylacStealthTransfer.Input[]',
        components: [
          { name: 'addr', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
      },
      {
        name: 'outputs',
        type: 'tuple[]',
        internalType: 'struct RaylacStealthTransfer.Output[]',
        components: [
          { name: 'addr', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export default RaylacStealthTransferAbi;
