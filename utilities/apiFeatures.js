class APIFeatures {
    constructor(query,queryString){
        this.query=query;
        this.queryString=queryString;
    }

    filter()
    {
        const queryObj={...this.queryString}; // creates new objects instead of creating just a refernece
        const excludeFields=['page','sort','limit','fields'];
        excludeFields.forEach(el=> delete queryObj[el]);
            // advanced filtering
        let queryStr= JSON.stringify(queryObj);
        console.log(JSON.parse(queryStr));
        queryStr=queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        console.log(JSON.parse(queryStr));
          
          // { duration: { gte: '3' } } //from req.query (127.0.0.1:3000/api/v1/tours?duration[gte]=3)
          // { duration: { $gte: '3' } } //needed
          //gte,gt,lte,lt
        this.query= this.query.find(JSON.parse(queryStr));
        console.log('filter finish');
        return this; 
    }

    sort()
    {
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');  // 
            console.log(sortBy);
            this.query = this.query.sort(sortBy)
            //127.0.0.1:3000/api/v1/tours?sort=-price,ratingsAverage
            //in req.query.sort { sort: '-price, ratingsAverage' } // so to remove comma we used join
            // in case of tie in mongooes : { sort: '-price ratingsAverage' }
            //127.0.0.1:3000/api/v1/tours?sort=-price,ratingsAverage
          }else{
            this.query = this.query.sort('-createdAt');
          }
          console.log('sort finish');
          return this;
    }
    limitFields()
    {
        if(this.queryString.fields){
            const fields= this.queryString.fields.split(',').join(' ');
            this.query=this.query.select(fields);
        }else{
            this.query=this.query.select('-__v');
        }
        console.log('limitFields finish');
        return this;
    }
    paginates()
    {
        const page =this.queryString.page * 1 || 1; // to convert into number we did *1  and by default we want 1
          const limit = this.queryString.limit *1 || 100; 
          const skip= limit * (page-1);
          this.query = this.query.skip(skip).limit(limit);
          console.log('limitFields finish');
          return this;
    }
}

module.exports = APIFeatures;