# TODO: Fix VehicleId Sending in Ride Booking and API Endpoints

## Completed Tasks
- [x] Update `requestTrip` function documentation in `rideService.js` to specify `vehicleId` as required parameter
- [x] Update `handleConfirmBooking` in `PassengerHome.jsx` to send `vehicleId` instead of `vehicleType`
- [x] Update `getAllDriverRequests` in `driverService.js` to use `/admin/pending-drivers` endpoint
- [x] Update `getDriverRequestStatus` in `driverService.js` to use `/apply/status` endpoint

## Pending Tasks
- [ ] Test the booking flow to ensure vehicleId is sent correctly
- [ ] Verify that the polyline is shown after booking
- [ ] Test the updated API endpoints for driver requests
