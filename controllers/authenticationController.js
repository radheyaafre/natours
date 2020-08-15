const {promisify} = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utilities/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utilities/AppError');
const Email = require('./../utilities/email');
const bcrypt = require('bcryptjs');
const { default: validator } = require('validator');
const { send } = require('process');
const APIFeatures = require('../utilities/apiFeatures');
const crypto = require('crypto');


const signToken = id =>{
    return jwt.sign({id: id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIERS_IN
    });
};

const createAndSendToken = (user, statusCode ,req, res) =>{
    const token = signToken(user._id);

    res.cookie('jwt',token , {
        expires: new Date (Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 *1000),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    //remove the password from output
    user.password = undefined;
    res.status(statusCode).json({
        status: 'Success',
        token,
        data:{
            user: user
        }
    }); 
}
exports.signup = catchAsync(async(req, res, next) =>{
    console.log('body',req.body);
    const newUser =await  User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    // console.log(url);
    await new Email(newUser,url).sendWelcome();
    createAndSendToken(newUser, 201,req, res); 
});

exports.login =  catchAsync(async (req, res, next) => {
    const {email, password} = req.body;
    // check if email and password exists
    if(!email || !password){
        return next(new AppError('Please provide email and password! ',400));
    }
    // check if user exists and pass is correct
    const user = await User.findOne({email}).select('+password');
    if(!user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Incorrect Credentials ! ',401));
    }

     //if everything Ok send a token 
     createAndSendToken(user, 200, req, res); 
});

exports.logout = (req, res) => {
    res.cookie('jwt','loggedOut',{
        expires: new Date(Date.now()*10*10000),
        httpOnly: true
    });
    res.status(200).json({status: 'success'});
}

exports.protect = catchAsync(async (req,res,next) => {

    // 1) get a token from client and check if its there 
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
         token =  req.headers.authorization.split(' ')[1];
    }else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    //console.log(token);
    if(!token) {
        return next(new AppError('You are not logged in..!',401)); 
    }
    // 2) validate the token
    const decoded=  await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // 3) user exists? 
    const freshUser = await User.findById(decoded.id);
    //const freshUserName =await User.findOne({name: decoded.name});
    //console.log('freshUserName',freshUserName);ß
    //console.log('freshUser',freshUser);
    if(!freshUser){
        return next(new AppError('User belonging to Token does no longer exists',401));
    }
    // 4) check if user changed password after jwt token was issued 
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(
            new AppError('User recently changed the password..plz login again !',401)
        );
    }

    // grant access to protected route
    req.user = freshUser;
    res.locals.user = freshUser;
    next();
});


// only for render pages , no errors
exports.isLoggedIn = async (req,res,next) => {
    if(req.cookies.jwt){

      try{
        // verify token
        const decoded=  await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
        // user exists? 
        const freshUser = await User.findById(decoded.id);
        if(!freshUser){
            return next();
        }
        //check if user changed password after jwt token was issued 
        if(freshUser.changedPasswordAfter(decoded.iat)){
            return next();
        }
        // there is a loggon in User
        res.locals.user = freshUser;
        return next();
      }catch(err){
          return next();
      }  
        
    }
    next();
};

exports.restrictTo = (... roles)=>{
    return (req, res, next) => {
        //roles is an array  [admin , guide]
        if(!roles.includes(req.user.role)){
            return next(new AppError('You dont have permission to access the order',403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync( async(req, res, next) => {
    // get user based on given email
    // console.log(req.body.email);
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('No user with that email',404));
    }
    //genertae a random token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    
    try{
        //send it to users email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'token send to email'
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});
        // console.log(err);
        return next(new AppError('There was error sending email. try again later', 500));
    }
    
});

exports.resetPassword = catchAsync (async(req, res, next) => {

    // console.log('REQUEST: ========', req);

    // console.log('==========REQUEST END============= ');
    // 1. get user based on token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user= await User.findOne({
            passwordResetToken:hashedToken , 
            passwordResetExpires: { $gt:Date.now() }  
        });
        if(!user){
            return next(new AppError('token is invalid or expire ',400));
        }
    // 2. set new password if token has not expire and there is user
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
    //3. set password

    //4. update changedPasswordAt property for current user
    //user.passwordChangedAt = Date.now();

    //5.log the user in send jwto to client
    createAndSendToken(user, 200, req, res); 
});

exports.updatePassword =catchAsync( async(req, res, next) =>{
    // 1. get user from the collection

    const user = await User.findById(req.user.id).select('+password');

    if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
        return next(new AppError('Password is wrong..!',401));
    }  
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createAndSendToken(user, 200, req, res); 

});