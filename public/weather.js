const form = document.querySelector('#weather-form');
const input = document.querySelector('#location-input');
const status = document.querySelector('#status');
const content = document.querySelector('#weather-content');
const useLocation = document.querySelector('#use-location');

const weatherCodes = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Foggy', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Heavy showers', '⛈️'], 95: ['Thunderstorm', '⛈️'], 96: ['Storm with hail', '⛈️'], 99: ['Storm with hail', '⛈️']
};

function setStatus(message, isError = false) {
  status.textContent = message;
  status.className = `status${isError ? ' error' : ''}`;
}

function getWeather(code) {
  return weatherCodes[code] || ['Unknown conditions', '🌡️'];
}

function formatDay(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
}

function render(data, place) {
  const current = data.current;
  const [condition, icon] = getWeather(current.weather_code);
  document.querySelector('#place').textContent = `${place.name}, ${place.country}`;
  document.querySelector('#local-time').textContent = `Local time · ${current.time.replace('T', ' ')}`;
  document.querySelector('#condition').textContent = condition;
  document.querySelector('#weather-icon').textContent = icon;
  document.querySelector('#temperature').textContent = `${Math.round(current.temperature_2m)}°`;
  document.querySelector('#details').innerHTML = [
    ['Feels like', `${Math.round(current.apparent_temperature)}°`],
    ['Humidity', `${current.relative_humidity_2m}%`],
    ['Wind', `${Math.round(current.wind_speed_10m)} km/h`],
    ['Precipitation', `${current.precipitation} mm`]
  ].map(([label, value]) => `<div class="detail"><span>${label}</span><strong>${value}</strong></div>`).join('');
  document.querySelector('#forecast').innerHTML = data.daily.time.map((date, index) => {
    const [dayCondition, dayIcon] = getWeather(data.daily.weather_code[index]);
    return `<article class="forecast-day"><strong>${index === 0 ? 'Today' : formatDay(date)}</strong><span class="forecast-icon">${dayIcon}</span><span class="forecast-condition">${dayCondition}</span><span><b>${Math.round(data.daily.temperature_2m_max[index])}°</b> <i>${Math.round(data.daily.temperature_2m_min[index])}°</i></span></article>`;
  }).join('');
  content.hidden = false;
}

async function loadWeather(latitude, longitude, place) {
  setStatus('Loading forecast…');
  try {
    const params = new URLSearchParams({ latitude, longitude, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '5' });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error('Weather service unavailable');
    render(await response.json(), place);
    setStatus('Updated just now');
  } catch (error) {
    setStatus(error.message || 'Could not load weather.', true);
  }
}

async function searchLocation(location) {
  setStatus('Finding location…');
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
    if (!response.ok) throw new Error('Location search failed');
    const result = await response.json();
    if (!result.results?.length) throw new Error('No matching location found.');
    const place = result.results[0];
    await loadWeather(place.latitude, place.longitude, place);
  } catch (error) {
    setStatus(error.message || 'Could not find that location.', true);
    content.hidden = true;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const location = input.value.trim();
  if (location) searchLocation(location);
});

useLocation.addEventListener('click', () => {
  if (!navigator.geolocation) return setStatus('Location services are not supported by this browser.', true);
  setStatus('Requesting your location…');
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    await loadWeather(coords.latitude, coords.longitude, { name: 'Your location', country: '' });
  }, () => setStatus('Location permission was unavailable. Search for a city instead.', true));
});

searchLocation(input.value);
