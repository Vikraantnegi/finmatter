/**
 * Type definitions for react-native-otp-input
 */

declare module 'react-native-otp-input' {
  import { StyleProp, ViewStyle } from 'react-native';

  interface OTPInputViewProps {
    style?: StyleProp<ViewStyle>;
    pinCount?: number;
    code?: string;
    onCodeChanged?: (code: string) => void;
    onCodeFilled?: (code: string) => void;
    autoFocusOnLoad?: boolean;
    secureTextEntry?: boolean;
    codeInputFieldStyle?: StyleProp<ViewStyle>;
    codeInputHighlightStyle?: StyleProp<ViewStyle>;
    onCodeFilled?: (code: string) => void;
    editable?: boolean;
    keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
    clearInputs?: boolean;
    placeholderCharacter?: string;
    placeholderTextColor?: string;
  }

  const OTPInputView: React.FC<OTPInputViewProps>;
  export default OTPInputView;
}
