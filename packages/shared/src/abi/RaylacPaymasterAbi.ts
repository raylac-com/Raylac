const RaylacPaymasterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_entryPoint',
        type: 'address',
        internalType: 'contract IEntryPoint',
      },
      { name: '_verifyingSigner', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'addStake',
    inputs: [
      { name: 'unstakeDelaySec', type: 'uint32', internalType: 'uint32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
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
    name: 'getDeposit',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getHash',
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
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'postOp',
    inputs: [
      {
        name: 'mode',
        type: 'uint8',
        internalType: 'enum IPaymaster.PostOpMode',
      },
      { name: 'context', type: 'bytes', internalType: 'bytes' },
      { name: 'actualGasCost', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'renounceOwnership',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferOwnership',
    inputs: [{ name: 'newOwner', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unlockStake',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'validatePaymasterUserOp',
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
      { name: 'maxCost', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      { name: 'context', type: 'bytes', internalType: 'bytes' },
      { name: 'validationData', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyingSigner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdrawStake',
    inputs: [
      {
        name: 'withdrawAddress',
        type: 'address',
        internalType: 'address payable',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawTo',
    inputs: [
      {
        name: 'withdrawAddress',
        type: 'address',
        internalType: 'address payable',
      },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    inputs: [
      {
        name: 'previousOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'newOwner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
];

export default RaylacPaymasterAbi;