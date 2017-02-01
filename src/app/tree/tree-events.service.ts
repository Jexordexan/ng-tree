import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/rx';

export enum TREE_EVENT {
  DRAG_START,
  DRAG_MOVE,
  DRAG_END,
  DROP,
  TARGET_NODE,
  ADD_SELECT_NODE,
  RANGE_SELECT_NODE,
  SELECT_NODE,
  CLICK_NODE,
  EXPAND_NODE,
  COLLAPSE_NODE
}

export class TreeEventInfo {
  public eventKey: string
  public data: any
  constructor(eventKey: TREE_EVENT, data?: any) {
    this.eventKey = TREE_EVENT[eventKey];
    this.data = data;
  }
}

@Injectable()
export class TreeEventsService {
  private eventsSource = new Subject<any>();
  private event$ = this.eventsSource.asObservable();

  broadcast(eventKey: TREE_EVENT, data?: any) {
    let event = new TreeEventInfo(eventKey, data);
    this.eventsSource.next(event);
  }

  listen(eventKey: TREE_EVENT) {
    return this.event$
      .filter( event => event.eventKey === TREE_EVENT[eventKey] )
      .map( event => {
        return event.data === undefined ? event.eventKey: event.data;
      });
  }
  listenAll() {
    return this.event$;
  }
}
