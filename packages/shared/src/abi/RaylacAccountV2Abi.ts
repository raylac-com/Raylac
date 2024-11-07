const RaylacAccountV2Abi = [
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    name: '_entryPoint',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract IEntryPoint' },
    ],
    stateMutability: 'view',
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
    name: 'execute',
    inputs: [
      { name: 'dest', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'func', type: 'bytes', internalType: 'bytes' },
      { name: '', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getNonce',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'initialize',
    inputs: [
      { name: '_stealthSigner', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isValidSignature',
    inputs: [
      { name: 'hash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'magicValue', type: 'bytes4', internalType: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'stealthSigner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'validateUserOp',
    inputs: [
      {
        name: 'userOp',
        type: 'tuple',
        internalType: 'struct UserOperation',
        components: [
          { name: 'sender', type: 'address', internalType: 'address' },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
          { name: 'initCode', type: 'bytes', internalType: 'bytes' },
          { name: 'callData', type: 'bytes', internalType: 'bytes' },
          { name: 'callGasLimit', type: 'uint256', internalType: 'uint256' },
          {
            name: 'verificationGasLimit',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'maxFeePerGas', type: 'uint256', internalType: 'uint256' },
          {
            name: 'maxPriorityFeePerGas',
            type: 'uint256',
            internalType: 'uint256',
          },
          { name: 'paymasterAndData', type: 'bytes', internalType: 'bytes' },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'userOpHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'missingAccountFunds', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      { name: 'validationData', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
] as const;

export default RaylacAccountV2Abi;
