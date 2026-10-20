/**
 * WeatherNow — Dynamic Weather App
 * Uses Open-Meteo (free, no API key) + Open-Meteo Geocoding
 * APIs: https://api.open-meteo.com & https://geocoding-api.open-meteo.com
 */

/* ==========================================
   CONSTANTS & STATE
   ========================================== */
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

let state = {
  unit: 'celsius',       // 'celsius' | 'fahrenheit'
  currentData: null,     // raw API response
  geoData: null,         // geocoding result
  debounceTimer: null,
  lang: 'en',            // 'en' | 'bn'
};

/* ==========================================
   TRANSLATIONS
   ========================================== */
const translations = {
  en: {
    searchPlaceholder: 'Search for a city...',
    quick: 'Quick:',
    loading: 'Fetching weather data...',
    tryAgain: 'Try Again',
    welcomeTitle: 'Discover the Weather',
    welcomeSubtitle: 'Search for any city to get a live weather report — temperature, humidity, wind, and more.',
    feelsLike: 'Feels like',
    high: 'High',
    low: 'Low',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    visibility: 'Visibility',
    clearView: 'Clear view',
    uvIndex: 'UV Index',
    precipitation: 'Precipitation',
    lastHour: 'Last hour',
    pressure: 'Pressure',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    forecast7day: '7-Day Forecast',
    hourlyForecast: 'Hourly Forecast',
    highPressure: 'High pressure',
    lowPressure: 'Low pressure',
    today: 'Today',
    now: 'Now',
    cityNotFound: city => `No city found for "${city}". Please check the spelling.`,
    fetchError: 'Failed to fetch location. Check your connection.',
    weatherError: 'Failed to load weather data. Please try again.',
    weatherDesc: {
      0: 'Clear Sky', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Drizzle',
      55: 'Heavy Drizzle', 56: 'Freezing Drizzle', 57: 'Heavy Freezing Drizzle',
      61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
      66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
      71: 'Slight Snowfall', 73: 'Moderate Snowfall', 75: 'Heavy Snowfall',
      77: 'Snow Grains', 80: 'Slight Rain Showers', 81: 'Moderate Rain Showers',
      82: 'Violent Rain Showers', 85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Thunderstorm with Heavy Hail',
    },
    uvLabels: { low: '🟢 Low', moderate: '🟡 Moderate', high: '🟠 High', veryHigh: '🔴 Very High', extreme: '🟣 Extreme' },
    windDirs: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  },
  bn: {
    searchPlaceholder: 'শহর খুঁজুন...',
    quick: 'দ্রুত:',
    loading: 'আবহাওয়ার তথ্য আনা হচ্ছে...',
    tryAgain: 'আবার চেষ্টা করুন',
    welcomeTitle: 'আবহাওয়া আবিষ্কার করুন',
    welcomeSubtitle: 'যেকোনো শহর খুঁজুন এবং তাৎক্ষণিক আবহাওয়া রিপোর্ট পান — তাপমাত্রা, আর্দ্রতা, বায়ু এবং আরও অনেক কিছু।',
    feelsLike: 'অনুভূত তাপমাত্রা',
    high: 'সর্বোচ্চ',
    low: 'সর্বনিম্ন',
    humidity: 'আর্দ্রতা',
    windSpeed: 'বায়ুর গতি',
    visibility: 'দৃশ্যমানতা',
    clearView: 'পরিষ্কার দৃশ্য',
    uvIndex: 'ইউভি সূচক',
    precipitation: 'বৃষ্টিপাত',
    lastHour: 'গত এক ঘণ্টা',
    pressure: 'বায়ুচাপ',
    sunrise: 'সূর্যোদয়',
    sunset: 'সূর্যাস্ত',
    forecast7day: '৭ দিনের পূর্বাভাস',
    hourlyForecast: 'ঘণ্টাওয়ারি পূর্বাভাস',
    highPressure: 'উচ্চ চাপ',
    lowPressure: 'নিম্ন চাপ',
    today: 'আজ',
    now: 'এখন',
    cityNotFound: city => `"${city}" শহর পাওয়া যায়নি। বানান পরীক্ষা করুন।`,
    fetchError: 'অবস্থান আনতে ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।',
    weatherError: 'আবহাওয়ার তথ্য লোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    weatherDesc: {
      0: 'পরিষ্কার আকাশ', 1: 'প্রায় পরিষ্কার', 2: 'আংশিক মেঘলা', 3: 'মেঘাচ্ছন্ন',
      45: 'কুয়াশাচ্ছন্ন', 48: 'বরফাবৃত কুয়াশা', 51: 'হালকা গুঁড়ি বৃষ্টি', 53: 'গুঁড়ি বৃষ্টি',
      55: 'ভারী গুঁড়ি বৃষ্টি', 56: 'হিমশীতল গুঁড়ি বৃষ্টি', 57: 'ভারী হিমশীতল গুঁড়ি বৃষ্টি',
      61: 'হালকা বৃষ্টি', 63: 'মাঝারি বৃষ্টি', 65: 'ভারী বৃষ্টি',
      66: 'হালকা হিমবৃষ্টি', 67: 'ভারী হিমবৃষ্টি',
      71: 'হালকা তুষারপাত', 73: 'মাঝারি তুষারপাত', 75: 'ভারী তুষারপাত',
      77: 'তুষারকণা', 80: 'হালকা বৃষ্টির ঝাপটা', 81: 'মাঝারি বৃষ্টির ঝাপটা',
      82: 'তীব্র বৃষ্টির ঝাপটা', 85: 'হালকা তুষার ঝাপটা', 86: 'ভারী তুষার ঝাপটা',
      95: 'বজ্রঝড়', 96: 'শিলাবৃষ্টিসহ বজ্রঝড়', 99: 'ভারী শিলাবৃষ্টিসহ বজ্রঝড়',
    },
    uvLabels: { low: '🟢 কম', moderate: '🟡 মাঝারি', high: '🟠 বেশি', veryHigh: '🔴 অনেক বেশি', extreme: '🟣 চরম' },
    windDirs: ['উ', 'উ-পূ', 'পূ', 'দ-পূ', 'দ', 'দ-প', 'প', 'উ-প'],
  },
};

