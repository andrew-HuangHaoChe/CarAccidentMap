import maplibregl from 'maplibre-gl';
const _defaultPosition = [121.4874339, 24.9963882];
const routeMarkerUrl = new URL('../../src/assets/route-marker.png', import.meta.url).href;
let _map = null;
let _marker = null;
let _videoData = null;
let _popupContainer = null;
let _videoEl = null;
let _routePointsGeoJSON = null;
let _routeLineGeoJSON = null;
let _firstPoint = null;
let _lastPoint = null;
let _routeIndex = 0;
let _animationFrame = null;

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
        initRouteLayer();
        initPopup();
    });
}

export function setDefaultMarker() {
    const marker = new maplibregl.Marker().setLngLat(_defaultPosition).addTo(_map);
}

export function updateMapWithPoints(routePointsGeoJSON) {
    _routePointsGeoJSON = routePointsGeoJSON;
    const fortmatedPoints = formatPoints(routePointsGeoJSON); // 格式化點資料
    if (_map.getSource('drive-points')) {
        _map.getSource('drive-points').setData(fortmatedPoints);
    } else if (!_map.getSource('drive-points')) {
        // 先新增 source
        _map.addSource('drive-points', {
            type: 'geojson',
            data: fortmatedPoints,
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

export function updateMapWithLine(routeLineGeoJSON) {
    _routeLineGeoJSON = routeLineGeoJSON;
    console.log(_routeLineGeoJSON);
    _firstPoint = _routeLineGeoJSON.features[0].geometry.coordinates[0];
    _lastPoint = _routeLineGeoJSON.features[0].geometry.coordinates[_routeLineGeoJSON.features[0].geometry.coordinates.length - 1];
    const point = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'Point',
                    'coordinates': _firstPoint
                }
            }
        ]
    };
    _marker = new maplibregl.Marker().setLngLat(_firstPoint).addTo(_map);
    if (_map.getSource('drive-line')) {
        _map.getSource('drive-line').setData(routeLineGeoJSON);
    } else if (!_map.getSource('drive-line')) {
        // 先新增 source
        _map.addSource('drive-line', {
            type: 'geojson',
            data: routeLineGeoJSON,
        });

        // 再加入 layer
        _map.addLayer({
            id: 'drive-line-layer',
            type: 'line',
            source: 'drive-line',
            paint: {
                'line-width': 10,
                'line-color': '#007cbf'
            },
        });
    }
    //startAnimation();
}

function initPointLayer() {
    if (_videoData && _videoData.routePointsGeoJSON) {
        updateMapWithPoints(_videoData.routePointsGeoJSON); // 如果已經有資料，直接加載
    }
}

function initRouteLayer() {
    if (_videoData && _videoData.routeLineGeoJSON) {
        updateMapWithLine(_videoData.routeLineGeoJSON); // 如果已經有資料，直接加載
    }
}

function formatPoints(routePointsGeoJSON) {
    return {
        type: 'FeatureCollection',
        features: routePointsGeoJSON.features.map((point) => ({
            type: 'Feature',
            properties: {
                timestamp: point.properties.timestamp || '',
            },
            geometry: {
                type: 'Point',
                coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
            },
        })),
    };
}

export function initPopup() {
    _videoEl = createVideoElement();
    // 1. 建立 Popup 容器，讓它固定在畫面右上角
    _popupContainer = document.createElement('div');
    _popupContainer.style.position = 'absolute';
    _popupContainer.style.top = '10px';
    _popupContainer.style.right = '10px';
    _popupContainer.style.width = '600px';
    _popupContainer.style.height = '400px';
    _popupContainer.style.background = 'rgba(255, 255, 255, 0.9)';
    _popupContainer.style.border = '1px solid #ccc';
    _popupContainer.style.borderRadius = '8px';
    _popupContainer.style.padding = '10px';
    _popupContainer.style.zIndex = '1000';
    //_popupContainer.style.display = 'none'; // 預設隱藏
    document.body.appendChild(_popupContainer);
    _popupContainer.appendChild(_videoEl);

    // 點擊點時，顯示 Popup 並更新影片
    _map.on('click', 'drive-points-layer', (e) => {
        console.log(_videoEl, _popupContainer);

        // if (_videoEl.src) {
        //     _popupContainer.style.display = 'block';
        // }
    });

    // 點擊地圖其他地方時關閉 Popup
    _map.on('click', () => {
        //_popupContainer.style.display = 'none';
    });
}

// 新增這個函數，讓上傳後更新影片
export function updatePopupVideo(videoUrl) {
    if (_videoEl) {
        _videoEl.src = videoUrl;
    }
}

function createVideoElement() {
    _videoEl = document.createElement('video');
    _videoEl.controls = true;
    _videoEl.autoplay = false;
    _videoEl.style.width = '100%';
    _videoEl.style.height = '100%';
    _videoEl.addEventListener('timeupdate', function (item) {
        updateMarkerByVideoTime(_videoEl.currentTime);
    })
    return _videoEl;
}

export function startAnimation() {
    if (!_routeLineGeoJSON) return;

    const coordinates = _routeLineGeoJSON.features[0].geometry.coordinates;
    _routeIndex = 0;

    function animateMarker() {
        if (_routeIndex < coordinates.length) {
            _marker.setLngLat(coordinates[_routeIndex]);
            _routeIndex++;
            _animationFrame = requestAnimationFrame(animateMarker);
        } else {
            cancelAnimationFrame(_animationFrame);
        }
    }

    animateMarker();
}

export function updateMarkerByVideoTime(videoCurrentTime) {
    if (!_routePointsGeoJSON || !_routePointsGeoJSON.features) {
        return;
    };
    // 根據影片時間找到最近的 GPS 點
    let closestPoint = null;
    let minTimeDiff = Infinity;
    console.log('影片目前時間:', videoCurrentTime);
    const videoStartTime = _routePointsGeoJSON.features[0].properties.timestamp; // 取第一個 GPS 時間點作為影片起點
    _routePointsGeoJSON.features.forEach((feature) => {
        const pointTime = feature.properties.timestamp;
        if (!pointTime) {
            return;
        }
        // 把 GPS 時間轉換成 "相對影片起始的時間"
        const relativeTime = pointTime - videoStartTime;
        const timeDiff = Math.abs(videoCurrentTime - relativeTime);
        if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestPoint = feature.geometry.coordinates;
        }
    });
    console.log(minTimeDiff, closestPoint);

    // 更新標記位置
    if (closestPoint) {
        _marker.setLngLat(closestPoint);
        _map.setCenter(closestPoint); // 讓地圖視角跟隨標記
    }
}