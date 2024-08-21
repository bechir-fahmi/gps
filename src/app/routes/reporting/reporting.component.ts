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
  providers:[MessageService]
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

          doc.setFontSize(20);
          doc.text(result.deviceName, 10, 10);

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
              startY: 30
            });
          } else {
            doc.setFontSize(16);
            doc.text("No data available for this device.", 10, 30);
          }
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