function t(key) {
  return translations[state.lang][key] || translations.en[key] || key;
}

function applyLang() {
  const lang = state.lang;
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';

  // Swap all data-i18n text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = translations[lang][key];
    if (text !== undefined) el.textContent = text;
  });

  // Swap placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = translations[lang][key];
    if (text !== undefined) el.placeholder = text;
  });

  // Re-render dynamic content if weather is loaded
  if (state.currentData && state.geoData) {
    const { name, country, admin1 } = state.geoData;
    renderWeather(state.currentData, name, country, admin1 || '');
  }
}

/* ==========================================
   DOM REFERENCES
   ========================================== */
const $ = id => document.getElementById(id);
const cityInput      = $('cityInput');
const searchBtn      = $('searchBtn');
const autocomplete   = $('autocompleteDropdown');
const loadingOverlay = $('loadingOverlay');
const errorState     = $('errorState');
const errorMessage   = $('errorMessage');
const welcomeState   = $('welcomeState');
const weatherContent = $('weatherContent');

/* ==========================================
   INIT
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  startClock();
  attachEvents();
  // Load London by default after short delay
  setTimeout(() => searchCity('London'), 600);
});

/* ==========================================
   ANIMATED PARTICLES
   ========================================== */
function initParticles() {
  const container = $('bgParticles');
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 20 + 15}s;
      animation-delay: -${Math.random() * 20}s;
      opacity: ${Math.random() * 0.5 + 0.1};
    `;
    container.appendChild(p);
  }
}

/* ==========================================
   CLOCK
   ========================================== */
function startClock() {
  const el = $('headerTime');
  const update = () => {
    el.textContent = new Date().toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  };
  update();
  setInterval(update, 30000);
}

/* ==========================================
   EVENT LISTENERS
   ========================================== */
function attachEvents() {
  // Search button
  searchBtn.addEventListener('click', () => {
    const val = cityInput.value.trim();
    if (val) searchCity(val);
  });

  // Enter key
  cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = cityInput.value.trim();
      if (val) searchCity(val);
      autocomplete.classList.remove('visible');
    }
    if (e.key === 'Escape') autocomplete.classList.remove('visible');
  });

  // Autocomplete typing
  cityInput.addEventListener('input', () => {
    clearTimeout(state.debounceTimer);
    const val = cityInput.value.trim();
    if (val.length < 2) {
      autocomplete.classList.remove('visible');
      return;
    }
    state.debounceTimer = setTimeout(() => fetchAutocomplete(val), 320);
  });

  // Click outside to close dropdown
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrapper')) {
      autocomplete.classList.remove('visible');
    }
  });

  // Popular city chips
  document.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      cityInput.value = chip.dataset.city;
      searchCity(chip.dataset.city);
    });
  });

  // Unit toggle
  $('btnCelsius').addEventListener('click', () => setUnit('celsius'));
  $('btnFahrenheit').addEventListener('click', () => setUnit('fahrenheit'));

  // Retry button
  $('retryBtn').addEventListener('click', () => {
    const val = cityInput.value.trim();
    if (val) searchCity(val);
  });

  // Language toggle
  $('btnLangEn').addEventListener('click', () => setLang('en'));
  $('btnLangBn').addEventListener('click', () => setLang('bn'));
}

function setLang(lang) {
  state.lang = lang;
  $('btnLangEn').classList.toggle('active', lang === 'en');
  $('btnLangBn').classList.toggle('active', lang === 'bn');
  applyLang();
}

/* ==========================================
   AUTOCOMPLETE
   ========================================== */
async function fetchAutocomplete(query) {
  try {
    const res = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      autocomplete.classList.remove('visible');
      return;
    }

    autocomplete.innerHTML = data.results.map(r => `
      <div class="autocomplete-item" data-lat="${r.latitude}" data-lon="${r.longitude}"
           data-name="${r.name}" data-country="${r.country || ''}" data-region="${r.admin1 || ''}">
        <span class="ac-icon">${getFlagEmoji(r.country_code)}</span>
        <span class="ac-name">${r.name}${r.admin1 ? ', ' + r.admin1 : ''}</span>
        <span class="ac-country">${r.country || ''}</span>
      </div>
    `).join('');

    autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        const { lat, lon, name, country, region } = item.dataset;
        cityInput.value = name;
        autocomplete.classList.remove('visible');
        fetchWeather(parseFloat(lat), parseFloat(lon), name, country, region);
      });
    });

    autocomplete.classList.add('visible');
  } catch (err) {
    console.error('Autocomplete error:', err);
  }
}

/* ==========================================
   SEARCH CITY (Geocode then Fetch)
   ========================================== */
async function searchCity(cityName) {
  showLoading();
  autocomplete.classList.remove('visible');

  try {
    const res = await fetch(`${GEO_API}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      showError(translations[state.lang].cityNotFound(cityName));
      return;
    }

    const city = data.results[0];
    state.geoData = city;
    await fetchWeather(city.latitude, city.longitude, city.name, city.country, city.admin1 || '');

  } catch (err) {
    console.error('Search error:', err);
    showError(t('fetchError'));
  }
}

