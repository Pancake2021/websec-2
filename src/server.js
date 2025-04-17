const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 8080;

// Настройка CORS
const corsOptions = {
    origin: "http://localhost:3000", // Разрешаем любой домен
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, 
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); // Глобальная настройка CORS

// Middleware для логирования запросов (для отладки)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Маршрут для получения списка станций
app.get("/api/stations", async (req, res) => {
    try {
        const requestUrl = new URLSearchParams(req.query);
        const apiKey = "b3d4921d-a1a2-4bc6-9bdd-0a129cae93d1"; // Замените на реальный API ключ Yandex
        requestUrl.append("apikey", apiKey);

        const response = await fetch(`https://api.rasp.yandex.net/v3.0/stations_list/?${requestUrl.toString()}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка при запросе к Yandex API: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Ошибка запроса к API:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Маршрут для получения расписания
app.get("/api/schedule", async (req, res) => {
    try {
        const requestUrl = new URLSearchParams(req.query);
        const apiKey = "b3d4921d-a1a2-4bc6-9bdd-0a129cae93d1"; // Замените на реальный API ключ Yandex
        requestUrl.append("apikey", apiKey);

        const response = await fetch(`https://api.rasp.yandex.net/v3.0/schedule/?${requestUrl.toString()}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка при запросе к Yandex API: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Ошибка запроса к API:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Маршрут для поиска маршрутов
app.get("/api/search", async (req, res) => {
    try {
        const requestUrl = new URLSearchParams(req.query);
        const apiKey = "b3d4921d-a1a2-4bc6-9bdd-0a129cae93d1"; // Замените на реальный API ключ Yandex
        requestUrl.append("apikey", apiKey);

        const response = await fetch(`https://api.rasp.yandex.net/v3.0/search/?${requestUrl.toString()}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка при запросе к Yandex API: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Ошибка запроса к API:", error.message);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер работает по адресу: http://localhost:${PORT}`);
});