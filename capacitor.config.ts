import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourdomain.alwaysatree',
  appName: 'Always a Tree',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0d1a12',
    },
    Keyboard: {
      resize: 'none',
    },
  },
}

export default config
