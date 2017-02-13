import { Injectable } from '@angular/core';
import { Observable, Subject }    from 'rxjs/rx';
import fs from 'fs';


import { ILocation }  from './location';
import { LOCATIONS }  from './mock-tree';

@Injectable()
export class LocationService {
  private locationSource = new Subject<ILocation[]>();
  private location$ = this.locationSource.asObservable();
  private locationInterval: number;
  private locationIncrement: number = 1;

  getLocations() {
    return LOCATIONS;
  }

  getLocationObservable() {
    this.fetchLocations();
    return this.location$;
  }

  fetchLocations() {
    setTimeout(() => {
      this.locationSource.next(LOCATIONS);
    }, 10)
  }

  startLocationStream() {
    this.locationInterval = setInterval(() => {
      this.incrementLocationStream();
    }, 10);
  }

  incrementLocationStream() {
    if (this.locationIncrement === LOCATIONS.length) {
      this.stopLocationStream();
      return;
    }

    let locations = LOCATIONS.slice(0, this.locationIncrement);
    this.locationSource.next(locations);
    this.locationIncrement++
  }

  stopLocationStream() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }
  }

  readDirectory(dir: string): Observable<any> {
    return Observable.bindNodeCallback(fs.readdir)(dir).flatMap(arr => Observable.from(arr));
  }

}
