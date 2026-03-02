import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class exportService {

    exportToCsv(data: any[], fileName: string): void {

        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);

        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] ?? '';
                    const escaped = String(value).replace(/"/g, '""')
                    return `"${escaped}"`;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n')

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: 'text/csv;charset=utf-8' }
        );

        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
}