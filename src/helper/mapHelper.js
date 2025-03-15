import maplibregl from 'maplibre-gl';
const _defaultPosition = [121.4874339, 24.9963882];
let _map = null;

export function initMap() {
    _map = new maplibregl.Map({
        container: 'map',
        center: _defaultPosition,
        style: {
            version: 8,
            sources: {
                osm: {
                    type: 'raster',
                    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors',
                },
            },
            layers: [
                {
                    id: 'osm-layer',
                    type: 'raster',
                    source: 'osm',
                },
            ],
        },
        zoom: 7,
    });
}

export function setDefaultMarker() {
    const marker = new maplibregl.Marker().setLngLat(_defaultPosition).addTo(_map);
}
