import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { SettingsSwitchRow } from '@/components/settings/primitives';
import { getOnlineVoicesSetting, setOnlineVoicesSetting } from '@/yohaku/onlineVoices';

/** The opt-in for Microsoft Edge's online voices, in the Read Aloud settings. */
const OnlineVoicesRow: React.FC = () => {
  const _ = useTranslation();
  const [onlineVoices, setOnlineVoices] = useState(getOnlineVoicesSetting);

  const toggle = () => {
    setOnlineVoicesSetting(!onlineVoices);
    setOnlineVoices(!onlineVoices);
  };

  return (
    <SettingsSwitchRow
      label={_('Online Voices')}
      description={_(
        'Read aloud with Microsoft Edge voices. The text being read is sent to Microsoft. Takes effect the next time reading aloud starts.',
      )}
      checked={onlineVoices}
      onChange={toggle}
    />
  );
};

export default OnlineVoicesRow;
