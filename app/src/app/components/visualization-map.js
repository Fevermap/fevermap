/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import L from 'leaflet';
import HeatmapOverlay from 'leaflet-heatmap';
import GeolocatorService from '../services/geolocator-service.js';
// From https://geojson-maps.ash.ms/
import countryGeoJson from '../../assets/countrydata/country-geojson.json';
import DataEntryService from '../services/data-entry-service.js';

export default class VisualizationMap extends LitElement {
  static get properties() {
    return {
      loading: { type: Boolean },
      geoJson: { type: Object },
      map: { type: Object },

      stats: { type: Object },
      dataMappedByCountry: { type: Object },
      dataMappedByCoordinates: { type: Object },
    };
  }

  constructor() {
    super();
    this.loading = true;
    this.geoJson = null;
    this.map = null;
    this.stats = null;
  }

  firstUpdated() {
    this.getStats();
    // Make sure page has loaded before initiating the map.
    // Openstreetmap rendering goes haywire if it's not on screen when it's loaded
    setTimeout(() => {
      this.loading = false;
      this.initMap();
    }, 1500);
  }

  async getStats() {
    this.stats = await DataEntryService.getStats();
    this.dataMappedByCountry = this.getDataByCountry();
    this.dataMappedByCoordinates = this.getDataMappedByCoordinates();
  }

  async initMap() {
    let coords = await GeolocatorService.getCoords().catch(() => null);
    if (coords == null) {
      coords = { latitude: 0, longitude: 0 };
    }
    this.map = L.map('visualization-map', {
      center: new L.LatLng(coords.latitude, coords.longitude),
      zoom: 4,
    });
    const mainMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    });
    mainMapLayer.addTo(this.map);

    const heatMapLayer = this.createHeatmapLayer();

    heatMapLayer.addTo(this.map);

    const countryBasedInfoMap = L.geoJSON(countryGeoJson, {
      style: feature => this.getCountryBasedMapStyle(feature),
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
    });
    this.geoJson = countryBasedInfoMap;

    const coordinatesMappedAsCircles = L.layerGroup();

    this.dataMappedByCoordinates.forEach(coord => {
      console.log(coord);
      L.circle([coord.lat, coord.lng], {
        color: 'red',
        fillColor: '#f03',
        fillopacity: 0.5,
        radius: 500 * (coord.count / 50),
      })
        .bindPopup(`${coord.lat},${coord.lng}`)
        .addTo(coordinatesMappedAsCircles);
    });

    const layers = {
      Heatmap: heatMapLayer,
      'Country based data': countryBasedInfoMap,
      Testing: coordinatesMappedAsCircles,
    };
    const overlayMaps = {
      'Geographical map': mainMapLayer,
    };
    L.control.layers(layers, overlayMaps, { collapsed: false }).addTo(this.map);
  }

  createHeatmapLayer() {
    const { stats } = this;
    const entriesByCoordinates = [];
    stats.data.submissions.all.forEach(entry => {
      const locationObject = { lat: entry.location_lat, lng: entry.location_lng };
      let entriesInLocation = entriesByCoordinates.find(
        entryList => entryList.coordString === `${locationObject.lat},${locationObject.lng}`,
      );
      if (!entriesInLocation) {
        entriesInLocation = {
          coordString: `${locationObject.lat},${locationObject.lng}`,
          lat: locationObject.lat,
          lng: locationObject.lng,
          count: 0,
          entries: [],
        };
        entriesByCoordinates.push(entriesInLocation);
      }
      entriesInLocation.count += 1;
      entriesInLocation.entries.push(entry);
    });

    const mapData = {
      max: Math.max(...entriesByCoordinates.map(entry => entry.count)),
      data: entriesByCoordinates,
    };
    const cfg = {
      radius: 1,
      maxOpacity: 0.8,
      scaleRadius: true,
      useLocalExtrema: true,
      latField: 'lat',
      lngField: 'lng',
      valueField: 'count',
    };

    const heatmapLayer = new HeatmapOverlay(cfg);
    heatmapLayer.setData(mapData);
    return heatmapLayer;
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

  getCountryBasedMapStyle(feature) {
    const countryCode = feature.properties.iso_a2;
    const { dataMappedByCountry } = this;
    const countryData = dataMappedByCountry.find(cData => cData.countryCode === countryCode);
    if (countryData) {
      feature.properties.density = countryData.entries.length;
    }
    return {
      fillColor: VisualizationMap.getColor(feature.properties.density),
      weight: 2,
      opacity: 1,
      color: '#FFFFFF',
      dashArray: '3',
      fillOpacity: 0.5,
    };
  }

  getDataByCountry() {
    const dataMappedByCountry = [];
    const addedCountryCodes = []; // For faster lookup
    this.stats.data.submissions.all.forEach(entry => {
      if (!addedCountryCodes.includes(entry.location_country_code)) {
        addedCountryCodes.push(entry.location_country_code);
        dataMappedByCountry.push({ countryCode: entry.location_country_code, entries: [] });
      }
      const countryData = dataMappedByCountry.find(
        cData => cData.countryCode === entry.location_country_code,
      );
      countryData.entries.push(entry);
    });
    console.log(dataMappedByCountry);
    return dataMappedByCountry;
  }

  getDataMappedByCoordinates() {
    const { stats } = this;
    const entriesByCoordinates = [];
    stats.data.submissions.all.forEach(entry => {
      const locationObject = { lat: entry.location_lat, lng: entry.location_lng };
      let entriesInLocation = entriesByCoordinates.find(
        entryList => entryList.coordString === `${locationObject.lat},${locationObject.lng}`,
      );
      if (!entriesInLocation) {
        entriesInLocation = {
          coordString: `${locationObject.lat},${locationObject.lng}`,
          lat: locationObject.lat,
          lng: locationObject.lng,
          count: 0,
          entries: [],
        };
        entriesByCoordinates.push(entriesInLocation);
      }
      entriesInLocation.count += 1;
      entriesInLocation.entries.push(entry);
    });
    console.log(entriesByCoordinates);
    return entriesByCoordinates;
  }

  highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
      weight: 5,
      dashArray: '3',
      color: '#FFFFFF',
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
    console.log(e.target);
    const countryCode = e.target.feature.properties.iso_a2;
    const countryName = e.target.feature.properties.name;
    console.log(`Submission count: ${e.target.feature.properties.density}`);
    const CountryInfo = L.Control.extend({
      options: {
        position: 'bottomleft',
      },
      onAdd() {
        return L.DomUtil.create('div', 'country-info-container');
      },

      onRemove() {},
      setContent(countryData) {
        this.getContainer().innerHTML = `
          <p>${countryData.name}</p>
          <p>Submissions: ${countryData.count}</p>
        `;
      },
    });

    if (!this.countryInfoBox) {
      this.countryInfoBox = new CountryInfo();
      this.countryInfoBox.addTo(this.map);
    }
    const submissionsInCountry = this.getSubmissionsInCountry(countryCode);
    this.countryInfoBox.setContent({
      name: countryName,
      count: submissionsInCountry ? submissionsInCountry.entries.length : 0,
    });
  }

  getSubmissionsInCountry(countryCode) {
    return this.dataMappedByCountry.find(cData => cData.countryCode === countryCode);
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