/* ==========================================
   FETCH WEATHER DATA
   ========================================== */
async function fetchWeather(lat, lon, name, country, region) {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'weather_code', 'wind_speed_10m', 'wind_direction_10m',
        'precipitation', 'surface_pressure', 'uv_index', 'visibility',
        'is_day'
      ].join(','),
      hourly: [
        'temperature_2m', 'weather_code', 'precipitation_probability'
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'sunrise', 'sunset', 'precipitation_sum'
      ].join(','),
      timezone: 'auto',
      forecast_days: 7,
    });

    const res = await fetch(`${WEATHER_API}?${params}`);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    state.currentData = data;
    renderWeather(data, name, country, region);
    showWeather();

  } catch (err) {
    console.error('Weather fetch error:', err);
    showError(t('weatherError'));
  }
}

/* ==========================================
   RENDER WEATHER
   ========================================== */
function renderWeather(data, cityName, country, region) {
  const cur = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  const tz = data.timezone;

  const isDay = cur.is_day === 1;
  const wCode = cur.weather_code;

  // City info
  $('cityName').textContent = cityName;
  $('cityCountry').textContent = [region, country].filter(Boolean).join(', ');
  $('cityDatetime').textContent = formatDatetimeInTz(tz);

  // Main weather
  const tempC = Math.round(cur.temperature_2m);
  const feelsC = Math.round(cur.apparent_temperature);
  const highC  = Math.round(daily.temperature_2m_max[0]);
  const lowC   = Math.round(daily.temperature_2m_min[0]);

  updateTemperatureDisplay(tempC, feelsC, highC, lowC);

  $('weatherIconLarge').textContent = getWeatherIcon(wCode, isDay);
  $('weatherCondition').textContent = getWeatherDescription(wCode);

  // Stats
  $('humidityVal').textContent = `${cur.relative_humidity_2m}%`;
  $('humidityBar').style.width = `${cur.relative_humidity_2m}%`;

  const windKmh = Math.round(cur.wind_speed_10m);
  $('windVal').textContent = `${windKmh} km/h`;
  $('windDir').textContent = getWindDirection(cur.wind_direction_10m);

  const vis = cur.visibility ? (cur.visibility / 1000).toFixed(1) : '--';
  $('visibilityVal').textContent = `${vis} km`;

  const uv = cur.uv_index != null ? Math.round(cur.uv_index) : '--';
  $('uvVal').textContent = uv;
  $('uvLabel').textContent = getUVLabel(uv);

  $('precipVal').textContent = `${(cur.precipitation || 0).toFixed(1)} mm`;

  const pressure = Math.round(cur.surface_pressure || 0);
  $('pressureVal').textContent = `${pressure} hPa`;
  $('pressureLabel').textContent = pressure > 1013 ? t('highPressure') : t('lowPressure');

  // Sun times
  const sunrise = new Date(daily.sunrise[0]);
  const sunset  = new Date(daily.sunset[0]);
  $('sunriseTime').textContent = formatTime(sunrise);
  $('sunsetTime').textContent  = formatTime(sunset);

  // Animate sun position on arc
  animateSunPosition(sunrise, sunset);

  // 7-Day Forecast
  renderForecast(daily);

  // Hourly
  renderHourly(hourly, data.current_units, tz);
}

