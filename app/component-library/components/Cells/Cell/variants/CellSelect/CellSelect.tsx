/* eslint-disable react/prop-types */

// Third library dependencies.
import React from 'react';

// External dependencies.
import { useStyles } from '../../../../../hooks';
import BaseListItemSelect from '../../../../../base-components/ListItem/BaseListItemSelect';
import CellBase from '../../foundation/CellBase';

// Internal dependencies.
import styleSheet from './CellSelect.styles';
import { CellSelectProps } from './CellSelect.types';
import { CellModalSelectorsIDs } from '../../../../../../../e2e/selectors/Modals/CellModal.selectors';

const CellSelect = ({
  style,
  avatarProps,
  title,
  secondaryText,
  tertiaryText,
  tagLabel,
  isSelected = false,
  children,
  ...props
}: CellSelectProps) => {
  const { styles } = useStyles(styleSheet, { style });

  return (
    <BaseListItemSelect
      isSelected={isSelected}
      style={styles.base}
      testID={CellModalSelectorsIDs.SELECT}
      {...props}
    >
      <CellBase
        avatarProps={avatarProps}
        title={title}
        secondaryText={secondaryText}
        tertiaryText={tertiaryText}
        tagLabel={tagLabel}
        style={style}
      >
        {children}
      </CellBase>
    </BaseListItemSelect>
  );
};

export default CellSelect;
