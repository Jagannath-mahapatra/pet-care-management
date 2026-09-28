import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Appointment,
  AppointmentService
} from './services/appointment.service';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap
} from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {

  protected readonly title = signal('PawCare');

  // Angular 21 reactive state
  appointments = signal<Appointment[]>([]);

  search = signal('');
  selectedStatus = signal('');

  // Only true during initial loading
  loading = signal(true);

  private searchSubject = new Subject<string>();

  // Computed signals
  totalAppointments = computed(() =>
    this.appointments().length
  );

  scheduledCount = computed(() =>
    this.appointments().filter(
      item => item.status === 'Scheduled'
    ).length
  );

  completedCount = computed(() =>
    this.appointments().filter(
      item => item.status === 'Completed'
    ).length
  );

  cancelledCount = computed(() =>
    this.appointments().filter(
      item => item.status === 'Cancelled'
    ).length
  );

  constructor(
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {

    // Initial data
    this.loadAppointments(true);

    // Search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(search =>
          this.appointmentService.getAppointments(
            search,
            this.selectedStatus()
          )
        )
      )
      .subscribe({
        next: (data) => {
          this.appointments.set(data);
        },
        error: (error) => {
          console.error('Search error:', error);
        }
      });
  }

  loadAppointments(initialLoad = false): void {

    if (initialLoad) {
      this.loading.set(true);
    }

    this.appointmentService
      .getAppointments(
        this.search(),
        this.selectedStatus()
      )
      .subscribe({
        next: (data) => {

          console.log('Appointments received:', data);

          this.appointments.set(data);

          if (initialLoad) {
            this.loading.set(false);
          }
        },

        error: (error) => {

          console.error(
            'Appointment API error:',
            error
          );

          if (initialLoad) {
            this.loading.set(false);
          }
        }
      });
  }

  onSearch(): void {
    this.searchSubject.next(this.search());
  }

  onStatusChange(): void {
    this.loadAppointments();
  }

  updateStatus(
    appointment: Appointment,
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    const newStatus = select.value;

    this.appointmentService
      .updateStatus(
        appointment.id,
        newStatus
      )
      .subscribe({
        next: () => {

          // Signal-friendly immutable update
          this.appointments.update(
            appointments =>
              appointments.map(item =>
                item.id === appointment.id
                  ? {
                      ...item,
                      status: newStatus
                    }
                  : item
              )
          );
        },

        error: (error) => {

          console.error(
            'Status update error:',
            error
          );

          select.value = appointment.status;
        }
      });
  }
}