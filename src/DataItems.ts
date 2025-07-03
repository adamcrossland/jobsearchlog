import { dateToString } from "./conversions"

interface IDataItem {
    Data: string | boolean;
    SaveChanges(): void;
    ResetChanges(): void;
    toJSON: object;
}

export class DataItem implements IDataItem {
    public Value: string;
    public BeingEdited: boolean;

    protected tempValue: string|null;
    private prepersistedValue: string|null;

    constructor(value: string = "", beingEdited: boolean = false) {
        this.Value = value;
        this.tempValue = null;
        this.prepersistedValue = null;
        this.BeingEdited = beingEdited;
    }

    public SaveChanges(): void {
        if (this.tempValue != null && (this.tempValue != this.Value)) {
            this.prepersistedValue = this.tempValue;
            this.tempValue = null;
            this.BeingEdited = false;
        } else {
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

export enum DetailKind {
    Unknown = 0,
    Note,
    Contact,
    URL,
    State
}

export class DetailDataItem extends DataItem {
    public Kind: DetailKind;
    public AddedDate: string;
    static linkedInRegExp = /^(https:\/\/www.linkedin\.com\/jobs\/view\/\d+\/).+/;
    private copied: boolean;

    constructor(newKind:DetailKind = DetailKind.Unknown, value:string = "", addedDate:Date = new Date()) {
        super(value, false);
        this.Kind = newKind;
        this.AddedDate = dateToString(addedDate);
        this.copied = false;
    }

    public get KindText(): string {
        let text = "Unknown";
        switch (this.Kind) {
            case 1: text = "Note";
                break;
            case 2: text = "Contact";
                break;
            case 3: text = "URL";
                break;
            case 4: text = "State";
                break;
        }

        return text;
    }

    public override SaveChanges(): void {
        if (this.Kind === 3) {
            // For URLs, we may apply transformation to shorten them to only the
            // important values. For example, LinkedIn links have loads of parameters
            // that are not realy needed for us.
            let liMatch = DetailDataItem.linkedInRegExp.exec(this.tempValue ?? "");
            if (liMatch != null) {
                this.tempValue = liMatch[1];
            }

            super.SaveChanges();
        } else {
            super.SaveChanges();
        }  
    }

    public toJSON() {
        return {
            Value: this.Value,
            Kind: this.Kind,
            AddedDate: this.AddedDate
        } 
    }

    public get Copied(): boolean {
        return this.copied;
    }

    public set Copied(val: boolean) {
        this.copied = val;
        if (val) {
            // The copied status is true for five seconds and is then reset
            setTimeout(() => { this.copied = false }, 5000);
        }
    }

    public CopyToClipboard() {
        navigator.clipboard.writeText(this.Data);
        this.Copied = true;
    }
}

