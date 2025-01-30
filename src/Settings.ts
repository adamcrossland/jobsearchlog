import { SortOrder } from "./Sorting";
import { dateToString } from "./conversions";

const settingsStorageKey = "jobSearchSettings";

interface ISettings {
    DefaultSortOrder: SortOrder;
    ShowDateRangeBegin: string|null;
    ShowDateRangeEnd: string | null;
    OnlyShowActive: boolean | null;
    DateRangeBeginFilteringOn: boolean;
    DateRangeEndFilteringOn: boolean;
}

export default class Settings implements ISettings {
    DefaultSortOrder: SortOrder;
    CurrentSortOrder: SortOrder;
    ShowDateRangeBegin: string|null;
    ShowDateRangeEnd: string | null;
    DateRangeBeginFilteringOn: boolean;
    DateRangeEndFilteringOn: boolean;
    private origSettings: ISettings;
    public OnlyShowActive: boolean;

    constructor(defaultSortOrder: SortOrder = SortOrder.ActiveFirstDateDescending,
            showDateRangeBegin: string|null = "1970-01-01",
            showDateRangeEnd: string | null = dateToString(new Date()),
            onlyShowActive: boolean = false, dateRangeBeginOn: boolean = false,
            dateRangeEndOn: boolean = false) {
        this.DefaultSortOrder = defaultSortOrder;
        this.ShowDateRangeBegin = showDateRangeBegin;
        this.ShowDateRangeEnd = showDateRangeEnd;
        this.CurrentSortOrder = defaultSortOrder;
        this.OnlyShowActive = onlyShowActive;
        this.DateRangeBeginFilteringOn = dateRangeBeginOn;
        this.DateRangeEndFilteringOn = dateRangeEndOn;
        this.origSettings = this.Copy();
    }

    public static LoadSettings(): Settings {
        let loadedSettings: Settings = new Settings();
        let rawLoadedSettings: Settings = new Settings();
        let loadedSettingsString: string | null = localStorage.getItem(settingsStorageKey);
        
        if (loadedSettingsString != null && loadedSettingsString.length > 0) {
            rawLoadedSettings = JSON.parse(loadedSettingsString);
            loadedSettings = new Settings(rawLoadedSettings.DefaultSortOrder, rawLoadedSettings.ShowDateRangeBegin || null,
                rawLoadedSettings.ShowDateRangeEnd, rawLoadedSettings.OnlyShowActive,
                rawLoadedSettings.DateRangeBeginFilteringOn,
                rawLoadedSettings.DateRangeEndFilteringOn
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
        } else if (this.OnlyShowActive != this.origSettings.OnlyShowActive) {
            isDirty = true;
        } else if (this.DateRangeBeginFilteringOn != this.origSettings.DateRangeBeginFilteringOn) {
            isDirty = true;
        } else if (this.DateRangeEndFilteringOn != this.origSettings.DateRangeEndFilteringOn) {
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
            ShowDateRangeEnd: this.ShowDateRangeEnd,
            OnlyShowActive: this.OnlyShowActive,
            DateRangeBeginFilteringOn: this.DateRangeBeginFilteringOn,
            DateRangeEndFilteringOn: this.DateRangeEndFilteringOn
        }
    }

    public Copy(): ISettings {
        let copy: ISettings = {
            DefaultSortOrder: this.DefaultSortOrder,
            ShowDateRangeBegin: this.ShowDateRangeBegin,
            ShowDateRangeEnd: this.ShowDateRangeEnd,
            OnlyShowActive: this.OnlyShowActive,
            DateRangeBeginFilteringOn: this.DateRangeBeginFilteringOn,
            DateRangeEndFilteringOn: this.DateRangeEndFilteringOn
        }

        return copy;
    }

    public Revert() {
        this.DefaultSortOrder = this.origSettings.DefaultSortOrder;
        this.ShowDateRangeBegin = this.origSettings.ShowDateRangeBegin;
        this.ShowDateRangeEnd = this.origSettings.ShowDateRangeEnd;
        this.OnlyShowActive = this.origSettings.OnlyShowActive || false;
        this.DateRangeBeginFilteringOn = this.origSettings.DateRangeBeginFilteringOn;
        this.DateRangeEndFilteringOn = this.origSettings.DateRangeEndFilteringOn
    }

    get DefaultStartDate(): boolean {
        if (this.ShowDateRangeBegin == "1970-01-01") {
            return true;
        }

        return false;
    }
}