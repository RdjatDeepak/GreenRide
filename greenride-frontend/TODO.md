# TODO: Fix calculate-optimize API 500 Error

## Task
Fix the automatic API call to `/api/route/calculate-optimize` that triggers on page load without required `vehicleId`.

## Steps to Complete:
- [x] 1. Analyze the issue in DriverHome.jsx
- [x] 2. Remove the automatic useEffect that calls calculateRangePrediction on page load
- [x] 3. Add function to calculate range prediction when trip request is accepted
- [x] 4. Use actual trip data (vehicleId, distance from coordinates)
- [x] 5. Fix PassengerHome.jsx - remove automatic API call on page load
- [x] 6. Fix LiveMap.jsx - remove automatic API call on WebSocket updates
- [x] 7. Fix hardcoded coordinates - use dynamic user location from geolocation
- [x] 8. Test the changes

## Changes Made:
- Removed automatic page load API call in DriverHome.jsx
- Added prediction calculation trigger on trip acceptance
- Uses actual trip request data for the API call
- Exported calculateDistance from rideService.js
- Fixed PassengerHome.jsx - API now called only after trip confirmation
- Fixed LiveMap.jsx - API now requires valid trip distance before calling
- Added onLocationUpdate callback in LiveMap to pass user location to parent
- Updated PassengerHome to receive location from LiveMap instead of using hardcoded values
- Updated handleConfirmBooking to require userLocation instead of falling back to hardcoded coordinates

