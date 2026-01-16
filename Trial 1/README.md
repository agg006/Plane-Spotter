# Plane Spotter (SAN Final Approach)

This lightweight web app shows aircraft on final approach to San Diego International
Airport (SAN) from the east (runway 27). It uses the OpenSky Network public API and
filters for aircraft that are westbound, below 10,000 ft, and within 20 nm of the
airport.

## Run locally

Open `index.html` directly in your browser or serve the folder with any static server.

## Notes

If the OpenSky API is blocked by CORS in your browser, run a local proxy and update
`API_URL` in `app.js` to point at it.
