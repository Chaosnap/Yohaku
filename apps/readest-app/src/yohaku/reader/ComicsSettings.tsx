import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { BoxedList, SettingsSwitchRow } from '@/components/settings/primitives';
import { getYohakuSettings, saveYohakuSettings } from '@/yohaku/settings';

/** Yohaku's comics settings, shown in the Layout panel. They apply to every comic. */
const ComicsSettings: React.FC = () => {
  const _ = useTranslation();
  const { envConfig } = useEnv();
  const { settings } = useSettingsStore();
  const { comicsRightToLeft } = getYohakuSettings(settings);

  return (
    <BoxedList title={_('Comics')}>
      <SettingsSwitchRow
        label={_('Right to Left by Default')}
        description={_(
          'For comics that do not set a reading direction. Manga marked right to left in ComicInfo.xml always opens that way.',
        )}
        checked={comicsRightToLeft}
        onChange={() => saveYohakuSettings(envConfig, { comicsRightToLeft: !comicsRightToLeft })}
      />
    </BoxedList>
  );
};

export default ComicsSettings;
