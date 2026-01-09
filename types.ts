
export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface StoryState {
  image: string | null;
  paragraph: string;
  isGenerating: boolean;
  isNarrating: boolean;
  error: string | null;
}

export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}
