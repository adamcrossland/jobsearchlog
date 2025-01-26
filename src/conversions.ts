export function dateToString(dateToConvert: Date): string {
    return dateToConvert.toISOString().split('T')[0];
}