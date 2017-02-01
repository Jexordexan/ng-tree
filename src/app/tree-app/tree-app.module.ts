import { NgModule }      from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { TreeModule }    from '../tree';
import { TreeAppComponent }  from './tree-app.component';

import 'styles/styles.css';

@NgModule({
  imports: [
    BrowserModule,
    TreeModule,
    FormsModule
  ],
  declarations: [
    TreeAppComponent,
  ],
  bootstrap: [ TreeAppComponent ]
})
export class TreeAppModule { }
