import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoveFunds from './screens/MoveFunds';
import SelectToken from './screens/SelectToken';
import SelectChain from './screens/SelectChain';
import colors from '@/lib/styles/colors';
import { useMoveFundsContext } from '@/contexts/MoveFundsContext';
import SelectAddress from './screens/SelectAddress';

export type MoveFundsSheetStackParamsList = {
  MoveFunds: undefined;
  SelectToken: undefined;
  SelectChain: {
    type: 'from' | 'to';
  };
  SelectAddress: {
    type: 'from' | 'to';
  };
};

const Stack = createNativeStackNavigator<MoveFundsSheetStackParamsList>();

const Navigator = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator initialRouteName="MoveFunds">
        <Stack.Screen name="MoveFunds" component={MoveFunds} />
        <Stack.Screen name="SelectToken" component={SelectToken} />
        <Stack.Screen name="SelectChain" component={SelectChain} />
        <Stack.Screen name="SelectAddress" component={SelectAddress} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const MoveFundsSheet = () => {
  const { isSheetOpen, setIsSheetOpen } = useMoveFundsContext();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isSheetOpen) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [isSheetOpen]);

  return (
    <BottomSheetModal
      ref={ref}
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 16,
        backgroundColor: colors.background,
      }}
      index={0}
      enablePanDownToClose
      enableDynamicSizing={false}
      snapPoints={['80%']}
      onDismiss={() => setIsSheetOpen(false)}
    >
      <Navigator />
    </BottomSheetModal>
  );
};

export default MoveFundsSheet;
