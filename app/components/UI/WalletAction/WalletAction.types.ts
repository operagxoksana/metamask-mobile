import { ImageStyle, ViewStyle } from 'react-native';
import { IconName } from '../../../component-library/components/Icons/Icon';
import { AvatarSize } from '../../../component-library/components/Avatars/Avatar';
import { strings } from '../../../../locales/i18n';

export enum WalletActionType {
  Buy = 'Buy',
  Sell = 'Sell',
  Swap = 'Swap',
  Bridge = 'Bridge',
  Send = 'Send',
  Receive = 'Receive',
}

export interface WalletActionStrings {
  title: string;
  description: string;
  disabledDescription: string;
}

export const walletActionStrings: Record<
  WalletActionType,
  WalletActionStrings
> = {
  [WalletActionType.Buy]: {
    title: strings('asset_overview.buy_button'),
    description: strings('asset_overview.buy_description'),
    disabledDescription: strings('wallet.disabled_button.buy'),
  },
  [WalletActionType.Sell]: {
    title: strings('asset_overview.sell_button'),
    description: strings('asset_overview.sell_description'),
    disabledDescription: strings('wallet.disabled_button.sell'),
  },
  [WalletActionType.Swap]: {
    title: strings('asset_overview.swap'),
    description: strings('asset_overview.swap_description'),
    disabledDescription: strings('wallet.disabled_button.swap'),
  },
  [WalletActionType.Bridge]: {
    title: strings('asset_overview.bridge'),
    description: strings('asset_overview.bridge_description'),
    disabledDescription: strings('wallet.disabled_button.bridge'),
  },
  [WalletActionType.Send]: {
    title: strings('asset_overview.send_button'),
    description: strings('asset_overview.send_description'),
    disabledDescription: strings('wallet.disabled_button.send'),
  },
  [WalletActionType.Receive]: {
    title: strings('asset_overview.receive_button'),
    description: strings('asset_overview.receive_description'),
    disabledDescription: strings('wallet.disabled_button.receive'),
  },
};

export interface WalletActionProps {
  actionType?: WalletActionType;
  iconName: IconName;
  iconSize: AvatarSize;
  onPress: () => void;
  containerStyle?: ViewStyle;
  iconStyle?: ImageStyle;
  actionID?: string;
  disabled?: boolean;
}
