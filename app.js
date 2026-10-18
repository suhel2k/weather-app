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
    applyLang(); // <-- This is the dangerous line
}
// ... existing code ...
