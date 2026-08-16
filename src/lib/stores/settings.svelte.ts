export const SCAN_POLLING_RATES = [100, 200, 300, 400, 500] as const;
export type ScanPollingRate = (typeof SCAN_POLLING_RATES)[number];
export const DEFAULT_SCAN_POLLING_RATE: ScanPollingRate = 300;

const STORAGE_KEY = 'riv.settings.scan-polling-rate';

function isScanPollingRate(value: number): value is ScanPollingRate {
  return (SCAN_POLLING_RATES as readonly number[]).includes(value);
}

function readStoredScanPollingRate(): ScanPollingRate {
  if (typeof localStorage === 'undefined') return DEFAULT_SCAN_POLLING_RATE;
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return isScanPollingRate(stored) ? stored : DEFAULT_SCAN_POLLING_RATE;
}

class SettingsStore {
  scanPollingRate = $state<ScanPollingRate>(readStoredScanPollingRate());

  setScanPollingRate(rate: ScanPollingRate): void {
    this.scanPollingRate = rate;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(rate));
    }
  }
}

export const settingsStore = new SettingsStore();
