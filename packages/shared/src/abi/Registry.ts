const Registry = [
  {
    type: 'constructor',
    inputs: [
      { name: '_erc5564Address', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'inputs', type: 'address[]', internalType: 'address[]' },
      { name: 'outputs', type: 'address[]', internalType: 'address[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
      {
        name: 'announcements',
        type: 'tuple[]',
        internalType: 'struct Registry.ERC5564Annoucement[]',
        components: [
          { name: 'stealthAddress', type: 'address', internalType: 'address' },
          { name: 'ephemeralPubKey', type: 'bytes', internalType: 'bytes' },
          { name: 'metadata', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'tokenAddress', type: 'address', internalType: 'address' },
      { name: 'proof', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

export default Registry;
