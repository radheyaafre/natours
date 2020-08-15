const { model } = require("../models/tourModel");
const AppError = require("../utilities/AppError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    // console.log(err);
    const value = err.keyValue.name;
    // console.log('handleDuplicateFieldsDB', value);
    const message = `duplicate fields ${value} please user another value`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid token .. please login again', 401);
const handleJwtTokenError = () => new AppError('login again..token expire.', 401);
const handleValidationErrorDB = err => {

    //console.log('handleValidationErrorDB',err.errors.name.properties.message);
    //console.log(err.erros.ValidatorError);
    const errors = Object.values(err.errors).map(el => el.message);

    //console.log(errors);
    const message = `Invalid input data ${errors.join('. ')}`;

    return new AppError(message, 400);
}
const sendErrorForDev = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            erros: err,
            message: err.message,
            stack: err.stack
        });
    }
    // Rendered Website    
    return res.status(err.statusCode).render('error', {
        msg: err.message
    });

};

const sendErrorProd = (err, req, res) => {
    // operatopnal trusted erros : send msg to client
    if (req.originalUrl.startsWith('/api')) {
        // console.log('in prod error ' + err.isOperational);
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
            // programming or unknown errors    
        }
        // log the error
        console.error('Error :) ', err);
        // send generic msg
        return res.status(500).json({
            status: 'error',
            messamsgge: 'Something went wrong'
        })
    }
    // rended website
    if (err.isOperational) {
        // Rendered Website    
        res.status(err.statusCode).render('error', {
            msg: err.message
        });
        // programming or unknown errors    
    } else {
        // log the error
        console.error('Error (:) ', err);
        // send generic msg
        // Rendered Website    
        res.status(err.statusCode).render('error', {
            msg: 'Please Try Again Later'
        })
    }


};

//error handling middle ware 
module.exports = (err, req, res, next) => {
    console.log('in errorrr' + process.env.NODE_ENV);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    if (process.env.NODE_ENV === 'development') {
        console.log('hiii', err);
        sendErrorForDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message =  err.message;
        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        // console.log('Hiiii',error.name,err.name,error);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJwtTokenError();
        sendErrorProd(error, req, res);
    }

};
