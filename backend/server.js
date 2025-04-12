const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises; // 使用 Promise 風格的 fs 模組
const gpmfExtract = require('gpmf-extract');
const goproTelemetry = require('gopro-telemetry');
const { type } = require('os');

const app = express();
const port = 3000;

app.use(cors());

// 設定 multer 來處理上傳的檔案
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // 檔案儲存目錄
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // 使用原始檔名
    },
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    try {
        // 讀取 GoPro 影片
        const rawGpmf = await fs.readFile(filePath);
        const extracted = await gpmfExtract(rawGpmf);

        // 解析 GPMF 資料
        const telemetryData = await goproTelemetry(extracted, { repeatSticky: true });

        // 嘗試找到 GPS5 數據
        let gpsStream;
        for (const key in telemetryData) {
            if (telemetryData[key]?.streams?.GPS5) {
                gpsStream = telemetryData[key].streams.GPS5;
                break;
            }
        }

        if (!gpsStream || !gpsStream.samples || gpsStream.samples.length === 0) {
            throw new Error("沒有 GPS 資料在影片當中，請重新上傳!");
        }

        // 轉換為 GeoJSON 格式
        const routeLineGeoJSON = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: gpsStream.samples.map(sample => [
                            sample.value[1], // longitude
                            sample.value[0]  // latitude
                        ])
                    },
                    properties: {
                        source: "GoPro",
                    }
                }
            ]
        };

        const routeSegmentsGeoJSON = {
            type: "FeatureCollection",
            features: gpsStream.samples.slice(0, -1).map((sample, index) => {
                const nextSample = gpsStream.samples[index + 1];
        
                return {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [sample.value[1], sample.value[0]], // 當前點
                            [nextSample.value[1], nextSample.value[0]] // 下一個點
                        ]
                    },
                    properties: {
                        startTime: sample.date || sample.cts || null,
                        endTime: nextSample.date || nextSample.cts || null,
                        source: "GoPro"
                    }
                };
            })
        };
        const videoStartTime = gpsStream.samples[0]?.cts || gpsStream.samples[0]?.date || 0; // 影片開始時間 (毫秒)
        const routePointsGeoJSON = {
            type: "FeatureCollection",
            features: gpsStream.samples.map(sample => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [sample.value[1], sample.value[0]]
                },
                properties: {
                    timestamp: (sample.cts - videoStartTime) / 1000  // 轉換為秒數
                }
            }))
        };

        // 傳回 JSON
        res.json({
            routeLineGeoJSON,
            routePointsGeoJSON,
            routeSegmentsGeoJSON,
            originData: telemetryData,
        });
    } catch (err) {
        console.error("Error processing telemetry data:", err);
        res.status(500).send({ error: "Failed to extract telemetry data", details: err.message });
    } finally {
        // 刪除上傳的檔案
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
