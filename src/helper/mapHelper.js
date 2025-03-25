import maplibregl from 'maplibre-gl';
const _defaultPosition = [121.4874339, 24.9963882];
const routeMarkerUrl = new URL('../../src/assets/route-marker.png', import.meta.url).href;
let _map = null;
let _videoData = null;

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
    _map.on('load', async () => {
        const image = await _map.loadImage('https://maplibre.org/maplibre-gl-js/docs/assets/custom_marker.png');
        _map.addImage('custom-marker', image.data);
        initPointLayer();
    });
}

export function setDefaultMarker() {
    const marker = new maplibregl.Marker().setLngLat(_defaultPosition).addTo(_map);
}

export function updateMapWithTelemetryData(videoData) {
    _videoData = videoData;
    console.log(_map);
    console.log('影片資料: ', videoData);
    if (_map.getSource('drive-points')) {
        _map.getSource('drive-points').setData(formatVideoData(videoData));
    } else {
        // 先新增 source
        _map.addSource('drive-points', {
            type: 'geojson',
            data: formatVideoData(videoData),
        });

        // 再加入 layer
        _map.addLayer({
            id: 'drive-points-layer',
            type: 'symbol',
            source: 'drive-points',
            layout: {
                'icon-image': 'custom-marker'
            }
        });
    }
}

function initPointLayer() {
    if (_videoData) {
        updateMapWithTelemetryData(_videoData); // 如果已經有資料，直接加載
    }
}

function initRouteLayer() {

}

function formatVideoData(videoData) {
    console.log(videoData.routePointsGeoJSON.features);

    return {
        type: 'FeatureCollection',
        features: videoData.routePointsGeoJSON.features.map((video) => ({
            type: 'Feature',
            properties: {
                year: video.properties.timestamp || '', // 確保有 'year' 屬性
            },
            geometry: {
                type: 'Point',
                coordinates: [video.geometry.coordinates[0], video.geometry.coordinates[1]],
            },
        })),
    };
}