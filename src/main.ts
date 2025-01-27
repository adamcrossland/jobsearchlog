import Alpine from 'alpinejs'
import { dateToString } from './conversions'
import { DetailDataItem, DetailKind, DataItem} from "./DataItems"
import Settings from "./Settings"
import { SortOrder } from './Sorting'

// suggested in the Alpine docs:
// make Alpine on window available for better DX
window.Alpine = Alpine

class JobSearchItem {
    Id: number;
    StartDate: DataItem;
    UpdatedDate: DataItem;
    EmployerName: DataItem;
    JobTitle: DataItem;
    DetailsOpen: boolean;
    Details: DetailDataItem[];
    DetailsHaveChanged: boolean;
    Open: boolean;
    private origOpen: boolean;

    constructor(id: number, startDate: string = dateToString(new Date()),
        updatedDate: string = dateToString(new Date()), employerName: string = "",
        jobTitle: string = "", isOpen: boolean = true) {
        this.Id = id;
        this.StartDate = new DataItem(startDate, false);
        this.UpdatedDate = new DataItem(updatedDate, false);
        this.EmployerName = new DataItem(employerName, false);
        this.JobTitle = new DataItem(jobTitle, false);
        this.DetailsOpen = false;
        this.Details = [];
        this.DetailsHaveChanged = false;
        this.Open = isOpen;
        this.origOpen = isOpen;
    }

    public PrepareToPersist(): void {
        this.StartDate.PrepareToPersist();
        this.UpdatedDate.PrepareToPersist();
        this.EmployerName.PrepareToPersist();
        this.JobTitle.PrepareToPersist();
        this.Details.forEach((eachDetail) => {
            eachDetail.PrepareToPersist();
        });
        this.DetailsHaveChanged = false;
    }

    public AfterPersisting(): void {
        this.origOpen = this.Open;    
    }

    get IsDirty(): boolean {
        return this.EmployerName.HasChanges || this.StartDate.HasChanges || this.UpdatedDate.HasChanges
            || this.DetailsHaveChanged || this.Open != this.origOpen;
    }

    public AddDetail(detailKind: DetailKind, detailData: string) {
        let newDetail = new DetailDataItem(detailKind, detailData);
        newDetail.BeingEdited = true;
        this.Details.push(newDetail);
        this.DetailsHaveChanged = true;
    }

    public SetDetails(rawDetails: DetailDataItem[]) {
        this.Details = [];
        rawDetails.forEach((rawDetail: DetailDataItem) => {
            let newDetail: DetailDataItem = new DetailDataItem(rawDetail.Kind, rawDetail.Value);
            newDetail.AddedDate = rawDetail.AddedDate;
            this.Details.push(newDetail);
        });
    }

    public DeleteDetail(detailIndex: number) {
        this.Details.splice(detailIndex, 1);
        this.DetailsHaveChanged = true;
    }

    public get EmployerAndJobTitle(): string {
        let result: string = `${this.EmployerName.Data} - ${this.JobTitle.Data}`;
        if (!this.Open) {
            result += '- Inactive';
        }
        return result;
    }

    public toJSON() {
        return {
            Id: this.Id,
            StartDate: this.StartDate,
            UpdatedDate: this.UpdatedDate,
            EmployerName: this.EmployerName,
            JobTitle: this.JobTitle,
            Details: this.Details,
            Open: this.Open
        }
    }
}

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
            let firstElement: HTMLElement|null = document.querySelector("#searches-table tbody tr td + td input");
            if (firstElement != null) {
                firstElement.focus();
            }
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
        this.CurrentView = [];
        this.JobSearchData.forEach((row) => {
            if (row.StartDate.Data >= startDate && row.StartDate.Data <= endDate) {
                this.CurrentView.push(row);
            }
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
}

Alpine.store('jobsearchdata', new JobSearchViewModel());
Alpine.start()
