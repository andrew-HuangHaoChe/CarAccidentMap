const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises; // 使用 Promise 風格的 fs 模組
const gpmfExtract = require('gpmf-extract');
const goproTelemetry = require('gopro-telemetry');

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
        // 步驟 1: 從 GoPro 影片提取 GPMF 資料
        const rawGpmf = await fs.readFile(filePath);
        const extracted = await gpmfExtract(rawGpmf);

        // 步驟 2: 使用 gopro-telemetry 解析 GPMF 資料
        const telemetryData = await goproTelemetry(extracted, { repeatSticky: true });

        // 傳回解析後的 JSON 資料
        res.json(telemetryData);
    } catch (err) {
        console.error("Error processing telemetry data:", err);
        res.status(500).send({ error: "Failed to extract telemetry data", details: err.message });
    } finally {
        // 刪除上傳的檔案以節省空間
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
