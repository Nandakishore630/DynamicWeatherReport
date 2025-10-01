const API_KEY = "e57db2f0948982a3be578dcd570c8cff";

const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContainer = document.getElementById("weatherContainer");
const errorMessage = document.getElementById("errorMessage");
const cityName = document.getElementById("cityName");
const weatherDesc = document.getElementById("weatherDesc");
const temp = document.getElementById("temp");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const visibility = document.getElementById("visibility");
const weatherIcon = document.getElementById("weatherIcon");
const extraMessage = document.getElementById("extraMessage");


// City autocomplete suggestions
cityInput.addEventListener("input", async function() {
  const query = cityInput.value.trim();
  if (query.length < 2) {
    suggestions.innerHTML = "";
    return;
  }
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );
    const cities = await res.json();
    suggestions.innerHTML = "";
    cities.forEach(city => {
      const item = document.createElement("div");
      item.className = "list-group-item list-group-item-action";
      item.textContent = `${city.name}${city.state ? ", " + city.state : ""}, ${city.country}`;
      item.onclick = () => {
        cityInput.value = city.name;
        suggestions.innerHTML = "";
      };
      suggestions.appendChild(item);
    });
  } catch {
    suggestions.innerHTML = "";
  }
});
let currentFocus = -1; // Tracks which suggestion is selected

cityInput.addEventListener("keydown", function(e) {
  const suggestionItems = suggestions.getElementsByClassName("list-group-item");
  if (suggestionItems.length === 0) return;

  if (e.key === "ArrowDown") {
    // Down arrow moves focus down
    currentFocus++;
    if (currentFocus >= suggestionItems.length) currentFocus = 0; // wrap to top
    addActive(suggestionItems);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    // Up arrow moves focus up
    currentFocus--;
    if (currentFocus < 0) currentFocus = suggestionItems.length - 1; // wrap to bottom
    addActive(suggestionItems);
    e.preventDefault();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (currentFocus > -1) {
      suggestionItems[currentFocus].click();
      currentFocus = -1;
      suggestions.innerHTML = "";
    }
  }
});

function addActive(items) {
  // Remove active class from all
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove("autocomplete-active");
  }
  // Add active class only to currentFocus item
  if (currentFocus >= 0 && currentFocus < items.length) {
    items[currentFocus].classList.add("autocomplete-active");
  }
}



// Hide suggestions on blur
cityInput.addEventListener("blur", () => {
  setTimeout(() => (suggestions.innerHTML = ""), 100);
});

// Allow Enter key to trigger search
cityInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    searchBtn.click();
    suggestions.innerHTML = "";
  }
});

searchBtn.addEventListener("click", () => {
  fetchWeatherByCity(cityInput.value.trim());
});
locationBtn.addEventListener("click", handleGeolocation);

window.addEventListener("load", handleGeolocation);


function setWeatherBackground(condition) {
  const bg = document.getElementById("weather-bg");
  bg.className = "weather-bg"; // Reset

  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) bg.classList.add("rain");
  else if (c.includes("snow")) bg.classList.add("snow");
  else if (c.includes("cloud")) bg.classList.add("cloudy");
  else if (c.includes("clear")) bg.classList.add("clear");
  else if (c.includes("mist") || c.includes("fog")) bg.classList.add("cloudy");
}


function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.remove("d-none");
  weatherContainer.classList.add("d-none");
}

function updateUI(data) {
  errorMessage.classList.add("d-none");
  weatherContainer.classList.remove("d-none");
  setWeatherBackground(data.weather[0].main);
  cityName.textContent = `${data.name}, ${data.sys.country}`;
  weatherDesc.textContent = data.weather[0].description;
  temp.textContent = Math.round(data.main.temp);
  humidity.textContent = data.main.humidity;
  windSpeed.textContent = data.wind.speed;
  visibility.textContent = (data.visibility / 1000).toFixed(1);
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIcon.alt = data.weather[0].description;
  extraMessage.textContent =
    data.weather[0].main.toLowerCase().includes("rain")
      ? "Don't forget your umbrella, it's rainy!"
      : data.weather[0].main.toLowerCase().includes("clear")
      ? "Clear skies ahead, have a nice day!"
      : "";
}


async function fetchWeatherByCity(city) {
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    showError(error.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather data not found for your location");
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    showError(error.message);
  }
}

function handleGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
    () => showError("Unable to retrieve your location.")
  );
}