/* ==========================================
   TEMPERATURE DISPLAY (unit-aware)
   ========================================== */
function updateTemperatureDisplay(tempC, feelsC, highC, lowC) {
  const toDisplay = v => state.unit === 'fahrenheit' ? cToF(v) : v;
  const unitSuffix = state.unit === 'celsius' ? '°C' : '°F';

  $('tempValue').textContent = toDisplay(tempC);
  $('tempUnit').textContent = unitSuffix === '°C' ? '°C' : '°F';
  $('feelsLike').textContent = `${toDisplay(feelsC)}${unitSuffix}`;
  $('tempHigh').textContent = `${toDisplay(highC)}${unitSuffix}`;
  $('tempLow').textContent  = `${toDisplay(lowC)}${unitSuffix}`;
}

/* ==========================================
   FORECAST
   ========================================== */
function renderForecast(daily) {
  const grid = $('forecastGrid');
  grid.innerHTML = '';

  const days = daily.time;
  const codes = daily.weather_code;
  const highs = daily.temperature_2m_max;
  const lows  = daily.temperature_2m_min;

  const today = new Date().toISOString().split('T')[0];

  days.forEach((dateStr, i) => {
    const isToday = dateStr === today;
    const date = new Date(dateStr + 'T12:00:00');
    const dayLabel = isToday ? t('today') : date.toLocaleDateString('en-GB', { weekday: 'short' });

    const high = state.unit === 'fahrenheit' ? cToF(Math.round(highs[i])) : Math.round(highs[i]);
    const low  = state.unit === 'fahrenheit' ? cToF(Math.round(lows[i]))  : Math.round(lows[i]);
    const unit = state.unit === 'celsius' ? '°C' : '°F';

    const card = document.createElement('div');
    card.className = `forecast-card${isToday ? ' today' : ''}`;
    card.innerHTML = `
      <div class="fc-day">${dayLabel}</div>
      <div class="fc-icon">${getWeatherIcon(codes[i], true)}</div>
      <div class="fc-high">${high}${unit}</div>
      <div class="fc-low">${low}${unit}</div>
    `;
    grid.appendChild(card);
  });
}

/* ==========================================
   HOURLY FORECAST
   ========================================== */
function renderHourly(hourly, units, tz) {
  const scroll = $('hourlyScroll');
  scroll.innerHTML = '';

  const now = new Date();
  const currentHour = now.getHours();

  // Find today's hours (next 24)
  const times  = hourly.time;
  const temps  = hourly.temperature_2m;
  const codes  = hourly.weather_code;
  const precip = hourly.precipitation_probability;

  // Get the next 24 hours starting from current
  let startIdx = times.findIndex(ts => {
    const d = new Date(ts);
    return d >= now;
  });
  if (startIdx === -1) startIdx = 0;

  const sliceTimes = times.slice(startIdx, startIdx + 24);
  const sliceTemps = temps.slice(startIdx, startIdx + 24);
  const sliceCodes = codes.slice(startIdx, startIdx + 24);
  const slicePrecip = precip.slice(startIdx, startIdx + 24);

  sliceTimes.forEach((timeStr, i) => {
    const d = new Date(timeStr);
    const hour = d.getHours();
    const isNow = i === 0;
    const timeLabel = isNow ? t('now') : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const isDay = hour >= 6 && hour < 20;
    const tempVal = state.unit === 'fahrenheit' ? cToF(Math.round(sliceTemps[i])) : Math.round(sliceTemps[i]);
    const unit = state.unit === 'celsius' ? '°C' : '°F';

    const card = document.createElement('div');
    card.className = `hourly-card${isNow ? ' now' : ''}`;
    card.innerHTML = `
      <div class="hc-time">${timeLabel}</div>
      <div class="hc-icon">${getWeatherIcon(sliceCodes[i], isDay)}</div>
      <div class="hc-temp">${tempVal}${unit}</div>
      <div class="hc-precip">${slicePrecip[i] ?? 0}%💧</div>
    `;
    scroll.appendChild(card);
  });
}

