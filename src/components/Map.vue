<script setup>
import { onMounted, watch } from 'vue';
import { initMap, setDefaultMarker, updateMapWithPoints, updateMapWithLine, updatePopupVideo } from '@/helper/mapHelper';
const props = defineProps({
    telemetryData: Object,
    videoUrl: {
        type: String,
        default: '',
    },
});
onMounted(() => {
    initMap();
    setDefaultMarker();
});
// 監聽 telemetryData 變化，更新地圖
watch(() => props.telemetryData, (newData) => {
    if (newData) {
        updateMapWithPoints(newData.routePointsGeoJSON);
        updateMapWithLine(newData.routeLineGeoJSON);
    }
}, { deep: true }); // 🔹 deep: true，確保內部數據變更時仍可觸發

// 監聽 `videoUrl`，當使用者上傳影片後，更新 `Popup`
watch(() => props.videoUrl, (newUrl, oldUrl) => {
    if (newUrl !== '') {
        updatePopupVideo(newUrl);
    }
});
</script>
<template>
    <div>
        <div id="map"></div>
    </div>
</template>

<style>
#map {
    height: 100vh;
    width: 100vw;
}
</style>