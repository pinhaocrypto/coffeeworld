declare module '@worldcoin/minikit-js' {
  import { FC } from 'react';
  
  export interface VerifyIconProps {
    size?: number;
    className?: string;
  }
  
  export const VerifyIcon: FC<VerifyIconProps>;
}
