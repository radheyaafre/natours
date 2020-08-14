const express = require('express');
const reviewController = require('../controllers/reviewController');
const Review = require('../models/reviewModel');
const authController = require('./../controllers/authenticationController');

// this line merges the params
// for ex: for get a reviews on a tour --> check getAllReviews()
const router =express.Router({mergeParams: true});

router.use(authController.protect);
router.
    route('/')
        .get(reviewController.getAllReviews)
        .post(
            authController.protect,
            authController.restrictTo('user'), 
            reviewController.setTourUserIds,
            reviewController.createReview
            );

router
    .route('/:id')
    .get(reviewController.getReview)
    .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview)
    .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview);



module.exports = router;