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

    constructor(value: string = "", beingEdited: boolean = false) {
        this.Value = value;
        this.BeingEdited = beingEdited;
    }
}

class JobSearchItem {
    Id: number;
    StartDate: DataItem;
    UpdatedDate: DataItem;
    EmployerName: DataItem;

    constructor(id: number, startDate: string = dateToString(new Date()),
            updatedDate: string = dateToString(new Date()), employerName: string = "") {
        this.Id = id;
        this.StartDate = new DataItem(startDate, false);
        this.UpdatedDate = new DataItem(updatedDate, false);
        this.EmployerName = new DataItem(employerName, false);
    }
}

const storageKey: string = "jobSearchData";

class JobSearchViewModel {
    
    public JobSearchData: JobSearchItem[];
    private nextRowId: number;

    constructor() {
        this.nextRowId = 0;
        let storedJobSearchData: string|null = localStorage.getItem(storageKey);
        if (storedJobSearchData != null &&  storedJobSearchData.length > 0) {
            this.JobSearchData = JSON.parse(storedJobSearchData);
        } else {
            this.JobSearchData = [];
        }
    }

    public IsEmpty(): boolean {
        return this.JobSearchData.length === 0;
    }

    public NewSearchRow(): void {
        let currentDate:string = dateToString(new Date());
        let newRow: JobSearchItem = new JobSearchItem(++this.nextRowId, currentDate, currentDate);
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

    public Persist(): void {
        console.log("Persisted!");
        let serializedData: string = JSON.stringify(this.JobSearchData);
        localStorage.setItem(storageKey, serializedData);
    }
}

Alpine.store('jobsearchdata', new JobSearchViewModel());
Alpine.start()
