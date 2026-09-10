// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

export type IconSymbolName =
  | SymbolViewProps['name']
  | string;

const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>['name']> = {
  'house.fill': 'home',
  'house': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'rectangle.portrait.and.arrow.right': 'logout',
  'plus.circle': 'add-circle-outline',
  'plus.circle.fill': 'add-circle',
  'clock.arrow.circlepath': 'history',
  'chart.bar': 'bar-chart',
  'chart.bar.fill': 'bar-chart',
  'chart.pie': 'pie-chart',
  'arrow.trianglehead.clockwise': 'refresh',
  'arrow.clockwise': 'refresh',
  'person.2': 'people',
  'person.2.fill': 'people',
  'person': 'person',
  'person.fill': 'person',
  'person.badge.plus': 'person-add',
  'book': 'menu-book',
  'book.fill': 'menu-book',
  'book.closed': 'book',
  'checkmark.circle': 'check-circle-outline',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle': 'cancel',
  'xmark.circle.fill': 'cancel',
  'tray': 'inbox',
  'magnifyingglass': 'search',
  'gearshape': 'settings',
  'gearshape.fill': 'settings',
  'graduationcap': 'school',
  'graduationcap.fill': 'school',
  'lock': 'lock',
  'lock.fill': 'lock',
  'qrcode': 'qr-code',
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'slider.horizontal.3': 'tune',
  'pencil': 'edit',
  'trash': 'delete',
  'trash.fill': 'delete',
  'shield': 'shield',
  'shield.fill': 'shield',
  'shield.lefthalf.filled': 'admin-panel-settings',
  'info.circle': 'info-outline',
  'info.circle.fill': 'info',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.triangle.fill': 'warning',
  'calendar': 'calendar-today',
  'calendar.badge.clock': 'access-time',
  'checkmark': 'check',
  'xmark': 'close',
  'arrow.up.right': 'arrow-forward',
  'key.fill': 'vpn-key',
  'key': 'vpn-key',
  'building.columns': 'account-balance',
  'building.columns.fill': 'account-balance',
  'circle': 'radio-button-unchecked',
  'circle.fill': 'circle',
  'checkmark.shield.fill': 'verified-user',
  'xmark.shield.fill': 'gpp-bad',
  'clock': 'access-time',
  'clock.fill': 'schedule',
  'checkmark.seal.fill': 'verified',
  'person.fill.checkmark': 'how-to-reg',
  'arrow.left': 'arrow-back',
  'briefcase': 'work',
  'briefcase.fill': 'work',
  'person.text.rectangle': 'badge',
  'eye': 'visibility',
  'eye.fill': 'visibility',
  'eye.slash': 'visibility-off',
  'eye.slash.fill': 'visibility-off',
  'square': 'check-box-outline-blank',
  'checkmark.square': 'check-box',
  'checkmark.square.fill': 'check-box',
  'questionmark.circle': 'help-outline',
  'questionmark.circle.fill': 'help',
  'arrow.down': 'arrow-downward',
  'arrow.up': 'arrow-upward',
  'checkmark.seal': 'verified',
  'line.3.horizontal.decrease': 'filter-list',
  'square.and.arrow.up': 'share',
  'square.and.arrow.down': 'file-download',
  'arrow.clockwise.circle': 'autorenew',
  'arrow.clockwise.circle.fill': 'autorenew',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = (MAPPING[name as string] || 'help-outline') as ComponentProps<typeof MaterialIcons>['name'];
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
