import { DataItem, DetailDataItem, DetailKind } from "./DataItems"
import {dateToString } from "./conversions"

export class JobSearchItem {
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
    private preparedSearchText: string;

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
        this.preparedSearchText = "";
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
        this.setSearchText();
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
        this.setSearchText();
    }

    public get EmployerAndJobTitle(): string {
        let result: string = `${this.EmployerName.Data} - ${this.JobTitle.Data}`;
        if (!this.Open) {
            result += '- Inactive';
        }
        return result;
    }

    private setSearchText() {
        let details:string = this.Details.map(
            (eachDetail) => { return eachDetail.Data.toLowerCase() }
        ).join(" ").trim();

        this.preparedSearchText =  `${this.EmployerName.Data.toLowerCase()} ${this.JobTitle.Data.toLowerCase()} ${details}`;
    }

    public get SearchText(): string {
        if (this.preparedSearchText == "") {
            this.setSearchText();
        }

        return this.preparedSearchText;
    }

    public get NewestDetailDate(): string {
        let newestDate: string = "";

        this.Details.forEach(d => {
            if (newestDate == "" || newestDate < d.AddedDate) {
                newestDate = d.AddedDate;
            }
        });

        return newestDate;
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