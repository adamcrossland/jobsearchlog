import Alpine from 'alpinejs'

// suggested in the Alpine docs:
// make Alpine on window available for better DX
window.Alpine = Alpine

interface DataItem {
    Value: string;
    BeingEdited: boolean;
}

interface JobSearchItem {
    Id: number;
    StartDate: DataItem;
    UpdatedDate: DataItem;
    EmployerName: DataItem;
}

let JobSearchData: JobSearchItem[] = [
];

Alpine.store('jobsearchdata', {
    searches: JobSearchData,

    get empty() {
        return this.searches.length === 0
    },

    newSearchRow() {
        let newRow = {
            Id: ++this.nextRowId,
            StartDate: { Value: new Date().toDateString(), BeingEdited: true },
            UpdatedDate: { Value: new Date().toDateString(), BeingEdited: true },
            EmployerName: { Value: "", BeingEdited: true }
        }
        this.searches.unshift(newRow);
        Alpine.nextTick(() => {
            document.querySelector("#searches-table tbody tr td + td input").focus();
        });
    },
    nextRowId: 0
});

Alpine.start()
