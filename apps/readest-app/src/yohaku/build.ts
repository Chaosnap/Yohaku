/**
 * Yohaku is built from Readest. `.env.tauri` sets NEXT_PUBLIC_YOHAKU_BUILD for every
 * app build, while the unit tests run without it: upstream tests keep checking
 * Readest's behaviour, and Yohaku tests stub the variable on.
 *
 * In a Yohaku build there are no accounts, cloud services, payments or telemetry,
 * and nothing reaches the network unless the user sets up an online feature.
 */
export const isYohakuBuild = () => process.env['NEXT_PUBLIC_YOHAKU_BUILD'] === 'true';

/** Readest's strings name the app; a Yohaku build shows its own name instead. */
export const toYohakuBrand = (value: string) => value.replace(/Readest/g, 'Yohaku');
