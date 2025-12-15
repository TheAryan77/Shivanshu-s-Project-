// Add your API keys here
const WEATHER_API_KEY = '7fb70194c7919725f75bff82e023856b'; // OpenWeatherMap API key
const GEMINI_API_KEY = 'AIzaSyCACBPR6jCHjza2fQ9kyJAcc89dcAo8LEs'; // Replace with your Gemini API key
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Weather icon mapping
const weatherIcons = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Smoke': '💨',
    'Haze': '🌫️',
    'Dust': '🌪️',
    'Fog': '🌫️',
    'Sand': '🌪️',
    'Ash': '🌋',
    'Squall': '💨',
    'Tornado': '🌪️'
};

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const mainContent = document.getElementById('mainContent');
const errorMessage = document.getElementById('errorMessage');
const cityName = document.getElementById('cityName');
const date = document.getElementById('date');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const visibility = document.getElementById('visibility');
const aiInsights = document.getElementById('aiInsights');
const outfitAdvice = document.getElementById('outfitAdvice');
const activityAdvice = document.getElementById('activityAdvice');
const weatherTips = document.getElementById('weatherTips');

// Event Listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Get current date
function getCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

// Fetch weather data
async function getWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    try {
        // Show loading state
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<span class="btn-text">Loading...</span><span class="btn-icon">⏳</span>';
        
        const response = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        await displayWeather(data);
        
        // Reset button
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<span class="btn-text">Search</span><span class="btn-icon">🔍</span>';
    } catch (error) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<span class="btn-text">Search</span><span class="btn-icon">🔍</span>';
        showError(error.message);
    }
}

// Display weather data
async function displayWeather(data) {
    // Hide error and show weather info
    errorMessage.classList.add('hidden');
    mainContent.classList.remove('hidden');

    // Update weather information
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    date.textContent = getCurrentDate();
    
    // Set weather icon
    const weatherMain = data.weather[0].main;
    weatherIcon.textContent = weatherIcons[weatherMain] || '🌤️';
    
    // Set temperature
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    
    // Set description
    description.textContent = data.weather[0].description;
    
    // Set details
    windSpeed.textContent = `${data.wind.speed} m/s`;
    humidity.textContent = `${data.main.humidity}%`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    
    // Sunrise and sunset
    const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    sunrise.textContent = sunriseTime;
    sunset.textContent = sunsetTime;
    
    // Visibility
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;

    // Change background based on weather
    updateBackground(weatherMain);
    
    // Get AI insights
    await getAIInsights(data);
}

// Get AI insights from Gemini
async function getAIInsights(weatherData) {
    // Show loading state
    aiInsights.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Generating AI insights...</p>
        </div>
    `;
    
    const prompt = `You are a friendly weather assistant. Based on the following weather data, provide personalized advice:

Location: ${weatherData.name}, ${weatherData.sys.country}
Temperature: ${Math.round(weatherData.main.temp)}°C
Feels Like: ${Math.round(weatherData.main.feels_like)}°C
Weather: ${weatherData.weather[0].main} - ${weatherData.weather[0].description}
Humidity: ${weatherData.main.humidity}%
Wind Speed: ${weatherData.wind.speed} m/s
Visibility: ${(weatherData.visibility / 1000).toFixed(1)} km

Please provide:
1. A brief, friendly summary of the current weather (2-3 sentences)
2. Outfit recommendations - what should someone wear today? Be specific about clothing items.
3. Activity suggestions - what activities are good or bad to do in this weather?
4. Important weather tips or warnings for the day

Format your response EXACTLY as follows (use ||| as separator):
SUMMARY: [your weather summary here]
|||
OUTFIT: [your outfit recommendations here]
|||
ACTIVITY: [your activity suggestions here]
|||
TIPS: [your weather tips here]`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get AI insights');
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Parse the response
        const sections = aiResponse.split('|||').map(s => s.trim());
        
        let summary = '';
        let outfit = '';
        let activity = '';
        let tips = '';
        
        sections.forEach(section => {
            if (section.startsWith('SUMMARY:')) {
                summary = section.replace('SUMMARY:', '').trim();
            } else if (section.startsWith('OUTFIT:')) {
                outfit = section.replace('OUTFIT:', '').trim();
            } else if (section.startsWith('ACTIVITY:')) {
                activity = section.replace('ACTIVITY:', '').trim();
            } else if (section.startsWith('TIPS:')) {
                tips = section.replace('TIPS:', '').trim();
            }
        });
        
        // Display the insights
        aiInsights.innerHTML = `<p>${summary}</p>`;
        outfitAdvice.textContent = outfit;
        activityAdvice.textContent = activity;
        weatherTips.textContent = tips;
        
    } catch (error) {
        console.error('AI Error:', error);
        aiInsights.innerHTML = `<p>⚠️ Unable to generate AI insights at the moment. Please check your Gemini API key.</p>`;
        outfitAdvice.textContent = 'AI insights unavailable';
        activityAdvice.textContent = 'AI insights unavailable';
        weatherTips.textContent = 'AI insights unavailable';
    }
}

// Update background color based on weather
function updateBackground(weatherMain) {
    const body = document.body;
    
    switch(weatherMain) {
        case 'Clear':
            body.style.background = 'linear-gradient(135deg, #FDB99B 0%, #F8DE7E 50%, #FFE5A3 100%)';
            break;
        case 'Clouds':
            body.style.background = 'linear-gradient(135deg, #A8EDEA 0%, #92A5C8 100%)';
            break;
        case 'Rain':
        case 'Drizzle':
            body.style.background = 'linear-gradient(135deg, #4CA1AF 0%, #2C3E50 100%)';
            break;
        case 'Thunderstorm':
            body.style.background = 'linear-gradient(135deg, #373B44 0%, #4286F4 100%)';
            break;
        case 'Snow':
            body.style.background = 'linear-gradient(135deg, #E6DADA 0%, #274046 100%)';
            break;
        case 'Mist':
        case 'Fog':
        case 'Haze':
            body.style.background = 'linear-gradient(135deg, #606C88 0%, #3F4C6B 100%)';
            break;
        default:
            body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)';
    }
}

// Show error message
function showError(message) {
    mainContent.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = message;
}
