<script setup>
import { onMounted, watch } from 'vue';
import { initMap, setDefaultMarker, updateMapWithTelemetryData } from '@/helper/mapHelper';
const props = defineProps(['telemetryData']);
onMounted(() => {
    initMap();
    setDefaultMarker();
});
// 監聽 telemetryData 變化，更新地圖
watch(() => props.telemetryData, (newData) => {
    if (newData) {
        updateMapWithTelemetryData(newData);
    }
}, { deep: true }); // 🔹 deep: true，確保內部數據變更時仍可觸發
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