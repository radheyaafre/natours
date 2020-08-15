
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/AppError');
const APIFeatures = require('./../utilities/apiFeatures');

exports.deleteOne = Model => catchAsync(async(req,res,next)=>{
    const doc = await Model.findByIdAndDelete(req.params.id);
    if(!doc){
        return next(new AppError('No document Found with that Id',404));
    }
    res.status(204).json({
        status:'Success',
        data:{
            tour: null
        }
    });
});


exports.updateOne = Model => catchAsync(async (req,res,next)=>{
    // console.log(req.params.id);
    // console.log(req.body,'req.body')
    const doc = await Model.findByIdAndUpdate(req.params.id,req.body,{
        new: true,
        runValidators: true
    });
    if(!doc){
        return next(new AppError('No document Found with that Id',404));
    }
    //console.log(Model);
    res.status(200).json({
        status:'Success',
        data:{
            data: doc
        }
    });

});

exports.createOne = Model => catchAsync (async (req,res,next)=>{
    const doc = await Model.create(req.body);
    doc.save();
          res.status(201).json({
              status: 'Success',
              data: {
                  data: doc
              }
          });
  });

exports.getOne = (Model, popOptions) => catchAsync( async (req,res,next)=>{
        let query =  Model.findById(req.params.id);
        if(popOptions) query = query.populate(popOptions);
        const doc = await query;
        if(!doc){
            return next(new AppError('No doc Found with that Id',404));
        }
        res.status(200).json({
            status: 'Success',
            data: {
                data: doc
            }
        });    
});

exports.getAll = (Model) => catchAsync(async (req, res,next) => {

    // to allow nested getReviews on tour (small hack)
    let filter ={};
        if(req.params.tourId) filter={ tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter),req.query)
        .filter()
        .sort()
        .limitFields()
        .paginates();

    //const docs=await features.query.explain(); // explains the query plan 
    const docs=await features.query;
    res.status(200).json({
        status: 'Success',
        results: docs.length,
        data: {
            data: docs
        }
    });
});