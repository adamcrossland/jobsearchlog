import Alpine from 'alpinejs'
import { dateToString } from './conversions'
import { DataItem} from "./DataItems"
import Settings from "./Settings"
import { SortOrder } from './Sorting'
import { JobSearchItem} from  "./JobSearchItem"

// suggested in the Alpine docs:
// make Alpine on window available for better DX
window.Alpine = Alpine

const storageKey: string = "jobSearchData";

class JobSearchViewModel {
    public JobSearchData: JobSearchItem[];
    private nextRowId: number;
    private rowsHaveBeenDeleted: boolean;
    public DetailsShown: boolean;
    public DetailsToShow: JobSearchItem|null;
    public Settings: Settings;
    private currentSortOrder: SortOrder = SortOrder.Unknown;
    public SettingsShown: boolean;
    public CurrentView: JobSearchItem[] = [];
    private searchTerm: string;


    constructor() {
        this.nextRowId = 0;
        this.rowsHaveBeenDeleted = false;
        this.DetailsToShow = new JobSearchItem(0);
        this.DetailsShown = false;
        this.JobSearchData = [];
        this.Settings = Settings.LoadSettings();
        this.LoadData();
        this.populateCurrentView();
        this.currentSortOrder = this.Settings.DefaultSortOrder;
        this.sortView(this.currentSortOrder);
        this.SettingsShown = false;
        this.searchTerm = "";
    }

    public LoadData(): void {
        this.JobSearchData = [];
        // Load data from localStorage
        let storedJobSearchData: string | null = localStorage.getItem(storageKey);
        let largestIdFound: number = 0;
        if (storedJobSearchData != null && storedJobSearchData.length > 0) {
            let loadedData: JobSearchItem[] = JSON.parse(storedJobSearchData);
            loadedData.forEach((row) => {
                let newItem: JobSearchItem = new JobSearchItem(row.Id, row.StartDate.Value, row.UpdatedDate.Value, row.EmployerName.Value, row.JobTitle.Value, row.Open);
                newItem.SetDetails(row.Details);
                this.JobSearchData.push(newItem);
                if (newItem.Id > largestIdFound) {
                    largestIdFound = newItem.Id;
                }
            });
            this.nextRowId = largestIdFound + 1;

            if (this.Settings.DefaultStartDate) {
                let earliestDate = dateToString(new Date());
                this.JobSearchData.forEach((row) => {
                    if (row.StartDate.Data < earliestDate) {
                        earliestDate = row.StartDate.Data;
                    }
                });

                this.Settings.ShowDateRangeBegin = earliestDate;
                // Don't want to make the user hit Save right away, so automaticallly persist
                this.Persist();
            }
        }
    }

    public IsEmpty(): boolean {
        return this.JobSearchData.length === 0;
    }

    public NewSearchRow(): void {
        let currentDate:string = dateToString(new Date());
        let newRow: JobSearchItem = new JobSearchItem(this.nextRowId++, currentDate, currentDate);
        // Make fields ready to edit
        newRow.EmployerName.BeingEdited = true;
        newRow.JobTitle.BeingEdited = true;
        newRow.StartDate.BeingEdited = false;
        newRow.UpdatedDate.BeingEdited = false;
        // Add to the top of the aray, so it will be visible to the user with no effort on their part
        this.JobSearchData.unshift(newRow);
        this.CurrentView.unshift(newRow);

        // Not totally sure that this belongs here, but it is convenient.
        // TODO: determine if this is the optimal place to handle setting input focus
        Alpine.nextTick(() => {
            // @ts-ignore
            document.querySelectorAll(".employer-name-editable")[0].focus();
        });
    }

    public EditField(field: DataItem, element: HTMLElement) {
        field.BeingEdited = true;
        Alpine.nextTick(() => {
            element.focus();
        });
    }

    public get PersistableChanges():boolean {
        let haveChanges: boolean = false;

        if (this.rowsHaveBeenDeleted) {
            haveChanges = true;
        }

        haveChanges ||= this.Settings.IsDirty;

        for (let i = 0; i < this.JobSearchData.length && !haveChanges; i++) {
            haveChanges ||= this.JobSearchData[i].IsDirty;
        }

        return haveChanges;
    }

    public Persist(): void {
        this.JobSearchData.forEach((eachRow:JobSearchItem) => {
            eachRow.PrepareToPersist();
        });

        let serializedData: string = JSON.stringify(this.JobSearchData);
        localStorage.setItem(storageKey, serializedData);

        this.rowsHaveBeenDeleted = false;

        this.JobSearchData.forEach((eachRow:JobSearchItem) => {
            eachRow.AfterPersisting();
        });

        this.Settings.Persist();
        this.Settings?.AfterPersisting();

        // After persisting, sort so that any new rows appear where they should
        this.sortView(this.CurrentSortOrder);
    }

    public Revert(): void {
        this.LoadData();
        this.rowsHaveBeenDeleted = false;
        this.Settings.Revert();
        this.refreshCurrentView();
    }

