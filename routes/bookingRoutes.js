const express = require('express');
const bookingController = require('../controllers/bookingController');
const Review = require('../models/reviewModel');
const authController = require('./../controllers/authenticationController');

// this line merges the params
// for ex: for get a reviews on a tour --> check getAllReviews()
const router = express.Router();

router.use(authController.protect);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').get(bookingController.getAllBookings).post(bookingController.createBooking);
router.route('/:id').get(bookingController.getBooking).patch(bookingController.updateBooking).delete(bookingController.deleteBooking);


module.exports = router;