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

import { FormsModule } from '@angular/forms';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';

import Draw from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import GeometryCollection from 'ol/geom/GeometryCollection';
import Polygon from 'ol/geom/Polygon'
import Point from 'ol/geom/Point';
import { circular } from 'ol/geom/Polygon';
import { getDistance } from 'ol/sphere';
import { transform } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
@Component({
  selector: 'starter-map',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './map.component.html',
  styles: ``,
})
export class MapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLElement>;
  mapComponent: OpenMap | undefined;
  currentGeojsonLayer: VectorLayer<any> | undefined;
  source = new VectorSource();
  draw : any;
  snap : any;


  geojsonOptions = [
    { name: 'Clearing Regulations - Schedule One Areas (DWER-057)', value: 'assets/clearing.geojson' },
    { name: 'Custom', value: 'assets/custom.geojson' },
    { name: 'ecoregions', value: 'assets/ecoregions.geojson' },
    // Add more datasets as needed
  ];

  selectedGeojson: string = '';

  typeOptions = [
    { name: 'Point', value: 'Point' },
    { name: 'LineString', value: 'LineString' },
    { name: 'Polygon', value: 'Polygon' },
    { name: 'Circle Geometry', value: 'Circle' },
    { name: 'Geodesic Circle', value: 'Geodesic' },
    // Add more datasets as needed
  ];
  selectedType: string = ''; // Bind this to your select dropdown

  // constructor(private http: HttpClient) {}

  onGeojsonChange() {
    if (this.selectedGeojson) {
      this.updateMapLayer(this.selectedGeojson);
    }
  }

  private updateMapLayer(filePath: string) {
    if (this.currentGeojsonLayer) {
      this.mapComponent?.removeLayer(this.currentGeojsonLayer);
      this.currentGeojsonLayer = undefined;
    }

    const vectorSource = new VectorSource({
      url: filePath,
      format: new GeoJSON(),
    });

    const newLayer = new VectorLayer({
      source: vectorSource,
    });

    this.mapComponent?.addLayer(newLayer);
    this.currentGeojsonLayer = newLayer;
  }
  ngOnInit() {
    useGeographic();
    this.registerProjections();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    const style = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: '#33cc33',
        width: 2,
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: '#ffcc33',
        }),
      }),
    });

    const geodesicStyle = new Style({
      geometry: function (feature) {
        return feature.get('modifyGeometry') || feature.getGeometry();
      },
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: '#ff3333',
        width: 2,
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0)',
        }),
      }),
    });

    this.mapComponent = new OpenMap({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),

        new VectorLayer({
          source: this.source,
          style: function (feature) {
            const geometry = feature?.getGeometry();
            return geometry?.getType() === 'GeometryCollection' ? geodesicStyle : style;
          },
        })
        // new VectorLayer({
        //   source: new VectorSource({
        //     url: this.geojsonOptions[0].value, // Native_Veg_Extent_DPIRD_005_WA_GDA2020_Public.geojson
        //     format: new GeoJSON(),
        //   }),
        // }),

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
  addInteractions() {
    let value = this.selectedType;
    let geometryFunction;
    if (value === 'Geodesic') {
      value = 'Circle';
      const geometryFunction: any = function (coordinates: Coordinate[], geometry: GeometryCollection, projection: string) {
        if (!geometry) {
          geometry = new GeometryCollection([
            new Polygon([]),
            new Point(coordinates[0]),
          ]);
        }
        const geometries = geometry.getGeometries();
        const center = transform(coordinates[0], projection, 'EPSG:4326');
        const last = transform(coordinates[1], projection, 'EPSG:4326');
        const radius = getDistance(center, last);
        const circle = circular(center, radius, 128);
        circle.transform('EPSG:4326', projection);
        const pointGeometry = geometries[0] as Point;
        pointGeometry.setCoordinates(circle.getCoordinates());
        geometry.setGeometries(geometries);
        return geometry;
      };
    }
    this.draw = new Draw({
      source: this.source,
      type: value as any,
      geometryFunction: geometryFunction,
    });

    this.mapComponent?.addInteraction(this.draw);
    this.snap = new Snap({source: this.source});
    this.mapComponent?.addInteraction(this.snap);
  }
  drawGeometry() {
    if(this.draw && this.snap){
      this.mapComponent?.removeInteraction(this.draw);
      this.mapComponent?.removeInteraction(this.snap);
    }
    this.addInteractions()
  }
  exportMapData() {
    this.mapComponent?.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas');
      const size : any= this.mapComponent?.getSize();
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      const mapContext : any = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
          this.mapComponent?.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
          function (canvas) {
            if (canvas.width > 0) {
              const opacity =
                  canvas.parentNode.style.opacity || canvas.style.opacity;
              mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
              let matrix;
              const transform = canvas.style.transform;
              if (transform) {
                // Get the transform parameters from the style's transform matrix
                matrix = transform
                    .match(/^matrix\(([^\(]*)\)$/)[1]
                    .split(',')
                    .map(Number);
              } else {
                matrix = [
                  parseFloat(canvas.style.width) / canvas.width,
                  0,
                  0,
                  parseFloat(canvas.style.height) / canvas.height,
                  0,
                  0,
                ];
              }
              // Apply the transform to the export map context
              CanvasRenderingContext2D.prototype.setTransform.apply(
                  mapContext,
                  matrix
              );
              const backgroundColor = canvas.parentNode.style.backgroundColor;
              if (backgroundColor) {
                mapContext.fillStyle = backgroundColor;
                mapContext.fillRect(0, 0, canvas.width, canvas.height);
              }
              mapContext.drawImage(canvas, 0, 0);
            }
          }
      );
      mapContext.globalAlpha = 1;
      mapContext.setTransform(1, 0, 0, 1, 0, 0);
      const link : any = document.getElementById('image-download');
      link.href = mapCanvas.toDataURL();
      link.click();
    });
    this.mapComponent?.renderSync();
  }
}
