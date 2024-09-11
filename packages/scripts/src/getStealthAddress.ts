import { webcrypto } from 'node:crypto';
import 'dotenv/config';
import {
  ACCOUNT_FACTORY_ADDRESS,
  ACCOUNT_IMPL_ADDRESS,
  generateStealthAddress,
  getStealthAddress,
  RaylacAccountAbi,
  RaylacAccountProxyAbi,
} from '@raylac/shared';
import { publicClient } from './viem';
import { publicKeyToAddress } from 'viem/accounts';
import { encodeDeployData, encodeFunctionData, getContractAddress } from 'viem';

// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const testStealthAddress = async () => {
  const spendingPubKey =
    '0x04a4e81737aaa1c54bfa1714014e4e8ff2334ce22e69e1c47356520a94fab66039d632f7ece0eee70c4d523726d94e447c8143a4dde66feabc2362b7738e6ad355';
  const viewingPubKey =
    '0x044344605eaeb7d269d86d219e3885a4cd2d97d9e07fad52270da5addb6227b13d33a5d8988ce173d3e4f5cecb6190a4f049fc4144f131c4c4316fd004fa2531d7';

  const stealthAddressWithEphemeral = generateStealthAddress({
    spendingPubKey,
    viewingPubKey,
  });

  const stealthSigner = publicKeyToAddress(
    stealthAddressWithEphemeral.stealthPubKey
  );

  console.time('getStealthSigner');
  const address = await getStealthAddress({
    client: publicClient,
    stealthSigner,
  });
  console.timeEnd('getStealthSigner');

  const data = encodeDeployData({
    abi: RaylacAccountProxyAbi,
    bytecode:
      '0x60a060405261025d8038038061001481610151565b928339810160408282031261014c5781516001600160a01b038116919082810361014c5760208481015190946001600160401b03821161014c570182601f8201121561014c57805161006d6100688261018c565b610151565b9381855286828401011161014c57859160005b8281106101395783600080888a8983868a850101526080528482519201905af43d15610134573d6100b36100688261018c565b9081526000833d92013e5b156100df5760405160b590816101a882396080518181816015015260520152f35b6084906040519062461bcd60e51b82526004820152602860248201527f5375746f72694163636f756e7450726f78793a206661696c656420746f20696e604482015267697469616c697a6560c01b6064820152fd5b6100be565b8181018401518682018501528301610080565b600080fd5b6040519190601f01601f191682016001600160401b0381118382101761017657604052565b634e487b7160e01b600052604160045260246000fd5b6001600160401b03811161017657601f01601f19166020019056fe60806040523615604657600036818037808036817f00000000000000000000000000000000000000000000000000000000000000005af43d82803e156042573d90f35b3d90fd5b600036818037808036817f00000000000000000000000000000000000000000000000000000000000000005af43d82803e156042573d90f3fea264697066735822122020f9514c8d2cf420b836502ebb0ee25a3770859baaf09947d6662a2cfdfeebed64736f6c63430008190033',
    args: [
      ACCOUNT_IMPL_ADDRESS,
      encodeFunctionData({
        abi: RaylacAccountAbi,
        functionName: 'initialize',
        args: [stealthSigner],
      }),
    ],
  });

  const viemAddress = getContractAddress({
    bytecode: data,
    from: ACCOUNT_FACTORY_ADDRESS,
    opcode: 'CREATE2',
    salt: '0x0',
  });
  console.timeEnd('getContractAddress');

  console.log(viemAddress, address);
};

testStealthAddress();
