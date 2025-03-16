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
        <Map />
        <input type="file" @change="handleFileChange" accept=".mp4" />
        <button @click="uploadFile">上傳檔案</button>
    </main>
</template>
