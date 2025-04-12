<script setup>
import { ref } from 'vue';
import Map from './components/Map.vue';
import axios from 'axios';

const file = ref(null);
const telemetryData = ref(null);
const uploadInput = ref(null);
const fileName = ref('');
const videoUrl = ref(null); // 👉 存影片 URL

const handleFileChange = (event) => {
    console.log(event);
    if (event.target.files[0]) {
        file.value = event.target.files[0];
        fileName.value = event.target.files[0].name;
        // 👉 生成本地影片 URL
        videoUrl.value = URL.createObjectURL(file.value);
    }
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
        <Map :telemetryData="telemetryData" :videoUrl="videoUrl" />
        <div class="panel">
            <div class="d-flex">
                <input ref="uploadInput" hidden type="file" @change="handleFileChange" accept=".mp4" />
                <button @click="$refs.uploadInput.click()" class="button">選擇檔案</button>
                <p class="pl-xs">{{ fileName }}</p>
            </div>
            <button @click="uploadFile" class="button">上傳檔案</button>
        </div>
    </main>
</template>
<style lang="scss">
.d-flex {
    display: flex;
}
.pl-xs {
    padding-left: 5px;
}
.panel {
    width: 500px;
    height: 400px;
    background: white;
    position: absolute;
    top: 20px;
    left: 20px;
    border-radius: 20px;
    padding: 10px;
    display: flex;
    justify-content: space-between;
}

.button {
    cursor: pointer;
    color: white;
    background-color: var(--primary);
    border-radius: 5px;
    width: 150px;
    height: 40px;
    border: none;
    font-size: 20px;
    transition: all 0.3s ease;

    &:hover {
        box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    }
}
</style>