/* ==========================================
   UNIT TOGGLE
   ========================================== */
function setUnit(unit) {
  state.unit = unit;
  $('btnCelsius').classList.toggle('active', unit === 'celsius');
  $('btnFahrenheit').classList.toggle('active', unit === 'fahrenheit');

  if (state.currentData && state.geoData) {
    const { name, country, admin1 } = state.geoData;
    renderWeather(state.currentData, name, country, admin1 || '');
  }
}

/* ==========================================
   SUN ARC ANIMATION
   ========================================== */
function animateSunPosition(sunrise, sunset) {
  const now = Date.now();
  const sr  = sunrise.getTime();
  const ss  = sunset.getTime();

  if (now < sr || now > ss) {
    $('sunPosition').setAttribute('cx', now < sr ? '10' : '190');
    return;
  }

  const progress = (now - sr) / (ss - sr);
  // Arc from (10,70) to (190,70) through top (100,30)
  const t = progress;
  const x = 10 + 180 * t;
  const arcY = 70 - Math.sin(Math.PI * t) * 60;
  $('sunPosition').setAttribute('cx', x.toFixed(1));
  $('sunPosition').setAttribute('cy', arcY.toFixed(1));
}

/* ==========================================
   UI STATE MANAGEMENT
   ========================================== */
function showLoading() {
  loadingOverlay.classList.add('active');
  errorState.classList.remove('active');
  weatherContent.classList.remove('active');
  welcomeState.classList.add('hidden');
}

function showWeather() {
  loadingOverlay.classList.remove('active');
  errorState.classList.remove('active');
  welcomeState.classList.add('hidden');
  weatherContent.classList.add('active');
}

function showError(msg) {
  loadingOverlay.classList.remove('active');
  weatherContent.classList.remove('active');
  errorMessage.textContent = msg;
  errorState.classList.add('active');
}

/* ==========================================
   HELPERS
   ========================================== */
function cToF(c) {
  return Math.round(c * 9 / 5 + 32);
}

function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDatetimeInTz(tz) {
  try {
    return new Date().toLocaleString('en-GB', {
      timeZone: tz,
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return new Date().toLocaleString();
  }
}

function getWindDirection(deg) {
  const dirs = translations[state.lang].windDirs;
  return dirs[Math.round(deg / 45) % 8];
}

function getUVLabel(uv) {
  if (uv === '--' || uv == null) return '—';
  const labels = translations[state.lang].uvLabels;
  if (uv <= 2)  return labels.low;
  if (uv <= 5)  return labels.moderate;
  if (uv <= 7)  return labels.high;
  if (uv <= 10) return labels.veryHigh;
  return labels.extreme;
}

function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌍';
  const offset = 127397;
  try {
    return [...countryCode.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
  } catch {
    return '🌍';
  }
}

/* ==========================================
   WEATHER CODE → ICON & DESCRIPTION
   WMO Weather codes: https://open-meteo.com/en/docs
   ========================================== */
function getWeatherIcon(code, isDay = true) {
  const day = isDay;
  const map = {
    0:  day ? '☀️' : '🌙',
    1:  day ? '🌤' : '🌤',
    2:  day ? '⛅' : '☁️',
    3:  '☁️',
    45: '🌫',
    48: '🌫',
    51: '🌦',
    53: '🌦',
    55: '🌧',
    56: '🌨',
    57: '🌨',
    61: '🌧',
    63: '🌧',
    65: '🌊',
    66: '🌨',
    67: '❄️',
    71: '🌨',
    73: '❄️',
    75: '❄️',
    77: '🌨',
    80: '🌦',
    81: '🌧',
    82: '⛈',
    85: '🌨',
    86: '❄️',
    95: '⛈',
    96: '⛈',
    99: '⛈',
  };
  return map[code] || (day ? '🌤' : '🌙');
}

function getWeatherDescription(code) {
  const map = translations[state.lang].weatherDesc;
  return map[code] || (state.lang === 'bn' ? 'অজানা' : 'Unknown');
}
