import { Injectable } from '@angular/core';
import { Observable, Subject }    from 'rxjs/rx';
import * as fs from 'fs';
import * as path from 'path';


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
    // console.log(dir);
    if (!fs.statSync(dir).isDirectory()) {
      return Observable.from([]);
    }

    if (!dir.endsWith('/')) {
      dir += '/'
    }

    return Observable
      .bindNodeCallback(fs.readdir)(dir)
      .flatMap(arr => Observable.from(arr))
      .map(name => {
        let filePath = dir + name;
        return {path: filePath, name: name};
      })
  }

  readStats(dir: string): Observable<any> {
    return Observable.bindNodeCallback(fs.stat)(dir);
  }

}
