const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp =  require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utilities/AppError');
const globalErrorHandler = require('./controllers/errorController');
const { pathToFileURL } = require('url');
const { response } = require('express');
const cookieParser =  require('cookie-parser');
const compresion = require('compression');
const app= express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 
app.use(express.static(path.join(__dirname, 'public'))); // using this we are setting up the 


//route to see html,css,etc static files. public is a route for that
// we can access now http://127.0.0.1:3000/overview.html
// security http headers
app.use(helmet());

//1) global middlewares

//dev logging
//console.log('process.env.NODE_ENV'+process.env.NODE_ENV);
if(process.env.NODE_ENV==='development'){
    app.use(morgan('dev'));//logs the incoming requests
}

// allow 100 request from same Ip in one hour
//limit req from same api
const limiter =rateLimit ({
    max: 100,
    wondowMs: 60 * 60 *1000,
    message: 'to many request from this Ip. please try again in hour'
});

app.use('/api',limiter);


//reading data into req. body , body parser
// body larger than 10kb not expected
app.use(express.json({limit: '10kb'})); //to get json data in req
app.use(cookieParser());
app.use(express.urlencoded({extended: true, limit:'10kb'}));

//data sanitization against Nosql query injection like below in loging
/**
 * {

    "email":{"$gt":""},
    "password": "password1234"
}
 * 
 */
app.use(mongoSanitize());

//sanitization against cross site scripting attacks
app.use(xss()); //prevent injecting html code with js script
//converts html symbols into plain text ascii code like <> to lt gt

//prevent parameter pollution
// yo avoid this issue {{URL}}/api/v1/tours?sort=duration&sort=price
app.use(hpp({
    whitelist: [
        'duration', 
        'ratingsQuantity', 
        'ratingsAverage', 
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));




// app.use is the middleware which is use to update req, res 
// and every middle ware should call next()
//inorder to pass to next middleware
//when all middleware finish then req res cycle ends
/*app.use((req,res,next)=>{
    console.log('Hello From MiddileWare');
    next();
})  
*/

app.use(compresion());
//test middleware
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    next();
})  
/*
app.get('/',(req,res)=>{
    res.
    status(200).
    json({message:'Hello from server',app:'nature'});
});
*/

//2) route handleres



//app.get('/api/v1/tours/',getAllTours);
//app.get('/api/v1/tours/:id',getTour);
//app.post('/api/v1/tours',createTour);
//app.patch('/api/v1/tours/:id',updateTour);
//app.delete('/api/v1/tours/:id',deleteTour);

//3) routes
app.use('/', viewRouter);
app.use('/api/v1/tours',tourRouter); //middleware
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.use('/api/v1/bookings',bookingRouter);


// for invalid routes for all methods
app.all('*',(req,res,next) => {
    //res.status(404).json({
    //    status: 'fail',
    //    message: `Cant find ${req.originalUrl} on this server`
    //})

   // const err = new Error(`Cant find ${req.originalUrl} on this server`);
   // err.status = 'fail';
   // err.statusCode = 404;
   
   next(new AppError(`Cant find ${req.originalUrl} on this server`,404)); //if next() receives argument then its automatically know that its an error

});

//error handling middle ware 
app.use(globalErrorHandler);

module.exports =app;