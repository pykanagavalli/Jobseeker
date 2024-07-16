const mongoose = require("mongoose")

var dbconnect=() => {
    mongoose.connect(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)
    .then(() =>{
        console.log("Db connect success")
    }).catch((err) =>{
       console.log('Db connection err'); 
    })
    return dbconnect
}

module.exports=dbconnect()