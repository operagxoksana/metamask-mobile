// Third party dependencies.
import { StyleSheet } from 'react-native';

// External dependencies.
import { Theme } from '../../../util/theme/models';

/**
 * Style sheet function for ButtonSecondary component.
 *
 * @param params Style sheet params.
 * @param params.vars Inputs that the style sheet depends on.
 * @returns StyleSheet object.
 */
const styleSheet = (params: { theme: Theme }) => {
  const { theme } = params;
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: 72,
      height: 72,
    },
    spacer: {
      marginVertical: 16,
    },
  });
};

export default styleSheet;
