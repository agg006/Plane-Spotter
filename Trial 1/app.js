const API_URL =
  "https://opensky-network.org/api/states/all?lamin=32.55&lamax=32.9&lomin=-117.6&lomax=-116.9";

const SAN_COORDS = {
  lat: 32.7336,
  lon: -117.1897,
};

const ELEMENTS = {
  rows: document.getElementById("flight-rows"),
  timestamp: document.getElementById("timestamp"),
  status: document.getElementById("status-pill"),
  refresh: document.getElementById("refresh"),
};

const MAX_ALTITUDE_FEET = 10000;
const APPROACH_TRACK_RANGE = [240, 300];
const MAX_DISTANCE_NM = 20;
const REFRESH_MS = 20000;

const sampleFlights = [
  {
    callsign: "ASA421",
    altitudeFeet: 5200,
    groundspeed: 178,
    track: 268,
    distanceNm: 7.4,
  },
  {
    callsign: "SWA227",
    altitudeFeet: 6400,
    groundspeed: 186,
    track: 255,
    distanceNm: 10.1,
  },
];

const toNm = (meters) => meters / 1852;

const formatCallsign = (callsign) =>
  callsign ? callsign.trim() : "Unknown";

const formatNumber = (value, unit) =>
  Number.isFinite(value) ? `${Math.round(value)} ${unit}` : "--";

const setStatus = (message, isError = false) => {
  ELEMENTS.status.textContent = message;
  ELEMENTS.status.style.background = isError ? "#ffe9e9" : "#e5eefb";
  ELEMENTS.status.style.color = isError ? "#b3261e" : "#1c69d4";
};

const updateTimestamp = (label) => {
  ELEMENTS.timestamp.textContent = label;
};

const toRadians = (value) => (value * Math.PI) / 180;

const distanceBetween = (lat1, lon1, lat2, lon2) => {
  const radius = 6371e3;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};

const isWithinTrack = (track) =>
  Number.isFinite(track) &&
  track >= APPROACH_TRACK_RANGE[0] &&
  track <= APPROACH_TRACK_RANGE[1];

const toFlight = (state) => {
  const [
    ,
    callsign,
    ,
    ,
    ,
    longitude,
    latitude,
    baroAltitude,
    onGround,
    velocity,
    trueTrack,
  ] = state;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const altitudeMeters = baroAltitude ?? 0;
  const altitudeFeet = altitudeMeters * 3.28084;
  const distanceMeters = distanceBetween(
    SAN_COORDS.lat,
    SAN_COORDS.lon,
    latitude,
    longitude
  );
  const distanceNm = toNm(distanceMeters);

  return {
    callsign: formatCallsign(callsign),
    altitudeFeet,
    groundspeed: Number.isFinite(velocity) ? velocity * 1.94384 : null,
    track: trueTrack,
    distanceNm,
    onGround,
  };
};

const filterFinalApproach = (flight) =>
  flight &&
  !flight.onGround &&
  flight.altitudeFeet <= MAX_ALTITUDE_FEET &&
  flight.distanceNm <= MAX_DISTANCE_NM &&
  isWithinTrack(flight.track);

const renderRows = (flights) => {
  if (!flights.length) {
    ELEMENTS.rows.innerHTML =
      '<tr><td colspan="5" class="loading">No inbound aircraft detected.</td></tr>';
    return;
  }

  ELEMENTS.rows.innerHTML = flights
    .map(
      (flight) => `
      <tr>
        <td>${flight.callsign}</td>
        <td>${formatNumber(flight.altitudeFeet, "ft")}</td>
        <td>${formatNumber(flight.groundspeed, "kt")}</td>
        <td>${formatNumber(flight.track, "°")}</td>
        <td>${flight.distanceNm.toFixed(1)} nm</td>
      </tr>
    `
    )
    .join("");
};

const renderFlights = (flights) => {
  const sorted = [...flights].sort((a, b) => a.distanceNm - b.distanceNm);
  renderRows(sorted);
};

const handleError = (error) => {
  console.error(error);
  setStatus("Live data unavailable", true);
  updateTimestamp("Showing sample data");
  renderFlights(sampleFlights);
};

const fetchFlights = async () => {
  setStatus("Loading live data…");
  updateTimestamp("Updating…");

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    const flights = (data.states || [])
      .map(toFlight)
      .filter(filterFinalApproach);

    setStatus("Live data active");
    updateTimestamp(`Updated ${new Date().toLocaleTimeString()}`);
    renderFlights(flights);
  } catch (error) {
    handleError(error);
  }
};

fetchFlights();
setInterval(fetchFlights, REFRESH_MS);

ELEMENTS.refresh.addEventListener("click", fetchFlights);
