import { isYohakuBuild } from './build';

// Kept in localStorage beside Readest's own read-aloud choices (TTSUtils), so
// TTSController can read it without the settings store: services/constants
// imports TTSController, and importing the store there would close a cycle.
const ONLINE_VOICES_KEY = 'yohakuOnlineVoices';

/** Whether the user turned on Microsoft Edge's voices: the text read is sent to Microsoft. */
export const getOnlineVoicesSetting = () =>
  typeof localStorage !== 'undefined' && localStorage.getItem(ONLINE_VOICES_KEY) === 'true';

export const setOnlineVoicesSetting = (on: boolean) => {
  localStorage.setItem(ONLINE_VOICES_KEY, String(on));
};

/** Readest reads aloud with Microsoft's online voices first; Yohaku only once turned on. */
export const allowsOnlineVoices = () => !isYohakuBuild() || getOnlineVoicesSetting();
