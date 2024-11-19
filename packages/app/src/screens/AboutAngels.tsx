import StyledButton from '@/components/StyledButton';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import FontAwesome5 from '@expo/vector-icons/build/FontAwesome5';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Text, View } from 'react-native';

const AboutAngels = () => {
  const { t } = useTranslation('AboutAngels');
  const [panel, setPanel] = useState(0); // Tracks the current panel (0 or 1)
  const translateX = useRef(new Animated.Value(0)).current; // Controls the sliding animation

  const navigation = useTypedNavigation();

  const { width: screenWidth } = Dimensions.get('window');

  const panelWidth = screenWidth;

  const slideToPanel = (panelIndex: number) => {
    Animated.timing(translateX, {
      toValue: -panelIndex * panelWidth, // Move to the selected panel
      duration: 200,
      useNativeDriver: true,
    }).start();
    setPanel(panelIndex); // Update the current panel
  };

  const panels = [t('explanation1'), t('explanation2')];

  return (
    <View
      style={{
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
      }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: panelWidth,
          },
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {panels.map((explanation, index) => (
          <View
            style={{
              height: '100%',
              width: panelWidth,
              paddingVertical: 20,
            }}
            key={index}
          >
            <View
              style={{
                marginHorizontal: 20,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                borderRadius: 16,
              }}
            >
              <FontAwesome5
                name="feather-alt"
                size={48}
                color={colors.angelPink}
              />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: 36,
                }}
              >
                {explanation}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
      <StyledButton
        variant="primary"
        title={t('next')}
        onPress={() => {
          if (panel === panels.length - 1) {
            navigation.navigate('AskForAngel');
          } else {
            slideToPanel(panel + 1);
          }
        }}
      />
    </View>
  );
};

export default AboutAngels;
