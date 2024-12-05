import colors from '@/lib/styles/colors';
import { ActivityIndicator, PressableProps } from 'react-native';
import { Pressable } from 'react-native';
import StyledText from '../StyledText/StyledText';

type StyledButtonProps = PressableProps & {
  isLoading?: boolean;
  title: string;
};

const StyledButton = ({ title, isLoading, ...props }: StyledButtonProps) => {
  return (
    <Pressable
      {...props}
      style={{
        height: 50,
        backgroundColor: colors.primary,
        opacity: props.disabled ? 0.5 : 1,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isLoading ? (
        <ActivityIndicator size={24} color="white" />
      ) : (
        <StyledText
          style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
        >
          {title}
        </StyledText>
      )}
    </Pressable>
  );
};

export default StyledButton;
