
const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';

let currentData = null;  
let currentUnit = 'C';  

// ── Allow pressing Enter to search ──
const input = document.getElementById('cityInput');
input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') getWeather();
});

// ── Quick city shortcut buttons ──
function quickSearch(city) {
  input.value = city;
  getWeather();
}

// ── Show / hide error message ──
function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('error').style.display = 'none';
}

// ── Map weather code to emoji ──
function getWeatherEmoji(code, icon) {
  const isNight = icon && icon.includes('n');
  if (code >= 200 && code < 300) return '⛈️';   // Thunderstorm
  if (code >= 300 && code < 400) return '🌦️';   // Drizzle
  if (code >= 500 && code < 600) return '🌧️';   // Rain
  if (code >= 600 && code < 700) return '❄️';    // Snow
  if (code >= 700 && code < 800) return '🌫️';   // Mist/Fog
  if (code === 800) return isNight ? '🌙' : '☀️'; // Clear sky
  if (code === 801) return '🌤️';                 // Few clouds
  if (code >= 802)  return '☁️';                 // Cloudy
  return '🌡️';
}

// ── Temperature converters ──
function toF(c) { return Math.round(c * 9 / 5 + 32); }

// ── Format temperature with unit label ──
function formatTemp(celsius) {
  const val = currentUnit === 'C' ? Math.round(celsius) : toF(celsius);
  return `${val}<sup>°${currentUnit}</sup>`;
}

function formatTempShort(celsius) {
  const val = currentUnit === 'C' ? Math.round(celsius) : toF(celsius);
  return `${val}°${currentUnit}`;
}

// ── Format Unix timestamp → readable time ──
function formatTime(unix, timezoneOffset) {
  const date = new Date((unix + timezoneOffset) * 1000);
  let hours   = date.getUTCHours();
  let minutes = date.getUTCMinutes();
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// ── Render weather data into the DOM ──
function renderWeather() {
  if (!currentData) return;

  const d      = currentData;
  const offset = d.timezone; // seconds offset from UTC

  // City & date
  document.getElementById('cityName').textContent    = d.name;
  document.getElementById('countryName').textContent =
    `${d.sys.country} · ${new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })}`;

  // Icon & temperature
  document.getElementById('weatherIcon').textContent  = getWeatherEmoji(d.weather[0].id, d.weather[0].icon);
  document.getElementById('tempMain').innerHTML       = formatTemp(d.main.temp);
  document.getElementById('weatherDesc').textContent  = d.weather[0].description;
  document.getElementById('feelsLike').textContent    = `Feels like ${formatTempShort(d.main.feels_like)}`;

  // Stats row
  document.getElementById('humidity').textContent    = `${d.main.humidity}%`;
  document.getElementById('windSpeed').textContent   = `${Math.round(d.wind.speed * 3.6)} km/h`;
  document.getElementById('visibility').textContent  = `${(d.visibility / 1000).toFixed(1)} km`;
  document.getElementById('pressure').textContent    = `${d.main.pressure} hPa`;

  // Extra cards
  document.getElementById('tempMin').textContent    = formatTempShort(d.main.temp_min);
  document.getElementById('tempMax').textContent    = formatTempShort(d.main.temp_max);
  document.getElementById('clouds').textContent     = `${d.clouds.all}%`;
  document.getElementById('conditions').textContent = d.weather[0].main;

  // Sunrise / Sunset
  document.getElementById('sunrise').textContent = formatTime(d.sys.sunrise, offset);
  document.getElementById('sunset').textContent  = formatTime(d.sys.sunset,  offset);

  // Timestamp
  document.getElementById('updatedTime').textContent = 'Updated just now';

  // Show all hidden sections
  document.getElementById('weatherCard').style.display  = 'block';
  document.getElementById('extraCards').style.display   = 'grid';
  document.getElementById('sunCard').style.display      = 'flex';
}

// ── Switch between °C and °F ──
function switchUnit(unit) {
  currentUnit = unit;
  document.getElementById('btnC').classList.toggle('active', unit === 'C');
  document.getElementById('btnF').classList.toggle('active', unit === 'F');
  renderWeather(); // re-render with new unit
}

// ── Main: fetch weather from API ──
async function getWeather() {
  const city = input.value.trim();
  if (!city) {
    showError('Please enter a city name.');
    return;
  }

  // Reset UI
  hideError();
  document.getElementById('loading').style.display     = 'block';
  document.getElementById('weatherCard').style.display = 'none';
  document.getElementById('extraCards').style.display  = 'none';
  document.getElementById('sunCard').style.display     = 'none';
  document.getElementById('searchBtn').disabled        = true;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      if (data.cod === '404') {
        showError(`City "${city}" not found. Check spelling and try again.`);
      } else {
        showError(`Error: ${data.message}`);
      }
      return;
    }

    currentData = data;
    renderWeather();

  } catch (err) {
    showError('Network error. Please check your connection and try again.');
  } finally {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('searchBtn').disabled    = false;
  }
}

