import colors from '@/lib/styles/colors';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const GasLogo = ({ size = 24 }: { size?: number }) => {
  return (
    <MaterialCommunityIcons
      name="gas-station-outline"
      size={size}
      color={colors.border}
    />
  );
};

export default GasLogo;
