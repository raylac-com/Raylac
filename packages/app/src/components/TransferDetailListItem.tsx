import colors from '@/lib/styles/colors';
import { Text, View } from 'react-native';

interface TransferDetailListItemProps {
  label: string;
  value: React.ReactNode;
}

const TransferDetailListItem = (props: TransferDetailListItemProps) => {
  return (
    <View
      style={{
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
      }}
    >
      <Text
        style={{
          color: colors.gray,
          fontSize: 14,
        }}
      >
        {props.label}
      </Text>
      {props.value}
    </View>
  );
};

export default TransferDetailListItem;
