import { Component, Inject } from '@angular/core';
import { Device } from '../../shared/models/device';
import { DeviceService } from '../../Services/device/device.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ParkingDetectionService } from '../../Services/parking/parking-detection.service';
import { map, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.css',
  providers: [MessageService]
})
export class ReportingComponent {

  startDate: Date | null = null;
  endDate: Date | null = null;
  devices: Device[] = [];
  selectedDevices: Device[] = [];
  constructor(private deviceService: DeviceService, private parkingDetectionService: ParkingDetectionService,
    private messageService: MessageService
  ) {
    this.startDate = null;
    this.endDate = null;
  }

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.deviceService.getDevices().subscribe(devices => {
      this.devices = devices;
    })
  }

  loadParking(deviceId: number, from: string, to: string): Observable<any[]> {
    return this.deviceService.getPositions(deviceId, from, to).pipe(
      map(positions => {
        if (positions.length > 0) {
          const parkings = this.parkingDetectionService.findTourParkings(positions);
          const travelings = this.parkingDetectionService.Travel(positions);
          const extendedParkings = parkings.map((parking, index) => ({
            ...parking,
            distanceFromLastParking: 0,
            timeFromLastParking: 0
          }));
          return [...extendedParkings, ...travelings];
        }
        return [];
      })
    );
  }
  generateReport() {
    if (this.startDate && this.endDate) {
      const startDateString = this.startDate.toISOString();
      const endDateString = this.endDate.toISOString();
      const startDateFormatted = this.startDate.toLocaleDateString();
      const endDateFormatted = this.endDate.toLocaleDateString();

      const headerImage = '../../../assets/images/icon-amena.jpg';
      const phoneIcon = '../../../assets/images/icons8-phone.png';
      const emailIcon = '../../../assets/images/icons8-email.png';

      let requests = this.selectedDevices.map(device =>
        this.loadParking(device.id, startDateString, endDateString).toPromise().then(parkings => {
          parkings?.forEach(parking => {
            parking.deviceName = device.name;
            parking.durationInMinutes = this.formatTimeToMinutes(parking.durationInMinutes);
          });
          const sortedParkings = parkings?.sort((a, b) => {
            return new Date(this.convertToISODate(a.deviceTime)).getTime() - new Date(this.convertToISODate(b.deviceTime)).getTime();
          });

          return {
            deviceName: device.name,
            parkings: sortedParkings
          };
        })
      );

      Promise.all(requests).then(results => {
        const doc = new jsPDF();

        results.forEach((result, index) => {
          if (index > 0) doc.addPage();

          // Header
          doc.addImage(headerImage, 'PNG', 180, 10, 15, 15); // Top right corner
          doc.setFontSize(16);

          // Title text with exact centering
          const titleLines = [
            `Report for device ${result.deviceName}`,
            `Start Date: ${startDateFormatted}`,
            `End Date: ${endDateFormatted}`
          ];

          const pageWidth = doc.internal.pageSize.width;
          const margin = 10;
          const lineHeight = 10; // Line height for multi-line text

          // Calculate x coordinate for center alignment
          titleLines.forEach((line, index) => {
            const titleWidth = doc.getTextWidth(line);
            const x = (pageWidth - titleWidth) / 2;

            // Position the text with line height adjustment
            doc.text(line, x, 20 + (index * lineHeight));
          });

          doc.setFontSize(12);

          // Table of data
          if (result.parkings!.length > 0) {
            const headers = [['Time', 'Duration', 'Type']];
            const datatable = result.parkings?.map(parking => [
              parking.deviceTime,
              parking.durationInMinutes,
              parking.type
            ]);

            autoTable(doc, {
              head: headers,
              body: datatable,
              startY: 40 + (titleLines.length * lineHeight) + 10 // Start Y after title
            });
          } else {
            doc.setFontSize(16);
            doc.text("No data available for this device.", 10, 40 + (titleLines.length * lineHeight) + 10);
          }

          // Footer
          const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
          doc.setDrawColor(31,56,112); // Black line
          doc.line(10, pageHeight - 20, 200, pageHeight - 20); // Line above footer

          doc.setFontSize(10);

          // Phone icon and text
          doc.addImage(phoneIcon, 'PNG', 10, pageHeight - 20, 10, 10); // Larger phone icon
          doc.text('Phone: 97 170 700 | 28 444 083', 25, pageHeight - 15); // Adjust text position

          // Email icon and text
          doc.addImage(emailIcon, 'PNG', 130, pageHeight - 20, 10, 10); // Larger email icon
          doc.text('Email: contact@amena-gps.com', 145, pageHeight - 15); // Adjust text position
        });

        doc.save("report" + Date.now() + ".pdf");
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'PDF generated successfully' });
      }).catch(error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to Generate PDF' });
        console.error("Error generating report: ", error);
      });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Start Date or End Date is missing' });
      console.error("Start Date or End Date is missing");
    }
  }



  convertToISODate(dateString: string): string {
    const [day, month, year, time] = dateString.split(/[/\s:]+/);
    return `${year}-${month}-${day}T${time}:00`;
  }


  formatTimeToMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return hours > 0
      ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`
      : `${mins} minute${mins > 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
  }

}
