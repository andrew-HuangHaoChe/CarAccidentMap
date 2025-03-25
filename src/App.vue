<script setup>
import { ref } from 'vue';
import Map from './components/Map.vue';
import axios from 'axios';

const file = ref(null);
const telemetryData = ref(null);

const handleFileChange = (event) => {
    file.value = event.target.files[0];
}

const uploadFile = async () => {
    if (!file.value) {
        return;
    }

    const formData = new FormData();
    formData.append('file', file.value);

    try {
        const response = await axios.post('http://localhost:3000/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        telemetryData.value = response.data;
    } catch (error) {
        console.error(error);
    }
};

</script>

<template>
    <main>
        <Map :telemetryData="telemetryData" />
        <div class="panel">
            <input type="file" @change="handleFileChange" accept=".mp4" />
            <button @click="uploadFile">上傳檔案</button>
        </div>
    </main>
</template>
<style>
.panel {
    width: 500px;
    height: 400px;
    background: white;
    position: absolute;
    top: 20px;
    left: 20px;
    border-radius: 20px;
    padding: 10px;
}
</style>