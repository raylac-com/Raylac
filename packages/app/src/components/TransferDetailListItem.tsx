import { theme } from '@/lib/theme';
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
          color: theme.gray,
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
