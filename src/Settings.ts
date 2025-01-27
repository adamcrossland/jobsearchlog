import { SortOrder } from "./Sorting";
import { dateToString } from "./conversions";

const settingsStorageKey = "jobSearchSettings";

interface ISettings {
    DefaultSortOrder: SortOrder;
    ShowDateRangeBegin: string|null;
    ShowDateRangeEnd: string|null;
}

export default class Settings implements ISettings {
    DefaultSortOrder: SortOrder;
    CurrentSortOrder: SortOrder;
    ShowDateRangeBegin: string|null;
    ShowDateRangeEnd: string|null;
    private origSettings: ISettings;

    constructor(defaultSortOrder: SortOrder = SortOrder.ActiveFirstDateDescending,
            showDateRangeBegin: string|null = "1970-01-01",
            showDateRangeEnd: string|null = dateToString(new Date())) {
        this.DefaultSortOrder = defaultSortOrder;
        this.ShowDateRangeBegin = showDateRangeBegin;
        this.ShowDateRangeEnd = showDateRangeEnd;
        this.origSettings = this.Copy();
        this.CurrentSortOrder = defaultSortOrder;
    }

    public static LoadSettings(): Settings {
        let loadedSettings: Settings = new Settings();
        let rawLoadedSettings: Settings = new Settings();
        let loadedSettingsString: string | null = localStorage.getItem(settingsStorageKey);
        
        if (loadedSettingsString != null && loadedSettingsString.length > 0) {
            rawLoadedSettings = JSON.parse(loadedSettingsString);
            loadedSettings = new Settings(rawLoadedSettings.DefaultSortOrder, rawLoadedSettings.ShowDateRangeBegin || null,
                rawLoadedSettings.ShowDateRangeEnd
            );
        }

        return loadedSettings;
    }

    get IsDirty(): boolean {
        let isDirty = false;

        if (this.DefaultSortOrder != this.origSettings.DefaultSortOrder) {
            isDirty = true;
        } else if (this.ShowDateRangeBegin != this.origSettings.ShowDateRangeBegin) {
            isDirty = true;
        } else if (this.ShowDateRangeEnd != this.origSettings.ShowDateRangeEnd) {
            isDirty = true;
        }

        return isDirty;
    }

    public Persist() {
        let serializedSettings: string = JSON.stringify(this);
        localStorage.setItem(settingsStorageKey, serializedSettings);
    }

    public AfterPersisting() {
        this.origSettings = this;
    }

    public toJSON() {
        return {
            DefaultSortOrder: this.DefaultSortOrder,
            ShowDateRangeBegin: this.ShowDateRangeBegin,
            ShowDateRangeEnd: this.ShowDateRangeEnd
        }
    }

    public Copy(): ISettings {
        let copy: ISettings = {
            DefaultSortOrder: this.DefaultSortOrder,
            ShowDateRangeBegin: this.ShowDateRangeBegin,
            ShowDateRangeEnd: this.ShowDateRangeEnd

        }

        return copy;
    }

    public Revert() {
        this.DefaultSortOrder = this.origSettings.DefaultSortOrder;
        this.ShowDateRangeBegin = this.origSettings.ShowDateRangeBegin;
        this.ShowDateRangeEnd = this.origSettings.ShowDateRangeEnd;
    }
}