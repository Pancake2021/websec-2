class BaseApi {
    #basePath = 'http://localhost:8080/api/';
    #apiKey = 'b3d4921d-a1a2-4bc6-9bdd-0a129cae93d1';

    constructor(basePath) {
        if (basePath) this.#basePath = basePath;
    }

    sendRequest(method, url, data) {
        const requestBody = {
            method: method,
            credentials: 'include',
        };

        // Убираем заголовок Content-Type для GET-запросов
        if (method !== 'GET' && method !== 'DELETE') {
            requestBody.headers = { "Content-Type": "application/json" };
        }

        const fullUrl = new URL(this.#basePath + url);

        // Добавляем API-ключ и параметры
        if (this.#apiKey) {
            fullUrl.searchParams.append('apikey', this.#apiKey);
        }
        if (data) {
            Object.keys(data).forEach(key => {
                fullUrl.searchParams.append(key, data[key]);
            });
        }

        console.log('Fetching URL:', fullUrl.toString());

        return fetch(fullUrl, requestBody)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
                    });
                }
                return response.json(); // Автоматически парсим JSON
            })
            .catch(error => {
                console.error('Request failed:', error);
                throw error;
            });
    }
}

export class StationApi extends BaseApi {
    getAllStations() {
        return this.sendRequest('GET', "stations", { format: 'json', lang: "ru_RU" });
    }

    getSchedule(station) {
        return this.sendRequest('GET', "schedule", { 
            station: station,
            format: 'json',
            lang: "ru_RU"
        });
    }

    between2Sations(from, to) {
        return this.sendRequest('GET', "search", { 
            from: from,
            to: to,
            format: 'json',
            lang: "ru_RU",
            transport_types: "train"
        });
    }
}