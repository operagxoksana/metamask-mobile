///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import React, { useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import ApprovalModal from '../ApprovalModal';
import useApprovalRequest from '../../Views/confirmations/hooks/useApprovalRequest';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../core/RPCMethods/RPCMethodMiddleware';
import {
  SNAP_ACCOUNT_CUSTOM_NAME_ADD_ACCOUNT_BUTTON,
  SNAP_ACCOUNT_CUSTOM_NAME_APPROVAL,
  SNAP_ACCOUNT_CUSTOM_NAME_CANCEL_BUTTON,
  SNAP_ACCOUNT_CUSTOM_NAME_INPUT,
} from './SnapAccountCustomNameApproval.constants';
import styleSheet from './SnapAccountCustomNameApproval.styles';
import { useStyles } from '../../hooks/useStyles';
import BottomSheetFooter, {
  ButtonsAlignment,
} from '../../../component-library/components/BottomSheets/BottomSheetFooter';
import SheetHeader from '../../../component-library/components/Sheet/SheetHeader';
import { strings } from '../../../../locales/i18n';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import {
  ButtonProps,
  ButtonSize,
  ButtonVariants,
} from '../../../component-library/components/Buttons/Button/Button.types';

const SnapAccountCustomNameApproval = () => {
  const { approvalRequest, onConfirm, onReject } = useApprovalRequest();
  console.log(
    'SnapKeyring: SnapAccountCustomNameApproval',
    JSON.stringify(approvalRequest, null, 2),
  );
  const [accountName, setAccountName] = useState<string>('');

  useEffect(() => {
    setAccountName(approvalRequest?.requestData.snapSuggestedAccountName || '');
  }, [approvalRequest]);

  const { styles } = useStyles(styleSheet, {});

  const onAddAccountPressed = useCallback(() => {
    onConfirm(undefined, { success: true, name: accountName });
  }, [accountName, onConfirm]);

  const cancelButtonProps: ButtonProps = {
    variant: ButtonVariants.Secondary,
    label: strings('accountApproval.cancel'),
    size: ButtonSize.Lg,
    onPress: onReject,
    testID: SNAP_ACCOUNT_CUSTOM_NAME_CANCEL_BUTTON,
  };

  const addAccountButtonProps: ButtonProps = {
    variant: ButtonVariants.Primary,
    label: strings('snap_account_custom_name_approval.add_account_button'),
    size: ButtonSize.Lg,
    onPress: onAddAccountPressed,
    testID: SNAP_ACCOUNT_CUSTOM_NAME_ADD_ACCOUNT_BUTTON,
  };

  return (
    <ApprovalModal
      isVisible={
        approvalRequest?.type ===
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount
      }
      onCancel={onReject}
    >
      <View testID={SNAP_ACCOUNT_CUSTOM_NAME_APPROVAL} style={styles.root}>
        <SheetHeader
          title={strings('snap_account_custom_name_approval.title')}
        />
        <Text style={styles.inputTitle} variant={TextVariant.BodyMDBold}>
          {strings('snap_account_custom_name_approval.input_title')}
        </Text>
        <TextInput
          style={styles.input}
          value={accountName}
          onChangeText={(text) => setAccountName(text)}
          testID={SNAP_ACCOUNT_CUSTOM_NAME_INPUT}
        />
        <View style={styles.actionContainer}>
          <BottomSheetFooter
            buttonsAlignment={ButtonsAlignment.Horizontal}
            buttonPropsArray={[cancelButtonProps, addAccountButtonProps]}
          />
        </View>
      </View>
    </ApprovalModal>
  );
};

export default SnapAccountCustomNameApproval;
///: END:ONLY_INCLUDE_IF
