import Alpine from 'alpinejs'

// suggested in the Alpine docs:
// make Alpine on window available for better DX
window.Alpine = Alpine

function dateToString(dateToConvert: Date): string {
    return dateToConvert.toISOString().split('T')[0];
}

class DataItem {
    public Value: string;
    public BeingEdited: boolean;

    private tempValue: string|null;
    private prepersistedValue: string | null;

    constructor(value: string = "", beingEdited: boolean = false) {
        this.Value = value;
        this.tempValue = null;
        this.prepersistedValue = null;
        this.BeingEdited = beingEdited;
    }

    public SaveChanges(): void {
        if (this.tempValue != null && this.tempValue != this.Value) {
            this.prepersistedValue = this.tempValue;
            this.tempValue = null;
            this.BeingEdited = false;
        }
    }

    public ResetChanges(): void {
        this.tempValue = null;
        this.BeingEdited = false;
    }

    public get Data(): string {
        if (this.tempValue != null) {
            return this.tempValue;
        } else if (this.prepersistedValue != null) {
            return this.prepersistedValue;
        }

        return this.Value;
    }

    public set Data(newValue: string) {
        this.tempValue = newValue;
    }

    get HasChanges(): boolean {
        return this.prepersistedValue != null;
    }

    public PrepareToPersist() {
        if (this.prepersistedValue != null) {
            this.Value = this.prepersistedValue;
            this.prepersistedValue = null;
        }
        this.BeingEdited = false;
    }

    public toJSON() {
        return {
            Value: this.Value
        }
    }
}

class JobSearchItem {
    Id: number;
    StartDate: DataItem;
    UpdatedDate: DataItem;
    EmployerName: DataItem;
    DetailsOpen: boolean;

    constructor(id: number, startDate: string = dateToString(new Date()),
        updatedDate: string = dateToString(new Date()), employerName: string = "") {
        this.Id = id;
        this.StartDate = new DataItem(startDate, false);
        this.UpdatedDate = new DataItem(updatedDate, false);
        this.EmployerName = new DataItem(employerName, false);
        this.DetailsOpen = false;
    }

    public PrepareToPersist(): void {
        this.StartDate.PrepareToPersist();
        this.UpdatedDate.PrepareToPersist();
        this.EmployerName.PrepareToPersist();
    }

    get IsDirty(): boolean {
        return this.EmployerName.HasChanges || this.StartDate.HasChanges || this.UpdatedDate.HasChanges;
    }

    public toJSON() {
        return {
            Id: this.Id,
            StartDate: this.StartDate,
            UpdatedDate: this.UpdatedDate,
            EmployerName: this.EmployerName
        }
    }
}

const storageKey: string = "jobSearchData";

class JobSearchViewModel {
    
    public JobSearchData: JobSearchItem[];
    private nextRowId: number;
    private rowsHaveBeenDeleted: boolean;

    constructor() {
        this.nextRowId = 0;
        this.rowsHaveBeenDeleted = false;
        this.JobSearchData = [];
        this.LoadData();
    }

    public LoadData(): void {
        this.JobSearchData = [];
        // Load data from localStorage
        let storedJobSearchData: string | null = localStorage.getItem(storageKey);
        let largestIdFound: number = 0;
        if (storedJobSearchData != null && storedJobSearchData.length > 0) {
            let loadedData: JobSearchItem[] = JSON.parse(storedJobSearchData);
            loadedData.forEach((row) => {
                let newItem: JobSearchItem = new JobSearchItem(row.Id, row.StartDate.Value, row.UpdatedDate.Value, row.EmployerName.Value);
                this.JobSearchData.push(newItem);
                if (newItem.Id > largestIdFound) {
                    largestIdFound = newItem.Id;
                }
            });
            this.nextRowId = largestIdFound + 1;
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
        newRow.StartDate.BeingEdited = true;
        newRow.UpdatedDate.BeingEdited = true;
        // Add to the top of the aray, so it will be visible to the user with no effort on their part
        this.JobSearchData.unshift(newRow);

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
    }

    public Revert(): void {
        this.LoadData();
        this.rowsHaveBeenDeleted = false;
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
    }
}

Alpine.store('jobsearchdata', new JobSearchViewModel());
Alpine.start()
