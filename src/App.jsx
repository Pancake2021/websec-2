import { useEffect, useState, useMemo } from "react";
import { StationApi } from "./API/OpenApi";
import "./App.css";

const App = () => {
    const [railwayStations, setRailwayStations] = useState([]);
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [activeStation, setActiveStation] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [departureStation, setDepartureStation] = useState("");
    const [arrivalStation, setArrivalStation] = useState("");
    const [routeInfo, setRouteInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mapCoordinates, setMapCoordinates] = useState(null);
    const [closestStation, setClosestStation] = useState(null);
    const [savedStations, setSavedStations] = useState(() => {
        const stored = localStorage.getItem('savedStations');
        return stored ? JSON.parse(stored) : [];
    });

    const apiClient = useMemo(() => new StationApi(), []);

    const loadStations = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getAllStations();
            if (response?.countries) {
                const samaraStations = response.countries
                    .find(c => c.title === 'Россия')?.regions
                    .flatMap(region => region.settlements)
                    .flatMap(settlement => settlement.stations)
                    .filter(station =>
                        station.transport_type === "train" &&
                        station.codes.esr_code &&
                        station.codes.esr_code.startsWith('63')
                    );
                setRailwayStations(samaraStations || []);
            }
        } catch (error) {
            console.error("Ошибка при загрузке станций:", error);
            setRailwayStations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const displayStationSchedule = (stationCode) => {
        if (!stationCode) return;
        apiClient.getSchedule(stationCode)
            .then(data => {
                setCurrentSchedule(data);
                setActiveStation(stationCode);
            })
            .catch(error => {
                console.error("Ошибка при получении расписания:", error);
                setCurrentSchedule({ error: "Не удалось загрузить расписание" });
            });
    };

    const findRoute = () => {
        const fromCode = findStationCode(departureStation);
        const toCode = findStationCode(arrivalStation);

        if (!fromCode || !toCode) {
            setRouteInfo({ error: "Станция не найдена" });
            return;
        }

        apiClient.between2Sations(fromCode, toCode)
            .then(data => {
                setRouteInfo(data || { segments: [] });
            })
            .catch(error => {
                console.error("Ошибка при поиске маршрута:", error);
                setRouteInfo({ error: "Не удалось найти маршруты" });
            });
    };

    const findStationCode = (title) => {
        if (!title) return null;
        const station = railwayStations.find(s =>
            s.title.toLowerCase().includes(title.toLowerCase())
        );
        return station ? station.codes.yandex_code : null;
    };

    const updatePage = (direction) => {
        const totalPages = Math.ceil((railwayStations.length || 1) / 10);
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const filterStations = (list) => {
        if (!searchQuery.trim()) return list;
        return list.filter(station =>
            station.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const findClosestStation = (coordinates) => {
        if (!coordinates || !railwayStations) return null;

        let closest = null;
        let minDistance = Infinity;

        railwayStations.forEach(station => {
            if (station.latitude && station.longitude) {
                const distance = Math.sqrt(
                    Math.pow(coordinates[0] - station.latitude, 2) +
                    Math.pow(coordinates[1] - station.longitude, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closest = station;
                }
            }
        });

        return closest;
    };

    const handleMapInteraction = (coordinates) => {
        setMapCoordinates(coordinates);
        const nearest = findClosestStation(coordinates);
        setClosestStation(nearest);
    };

    const toggleSavedStation = (station) => {
        setSavedStations(prev => {
            const isSaved = prev.some(s => s.codes.yandex_code === station.codes.yandex_code);
            let updatedStations;
            
            if (isSaved) {
                updatedStations = prev.filter(s => s.codes.yandex_code !== station.codes.yandex_code);
            } else {
                updatedStations = [...prev, station];
            }
            
            localStorage.setItem('savedStations', JSON.stringify(updatedStations));
            return updatedStations;
        });
    };

    const isStationSaved = (station) => {
        return savedStations.some(s => s.codes.yandex_code === station.codes.yandex_code);
    };

    useEffect(() => {
        loadStations();
    }, []);

    useEffect(() => {
        if (railwayStations.length >= 2) {
            setDepartureStation(railwayStations[0]?.title || "");
            setArrivalStation(railwayStations[1]?.title || "");
        }
    }, [railwayStations]);

    useEffect(() => {
        const initMap = () => {
            if (window.ymaps && !window.mapInstance) {
                window.ymaps.ready(() => {
                    if (!window.mapInstance) {
                        window.mapInstance = new window.ymaps.Map("map", {
                            center: [53.2044, 50.1849],
                            zoom: 8,
                        });

                        window.mapInstance.events.add("click", (e) => {
                            const coords = e.get("coords");
                            handleMapInteraction(coords);
                        });

                        if (railwayStations) {
                            railwayStations.forEach(station => {
                                if (station.latitude && station.longitude) {
                                    const placemark = new window.ymaps.Placemark(
                                        [station.latitude, station.longitude],
                                        {
                                            balloonContent: station.title
                                        }
                                    );
                                    window.mapInstance.geoObjects.add(placemark);
                                }
                            });
                        }
                    }
                });
            }
        };

        if (window.ymaps) {
            initMap();
        } else {
            const script = document.createElement('script');
            script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ваш_ключ_яндекс_карт&lang=ru_RU';
            script.async = true;
            script.onload = initMap;
            document.head.appendChild(script);
        }

        return () => {
            if (window.mapInstance) {
                window.mapInstance.destroy();
                window.mapInstance = null;
            }
        };
    }, [railwayStations]);

    return (
        <div className="main-body">
            <h2 className="main-title">Расписание электричек Самарской области</h2>
            
            {savedStations.length > 0 && (
                <div className="favorites-container">
                    <h3>Избранные станции:</h3>
                    <div className="favorites-list">
                        {savedStations.map(station => (
                            <div key={station.codes.yandex_code} className="favorite-station">
                                <span>{station.title}</span>
                                <div className="favorite-actions">
                                    <button onClick={() => displayStationSchedule(station.codes.yandex_code)}>
                                        Расписание
                                    </button>
                                    <button onClick={() => toggleSavedStation(station)}>
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3>Выберите точку на карте:</h3>
                <div id="map" style={{ width: "100%", height: "400px" }}></div>
            </div>

            {closestStation && (
                <div className="nearest-station-info">
                    <h4>Ближайшая станция:</h4>
                    <p>{closestStation.title}</p>
                    <p>Код: {closestStation.codes.yandex_code}</p>
                </div>
            )}

            <div className="search-container">
                <div className="search-list-container">
                    {isLoading ? (
                        <p>Загрузка...</p>
                    ) : railwayStations.length === 0 ? (
                        <p>Нет доступных станций</p>
                    ) : (
                        <>
                            <div className="search">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    placeholder="Поиск станции"
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="pagination">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => updatePage(-1)}
                                >
                                    {"<"}
                                </button>
                                <p>{currentPage} из {Math.ceil(railwayStations.length / 10)}</p>
                                <button
                                    disabled={currentPage === Math.ceil(railwayStations.length / 10)}
                                    onClick={() => updatePage(1)}
                                >
                                    {">"}
                                </button>
                            </div>
                            <div className="stations-container">
                                {filterStations(railwayStations)
                                    .slice(10 * (currentPage - 1), 10 * currentPage)
                                    .map((station, index) => (
                                        <div key={index} className="station-item">
                                            <div className="station-info">
                                                <span>{station.title}</span>
                                                <button 
                                                    className={`favorite-button ${isStationSaved(station) ? 'active' : ''}`}
                                                    onClick={() => toggleSavedStation(station)}
                                                >
                                                    {isStationSaved(station) ? '★' : '☆'}
                                                </button>
                                            </div>
                                            <button
                                                className="show-info-button"
                                                onClick={() => displayStationSchedule(station.codes.yandex_code)}
                                            >
                                                ➡️
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="station-info-container">
                    <h4>Расписание для:
                        {activeStation &&
                            railwayStations.find(s => s.codes.yandex_code === activeStation)?.title}
                    </h4>
                    {currentSchedule?.error && <p className="error">{currentSchedule.error}</p>}
                    {currentSchedule?.schedule?.length > 0 ? (
                        currentSchedule.schedule.map((item, index) => (
                            <div key={index} className="station-info-item">
                                <div>{item.days}</div>
                                <div>Поезд №{item.thread.number}</div>
                                <div>{item.thread.short_title}</div>
                            </div>
                        ))
                    ) : (
                        <p>Нет данных о расписании</p>
                    )}
                </div>
            </div>

            <div className="find-way-container">
                <h4>Маршруты между станциями</h4>
                <div className="between-stations">
                    {railwayStations.length > 0 && (
                        <div className="between-stations-input">
                            <label htmlFor="from">Откуда:</label>
                            <input
                                type="text"
                                id="from"
                                placeholder="Введите название станции"
                                value={departureStation}
                                onChange={(e) => setDepartureStation(e.target.value)}
                            />
                            <label htmlFor="to">Куда:</label>
                            <input
                                type="text"
                                id="to"
                                placeholder="Введите название станции"
                                value={arrivalStation}
                                onChange={(e) => setArrivalStation(e.target.value)}
                            />
                            <button onClick={findRoute}>Поиск</button>
                        </div>
                    )}
                    <div className="between-stations-result">
                        {routeInfo?.error && <p className="error">{routeInfo.error}</p>}
                        {routeInfo?.segments?.length > 0 ? (
                            routeInfo.segments.map((seg, i) => (
                                <div key={i} className="between-result-item">
                                    <div>{seg.days}</div>
                                    <div>Поезд №{seg.thread.number}</div>
                                    <div>{seg.thread.short_title}</div>
                                    <div>Время: {Math.round(seg.duration / 60)} мин</div>
                                </div>
                            ))
                        ) : (
                            !routeInfo?.error && <p>Маршруты не найдены</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;