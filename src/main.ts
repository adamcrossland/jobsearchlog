import Alpine from 'alpinejs'

// suggested in the Alpine docs:
// make Alpine on window available for better DX
window.Alpine = Alpine

Alpine.store('jobsearchdata', {
    searches: [
        {
            StartDate: "10/15/2024",
            UpdateDate: "11/01/2024",
            EmployerName: "National Grid"
        }
    ],
    get empty() {
        return this.searches.length === 0
    }
});

Alpine.start()
