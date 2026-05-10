const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const message = document.getElementById("message");
const weatherIcon = document.getElementById("weatherIcon");


const API_KEY = "f0533fbfe521bd0c956b9db23ac5d19a";

async function requestWeather(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Проблема с интернетом. Проверь подключение и попробуй снова.");
  }

  if (!response.ok) {
    let apiErrorMessage = "";
    try {
      const errorData = await response.json();
      apiErrorMessage = errorData?.message || "";
    } catch {
      apiErrorMessage = "";
    }

    if (response.status === 401) {
      throw new Error("Неверный API ключ или ключ еще не активирован.");
    }
    if (response.status === 429) {
      throw new Error("Превышен лимит запросов. Попробуй немного позже.");
    }
    if (response.status === 404) {
      throw new Error("Город не найден. Проверь название.");
    }
    if (response.status >= 500) {
      throw new Error("Сервер погоды временно недоступен. Попробуй позже.");
    }
    throw new Error(
      `Ошибка запроса (${response.status}). ${apiErrorMessage || "Попробуй позже."}`
    );
  }

  return response.json();
}

async function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=ru`;
  return requestWeather(url);
}

async function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
  return requestWeather(url);
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    });
  });
}

function renderWeather(data) {
  const iconCode = data.weather?.[0]?.icon || "01d";
  const iconDescription = data.weather?.[0]?.description || "Погода";

  cityName.textContent = `Город: ${data.name}`;
  temperature.textContent = `Температура: ${Math.round(data.main.temp)} °C`;
  description.textContent = `Описание: ${iconDescription}`;
  humidity.textContent = `Влажность: ${data.main.humidity} %`;
  wind.textContent = `Ветер: ${data.wind.speed} м/с`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  weatherIcon.alt = iconDescription;
}

async function loadWeatherForCurrentLocation() {
  if (!("geolocation" in navigator)) {
    message.textContent = "Геолокация не поддерживается в этом браузере.";
    return;
  }

  message.textContent = "Определяю вашу локацию...";

  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const data = await getWeatherByCoords(latitude, longitude);
    cityInput.value = data.name;
    renderWeather(data);
    message.textContent = "";
  } catch (error) {
    if (error?.code === 1) {
      message.textContent = "Доступ к геолокации запрещен. Введите город вручную.";
      return;
    }
    if (error?.code === 2) {
      message.textContent = "Не удалось определить местоположение. Введите город вручную.";
      return;
    }
    if (error?.code === 3) {
      message.textContent = "Истекло время ожидания геолокации. Введите город вручную.";
      return;
    }
    message.textContent = error.message;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    message.textContent = "Пожалуйста, введите название города.";
    return;
  }

  if (API_KEY === "key") {
    message.textContent = "Сначала добавь API ключ в script.js.";
    return;
  }

  message.textContent = "Загружаю погоду...";

  try {
    const data = await getWeather(city);
    renderWeather(data);
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message;
  }
});

loadWeatherForCurrentLocation();