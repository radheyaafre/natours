const mongoose= require('mongoose');
const slugify= require('slugify');
const validator = require('validator');


//describe the schema
const tourSchema= new mongoose.Schema({
    name: {
        type: String,
        required:[true,'A tour nust have a Name'],
        unique:true,
        trim: true,
        maxlength: [40, ' A tour name must have less or equal 40 chars'],
        minlength: [10, 'A tour name must have more equal 10 chars']
        // validate: [validator.isAlpha, 'Tour name must only contain CHars']
    },
    slug: String,
    duration:{
        type: Number,
        required: [true, 'A tour must have a Duration']
    },
    maxGroupSize:{
        type: Number,
        required:[true,'Must have a tour size']
    },
    difficulty:{
        type: String,
        required:[true,'Must have a tour difficulty'],
        enum: {
            values: ['easy','medium','difficult'],
            message: 'Invalid difficulty level  easy,medium,difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default:4.5,
        min: [1,'The rating must be above 0'],
        max: [5,'Rating must be below 5'],
        set: val => Math.round(val * 10)/ 10
    },
    ratingsQuantity:{
        type:Number,
        default: 0
    },
    price: {
        type: Number,
        required:[true,'A tour must have a price']
    },
    priceDiscount:{
        type: Number,
        // this only points to current doc on New document creation
        validate: {
            validator: function(val){
                return val< this.price;
            },
            message: 'Discount should ({VALUE}) be less than price'
        }
        
    },
    summary:{
        type: String,
        trim: true // removes all while spaces in the beginning and end
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A true must have cover image']
    },
    images: [String], // array of string
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },

    startDates: [Date],
    secreteTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        //GeoJson

        type:{
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
             address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
    
});


tourSchema.index({
    price: 1,
    ratingsAverage: -1// 1 soritig price index in asc else -1 -> desc
});

tourSchema.index({ startLocation: '2dsphere' });

tourSchema.index({slug: 1});

tourSchema.virtual('durationWeeks').get(function(){ // not a callBack Function becasue we wnte to use this
    return this.duration/7;
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
  });

// document middleware runs before save() command and create() command not insertMany()
tourSchema.pre('save',function(){
   // console.log(this); // this points to currently process document
   this.slug= slugify(this.name,{lower: true});
   next(); // for only 1 middleware not require
});

// embedding users into tour
/*tourSchema.pre('save', async function(next){
    const guidespromices = this.guides.map(async id => await User.findById(id));
    this.guides = await Promise.all(guidespromices);
    next();
});*/
/*
tourSchema.pre('save',function(){
   console.log('Doc will be saved..!');
   next();
 });

//exceuted after all pre middlewares
tourSchema.post('save',function(doc,next){
    console.log(doc);
    next();
});
*/

//QUERY Middleware
//tourSchema.pre('find',function(next){
tourSchema.pre(/^find/,function(next){ // all strings that wharts with find -> ex: findOne
    this.Start= Date.now();
    this.find({secreteTour: {$ne: true}});
    next();
}); 

tourSchema.pre(/^find/,function(next){
    console.log('in pre of tour');
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

tourSchema.post(/^find/,function(docs,next){ // all strings that wharts with find -> ex: findOne
    console.log(`Query took ${Date.now() - this.Start} milliSeconds`);
    //console.log(docs);
    next();
}); 



// Agreegation Middleware

/*tourSchema.pre('aggregate',function(next){
    this.pipeline().unshift({
        $match: {secreteTour:{$ne: true}}});
        console.log(this.pipeline());
    next();
});*/

const Tour = mongoose.model('Tour',tourSchema);
module.exports = Tour;