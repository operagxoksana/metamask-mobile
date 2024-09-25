import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import Text from './Text';
import BigNumber from 'bignumber.js';
import { useTheme } from '../../util/theme';

import type { Theme } from '../../util/theme/models';
import { useStyles } from '../../component-library/hooks';

const styleSheet = ({ colors }: Theme) => StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  rangeInputContainer: {
    borderWidth: 1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
  },
  input: {
    height: 38,
    minWidth: 10,
    paddingRight: 6,
  },
  buttonContainerLeft: {
    marginLeft: 17,
    flex: 1,
  },
  buttonContainerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 17,
    flex: 1,
  },
  button: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary.default,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    paddingTop: 1,
    paddingLeft: 0.5,
    color: colors.primary.default,
  },
  hitSlop: {
    top: 10,
    left: 10,
    bottom: 10,
    right: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    marginTop: 8,
    color: colors.error.default,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: colors.text.default,
  },
  errorIcon: {
    paddingRight: 4,
    color: colors.error.default,
  },
  conversionEstimation: {
    paddingLeft: 2,
    marginRight: 14,
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
  },
});

interface RangeInputProps {
  /**
   * Component or text to render on the left side of the label
   */
  leftLabelComponent?: React.ReactNode;
  /**
   * Component or text to render on the right side of the label
   */
  rightLabelComponent?: React.ReactNode;
  /**
   * The value to be on the input
   */
  value: string;
  /**
   * The unit to show inside the input
   */
  unit?: string;
  /**
   * A BigNumber value per which the input is incremented when clicking on the plus and minus button
   */
  increment: BigNumber;
  /**
   * Function that is called when the input is changed
   */
  onChangeValue: (value: string) => void;
  /**
   * The label to show inside the input
   */
  inputInsideLabel?: string;
  /**
   * The error to show below the input. Also when the error exists the input text will turn red
   */
  error?: string;
  /**
   * A BigNumber minimum value the input is allowed to have when clicking on the minus button
   */
  min: BigNumber;
  /**
   * A BigNumber maximum value the input is allowed to have when clicking on the plus button
   */
  max: BigNumber;
  /**
   * The name of the input
   */
  name: string;
}

const RangeInput: React.FC<RangeInputProps> = ({
  leftLabelComponent,
  rightLabelComponent,
  value,
  unit,
  increment,
  onChangeValue,
  inputInsideLabel,
  error,
  min,
  max,
  name,
}) => {
  const textInput = useRef<TextInput | null>(null);
  const [errorState, setErrorState] = useState<string | undefined>();
  const { colors, themeAppearance } = useTheme();
  const { styles } = useStyles(styleSheet, { colors });

  const handleClickUnit = useCallback(() => {
    textInput?.current?.focus?.();
  }, []);

  const changeValue = useCallback(
    (newValue: string, dontEmptyError?: boolean) => {
      if (!dontEmptyError) setErrorState('');
      const cleanValue = newValue?.replace?.(',', '.');
      if (cleanValue && new BigNumber(cleanValue).isNaN()) {
        setErrorState(`${name} must be a number`);
        return;
      }

      onChangeValue?.(cleanValue);
    },
    [name, onChangeValue],
  );

  const increaseNumber = useCallback(() => {
    const newValue = new BigNumber(value).plus(new BigNumber(increment));
    if (!new BigNumber(max).isNaN() && newValue.gt(max)) return;
    changeValue(newValue.toString());
  }, [changeValue, increment, max, value]);

  const decreaseNumber = useCallback(() => {
    const newValue = new BigNumber(value).minus(new BigNumber(increment));
    if (!new BigNumber(min).isNaN() && newValue.lt(min)) return;
    changeValue(newValue.toString());
  }, [changeValue, increment, min, value]);

  const renderLabelComponent = useCallback((component: React.ReactNode) => {
    if (!component) return null;
    if (typeof component === 'string')
      return (
        <Text noMargin black bold>
          {component}
        </Text>
      );
    return component;
  }, []);

  const checkLimits = useCallback(() => {
    if (new BigNumber(value || 0).lt(min)) {
      setErrorState(`${name} must be at least ${min}`);
      return changeValue(min.toString(), true);
    }
    if (new BigNumber(value || 0).gt(max)) {
      setErrorState(`${name} must be at most ${max}`);
      return changeValue(max.toString());
    }
  }, [changeValue, max, min, name, value]);

  useEffect(() => {
    if (textInput?.current?.isFocused?.()) return;
    checkLimits();
  }, [checkLimits]);

  const hasError = Boolean(error) || Boolean(errorState);

  return (
    <View>
      <View style={styles.labelContainer}>
        {renderLabelComponent(leftLabelComponent)}
        {renderLabelComponent(rightLabelComponent)}
      </View>

      <View style={[styles.rangeInputContainer, hasError ? styles.rangeInputContainerError : styles.rangeInputContainerNormal]}>
        <View style={styles.buttonContainerLeft}>
          <TouchableOpacity
            style={styles.button}
            hitSlop={styles.hitSlop}
            onPress={decreaseNumber}
          >
            <FontAwesomeIcon name="minus" size={10} style={styles.buttonText} />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            onChangeText={changeValue}
            onBlur={checkLimits}
            value={value}
            keyboardType="numeric"
            ref={textInput}
            keyboardAppearance={themeAppearance}
          />
          {!!unit && (
            <Text onPress={handleClickUnit} black={!error} red={Boolean(error)}>
              {unit}
            </Text>
          )}
        </View>
        <View style={styles.buttonContainerRight}>
          <Text
            style={styles.conversionEstimation}
            adjustsFontSizeToFit
            numberOfLines={2}
          >
            {inputInsideLabel}
          </Text>
          <TouchableOpacity
            style={styles.button}
            hitSlop={styles.hitSlop}
            onPress={increaseNumber}
          >
            <FontAwesomeIcon name="plus" size={10} style={styles.buttonText} />
          </TouchableOpacity>
        </View>
      </View>
      {hasError && (
        <View style={styles.errorContainer}>
          <FontAwesomeIcon
            name="exclamation-circle"
            size={14}
            style={styles.errorIcon}
          />
          <Text red noMargin small style={styles.errorText}>
            {error || errorState}
          </Text>
        </View>
      )}
    </View>
  );
};

RangeInput.defaultProps = {
  increment: new BigNumber(1),
} as Partial<RangeInputProps>;

export default RangeInput;