    public Delete(id: number) {
        let indexToDelete: number = -1;
        for (let i = 0; i < this.JobSearchData.length && indexToDelete == -1; i++) {
            if (this.JobSearchData[i].Id == id) {
                indexToDelete = i;
            }
        }
        if (indexToDelete > -1) {
            this.JobSearchData.splice(indexToDelete, 1);
            this.rowsHaveBeenDeleted = true;
        }

        // We need to make sure that CurrentView is updated to show that the row
        // has been removed.
        this.refreshCurrentView();
    }

    get CurrentSortIsDefault(): boolean {
        return this.CurrentSortOrder == this.Settings?.DefaultSortOrder;
    }

    SetCurrentSortAsDefault() {
        this.Settings.DefaultSortOrder = this.CurrentSortOrder;
    }

    private populateCurrentView() {
        let startDate: string = this.Settings?.ShowDateRangeBegin || "1970-01-01";
        let endDate: string = this.Settings?.ShowDateRangeEnd || dateToString(new Date());
        this.CurrentView = this.JobSearchData.filter((row) => {
            let include:boolean = true;
            
            if (this.Settings.OnlyShowActive && !row.Open) {
                include = false;
            }

            if (include && this.Settings.DateRangeBeginFilteringOn && row.StartDate.Data < startDate) {
                include = false;
            }

            if (include && this.Settings.DateRangeEndFilteringOn && row.StartDate.Data > endDate) {
                include = false;
            }

            if (include && this.searchTerm?.length > 0) {
                if (row.SearchText.indexOf(this.searchTerm) == -1) {
                    include = false;
                }
            } 

            return include;
        });
    }

    private sortView(order:SortOrder) {
        switch (order) {
            case 3: // SortOrder.ActiveFirstDateDescending:
                this.CurrentView.sort((a, b) => {
                    if (a.Open == b.Open) {
                        if (a.StartDate.Data < b.StartDate.Data) {
                            return 1;
                        } else if (a.StartDate.Data > b.StartDate.Data) {
                            return -1;
                        } else {
                            return 0;
                        }
                    } else {
                        if (a.Open && !b.Open) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }
                });
                break;
            case 4: // SortOrder.ActiveFirstDateAscending
                this.CurrentView.sort((a, b) => {
                    if (a.Open == b.Open) {
                        if (a.StartDate.Data < b.StartDate.Data) {
                            return -1;
                        } else if (a.StartDate.Data > b.StartDate.Data) {
                            return 1;
                        } else {
                            return 0;
                        }
                    } else {
                        if (a.Open && !b.Open) {
                            return -1;
                        } else {
                            return 1;
                        }
                    }
                });
                break;
            case 2: // SortOrder.DateAscending
                
                this.CurrentView.sort((a, b) => {
                    if (a.StartDate.Data < b.StartDate.Data) {
                        return -1;
                    } else if (a.StartDate.Data > b.StartDate.Data) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                break;
            // @ts-ignore
            default: 
                console.error(`Got an unknown SortOrder value of ${order}; assuming DateDescending`);
            case 1: // SortOrder.DateDescending
                this.CurrentView.sort((a, b) => {
                    if (a.StartDate.Data < b.StartDate.Data) {
                        return 1;
                    } else if (a.StartDate.Data > b.StartDate.Data) {
                        return -1;
                    } else {
                        return 0;
                    }
                });
                break;
        }
    }

    get CurrentSortOrder(): SortOrder {
        return this.currentSortOrder;
    }

    set CurrentSortOrder(newSortOrder: SortOrder) {
        this.currentSortOrder = newSortOrder;
        this.sortView(this.currentSortOrder);
    }

    refreshCurrentView() {
        this.populateCurrentView();
        this.sortView(this.CurrentSortOrder);
    }

    get FilterDateBegin(): string {
        return this.Settings?.ShowDateRangeBegin || "1970-01-01";
    }

    set FilterDateBegin(newDate: string) {
        if (this.Settings != null) {
            this.Settings.ShowDateRangeBegin = newDate;
            this.refreshCurrentView();
        }
    }

    get FilterDateEnd(): string {
        return this.Settings?.ShowDateRangeEnd || dateToString(new Date());
    }

    set FilterDateEnd(newDate: string) {
        if (this.Settings != null) {
            this.Settings.ShowDateRangeEnd = newDate;
            this.refreshCurrentView();
        }
    }

    get Search(): string {
        return this.searchTerm;    
    }

    set Search(term: string) {
        this.searchTerm = term.toLowerCase();
        this.populateCurrentView();
    }

    get OnlyShowActive(): boolean {
        return this.Settings.OnlyShowActive;
    }

    set OnlyShowActive(newValue: boolean) {
        this.Settings.OnlyShowActive = newValue;
        this.populateCurrentView();
    }

    get BeginDateRangeFiltering(): boolean {
        return this.Settings.DateRangeBeginFilteringOn;
    }

    set BeginDateRangeFiltering(newValue: boolean) {
        this.Settings.DateRangeBeginFilteringOn = newValue;
        this.populateCurrentView();
    }

    get EndDateRangeFiltering(): boolean {
        return this.Settings.DateRangeEndFilteringOn;
    }

    set EndDateRangeFiltering(newValue: boolean) {
        this.Settings.DateRangeEndFilteringOn = newValue;
        this.populateCurrentView();
    }
}

Alpine.store('jobsearchdata', new JobSearchViewModel());
Alpine.start()
