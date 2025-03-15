<script setup>
import { onMounted } from 'vue';
import { initMap, setDefaultMarker } from '@/helper/mapHelper';

onMounted(() => {
    initMap();
    setDefaultMarker();
})
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