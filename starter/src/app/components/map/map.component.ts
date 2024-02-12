import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { useGeographic } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { Map as OpenMap, View } from 'ol';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile';

@Component({
  selector: 'starter-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styles: ``,
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLElement>;
  mapComponent: OpenMap | undefined;

  ngOnInit() {
    useGeographic();
    this.registerProjections();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.mapComponent = new OpenMap({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: this.mapContainer.nativeElement,
      maxTilesLoading: 64,
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });
  }

  registerProjections() {
    register(proj4);
  }
}
