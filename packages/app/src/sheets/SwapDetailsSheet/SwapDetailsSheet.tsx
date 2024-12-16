/*
import StyledText from '@/components/StyledText/StyledText';
import { View } from 'react-native';
import SwapIOCard from './components/SwapIOCard';
import AntDesign from '@expo/vector-icons/AntDesign';
import colors from '@/lib/styles/colors';
import TokenImageWithChain from '@/components/TokenImageWithChain/TokenImageWithChain';
import { base } from 'viem/chains';
 import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
 import { useRef } from 'react';
*/
import { SwapHistoryItem } from '@raylac/shared';

export interface SwapDetailsSheetProps {
  swap: SwapHistoryItem;
  onClose: () => void;
}

const SwapDetailsSheet = ({ swap }: SwapDetailsSheetProps) => {
  //  const ref = useRef<BottomSheet>(null);

  if (!swap) {
    throw new Error('Swap details sheet requires a swap');
  }

  return null;

  /*
  const inputChains = [];
  const outputChain = [];

  return (
    <BottomSheet
      ref={ref}
      style={{
        flex: 1,
      }}
      index={0}
      onClose={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['100%']}
    >
      <BottomSheetView
        style={{
          flex: 1,
          paddingHorizontal: 16,
          flexDirection: 'column',
          alignItems: 'center',
          paddingVertical: 20,
          rowGap: 16,
        }}
      >
        <StyledText>{`Swap`} </StyledText>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <SwapIOCard
            token={swap.tokenIn}
            amount={BigInt(swap.amountIn)}
            usdAmount={Number(swap.amountInUsd)}
          />
          <AntDesign name="arrowright" size={24} color={colors.subbedText} />
          <SwapIOCard
            token={swap.tokenOut}
            amount={BigInt(swap.amountOut)}
            usdAmount={Number(swap.amountOutUsd)}
          />
        </View>
        <View style={{ flexDirection: 'row', columnGap: 8 }}>
          {inputChains.map((chainId, i) => (
            <TokenImageWithChain
              key={i}
              logoURI={swap.tokenIn.logoURI}
              chainId={swap.tokenIn.chainId}
            />
          ))}
          <AntDesign name="arrowright" size={24} color={colors.subbedText} />
          <TokenImageWithChain
            logoURI={swap.tokenOut.logoURI}
            chainId={base.id}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
  */
};

export default SwapDetailsSheet;
