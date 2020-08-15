const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utilities/catchAsync');
const { response } = require('express');
const AppError = require('./../utilities/AppError');

exports.alerts = (req, res, next)=>{
    const {alert} = req.query;
    if(alert ==='booking')
        res.locals.alert = 
            "Your Booking Was Sucessful! If your booking doesn\'t show up here immidiately..please come back later..";
    next();
}

exports.getOverview = catchAsync(async(req, res, next) => {
    // 1.  get all tour data from collection
    const tours = await Tour.find();
    
    // 2.  build templete
    // 3.  render that template using tour data from step 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});


exports.getTour =catchAsync(async(req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if(!tour){
        return next(new AppError('There is no Tour with that name',404));
    }
    res.status(200).render('tour', {
        title: tour.name,
        tour
    })
});

exports.getLoginForm = (req, res) =>{
    res.status(200).render('login', {
        title: 'Log in to your account'
    });
}

exports.getSignUpForm = (req, res) =>{
    res.status(200).render('signup', {
        title: 'Log in to your account'
    });
}

exports.getAccount = (req, res) =>{
    res.status(200).render('account', {
        title: 'Your Account'
    });
}

exports.getMyTours = catchAsync(async(req, res, next)=>{
    console.log('in getMyTours');
    //1. find all bookings
    const bookings = await Booking.find({
        user: req.user.id
    });
    //2.find tours with returned Ids
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({_id: {
        $in: tourIds
    }});
    res.status(200).render('overview', {
        title: 'My booked Tours',
        tours
    });
});

exports.updateUserData =catchAsync(async(req, res) =>{
    console.log('hiiiiii',req)
    const updatedUser= await User.findByIdAndUpdate(req.user.id,{
        name:  req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    });
    res.status(200).render('account', {
        title: 'Your Account',
        user: updatedUser
    });
});
