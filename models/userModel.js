const mongoose=   require ('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
//name , emaail, photo , passwords, pasword Confirm

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required:[true,'A user nust have a Name'],
        trim: true,
    },

    email : {
        type: String,
        required:[true,'A user nust have an email'],
        unique: true,
        lowercase: true,
        validate : [validator.isEmail, 'Please provide a valid email']
    },
    photo : {
        type: String,
        default: 'default.jpg'
    },
    role :{
        type: String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password :{
        type: String,
        required:[true,'Please provide password'],
        minlength:8,
        select: false
    },
    passwordChangedAt: Date,
    passwordConfirm :
    {
        type: String,
        required:[true,'Please provide same password'],
        minlength:8,
        validate : {
            // only works on create and save()!!
            validator: function(el){
                return el ===this.password; //abc===abc
            },
            message: 'Passwords must be same'
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

 userSchema.pre('save', async function(next){
    // run only if pass is modified
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,12);
    this.passwordConfirm =  undefined; //needed just for validation but not in db so make it underfined 
                                        // after validation sucesfull
    next();

});

userSchema.pre('save', function(next){
    // if password is not modified or doc is new then dont do anything
    if(!this.isModified('password') || this.isNew) return next(); 
    // else change passwordChangedAt
    this.passwordChangedAt = Date.now() - 1000; //-1000 because to handle the senario where
    //passwordChangedAt may take time over generating the new token
    next();
}); 

userSchema.pre(/^find/, function(next){
    this.find({active: {$ne: false}});
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    // this.password  is not availabe as we have password select: false hence userPassword as a param
    return await bcrypt.compare(candidatePassword,userPassword);
};
userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        console.log(changedTimeStamp,JWTTimeStamp);
        return JWTTimeStamp < changedTimeStamp;
    }
    
    return false; // means not changed  -> 
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({resetToken},this.passwordResetToken)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};
const User = mongoose.model('User',userSchema);
module.exports = User;
