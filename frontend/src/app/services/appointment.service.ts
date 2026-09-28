import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  doctor: string;
  reason: string;
  status: string;
  pet_name: string;
  species: string;
  owner_name: string;
  owner_phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private apiUrl = 'http://localhost:5002/api/appointments';

  constructor(private http: HttpClient) {}

  getAppointments(
    search: string = '',
    status: string = ''
  ): Observable<Appointment[]> {

    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Appointment[]>(
      this.apiUrl,
      { params }
    );
  }

  updateStatus(
    id: number,
    status: string
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }
}