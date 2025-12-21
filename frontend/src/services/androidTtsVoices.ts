import { registerPlugin } from '@capacitor/core';

export interface AndroidInstalledVoice {
  name: string;
  lang: string;
  networkRequired?: boolean;
  index?: number;
}

interface AndroidTtsVoicesPlugin {
  getInstalledVoices(options: { localOnly: boolean }): Promise<{ voices: AndroidInstalledVoice[] }>;
}

export const AndroidTtsVoices = registerPlugin<AndroidTtsVoicesPlugin>('AndroidTtsVoices');
