
const stripe = require('stripe')(process.env.STRIPE_SECRETE_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');
const factory = require('./handlerFactory');
const mongoose= require('mongoose');
const expressMongoSanitize = require('express-mongo-sanitize');


exports.getCheckoutSession = catchAsync(async(req, res, next) =>{
    // get currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    //create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url:`${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [{
            name: `${tour.name} Tour`,
            description: `${tour.summary}`,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            amount: tour.price * 100, //convert into sents
            currency: 'usd',
            quantity: 1
        }]

    })

    //send it to client
    res.status(200).json({
        status: 'success',
        session
    });
});

/*
exports.createBookingCheckout = catchAsync (async(req, res, next)=>{
    // temporary as its unsecure everyone can make bookings without paying
    const {tour, user, price} = req.query;
    if(!tour || !user || !price) return next();
    const tourId = mongoose.Types.ObjectId(tour);
    const userId = mongoose.Types.ObjectId(user);
    await Booking.create({
        tour,
        user,
        price
    });
    res.redirect(req.originalUrl.split('?')[0]);
});*/
const createBookingCheckout =async session => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.line_items[0].amount/100;
    await Booking.create({
        tour,
        user,
        price
    });
}

exports.webhookCheckout = (req, res, next) =>{
    const signature =  req.headers['stripe-signature'];
    let event;
    try{
            event =  stripe.webhooks.constructEvent(
            req.body, 
            signature, 
            process.env.STRIPE_WEBHOOK_SECRETE
        );
    }catch(err){
        return res.status(400).send(`Webhook error occure ${err.message}`);
    }
    console.log('Event from STRIPR: ',event.type);
    if(event.type === 'checkout.session.completed')
        createBookingCheckout(event.data.object); // the session we sent above for stripe checkout is send by stripe webhook here
    res.status(200).json({
        received: true
    })
}

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);