import React from 'react';
import Feather from '@expo/vector-icons/Feather';
import FeedbackPressable from '@/components/FeedbackPressable/FeedbackPressable';
import colors from '@/lib/styles/colors';
import StyledText from '@/components/StyledText/StyledText';

type BackToTopButtonProps = {
  onPress: () => void;
};

const BackToTopButton = ({ onPress }: BackToTopButtonProps) => {
  return (
    <FeedbackPressable
      style={{
        backgroundColor: colors.background,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: colors.border,
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 6,
        width: 90,
        columnGap: 4,
        shadowColor: colors.border,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.7,
        shadowRadius: 4,
      }}
      onPress={onPress}
    >
      <Feather name="arrow-up" size={20} color={colors.border} />
      <StyledText style={{ color: colors.border }}>{'Top'}</StyledText>
    </FeedbackPressable>
  );
};

export default BackToTopButton;
