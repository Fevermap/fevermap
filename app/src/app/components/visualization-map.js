/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import L from 'leaflet';
import GeolocatorService from '../services/geolocator-service.js';
// From https://github.com/johan/world.geo.json/blob/master/countries.geo.json?short_path=afdfc39
import countryGeoJson from '../../assets/countrydata/country-geojson.json';

export default class VisualizationMap extends LitElement {
  static get properties() {
    return {
      loading: { type: Boolean },
      geoJson: { type: Object },
      map: { type: Object },
    };
  }

  constructor() {
    super();
    this.loading = true;
    this.geoJson = null;
    this.map = null;
  }

  firstUpdated() {
    // Make sure page has loaded before initiating the map.
    // Openstreetmap rendering goes haywire if it's not on screen when it's loaded
    setTimeout(() => {
      this.loading = false;
      this.initMap();
    }, 1500);
  }

  async initMap() {
    let coords = await GeolocatorService.getCoords().catch(() => null);
    if (coords == null) {
      coords = { latitude: 0, longitude: 0 };
    }
    this.map = L.map('visualization-map').setView([coords.latitude, coords.longitude], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(this.map);
    this.geoJson = L.geoJSON(countryGeoJson, {
      style: this.getMapStyle,
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
    }).addTo(this.map);
  }

  static getColor(d) {
    if (d > 1000) return '#800026';
    if (d > 500) return '#BD0026';
    if (d > 200) return '#E31A1C';
    if (d > 100) return '#FC4E2A';
    if (d > 50) return '#FD8D3C';
    if (d > 20) return '#FEB24C';
    if (d > 10) return '#FED976';
    if (d > 0) return '#FFEDA0';
    return '#c8c8ce';
  }

  getMapStyle(feature) {
    return {
      fillColor: VisualizationMap.getColor(feature.properties.density),
      weight: 2,
      opacity: 1,
      color: '#FFFFFF',
      dashArray: '3',
      fillOpacity: 0.5,
    };
  }

  highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.3,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }

  resetHighLight(e) {
    this.geoJson.resetStyle(e.target);
  }

  zoomToFeature(e) {
    this.map.fitBounds(e.target.getBounds());
  }

  onEachFeature(feature, layer) {
    layer.on({
      mouseover: e => this.highlightFeature(e),
      mouseout: e => this.resetHighLight(e),
      click: e => this.zoomToFeature(e),
    });
  }

  render() {
    return html`
      <div class="map ${this.loading ? ' map--loading' : ''}" id="visualization-map"></div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

if (!customElements.get('visualization-map')) {
  customElements.define('visualization-map', VisualizationMap);
}
