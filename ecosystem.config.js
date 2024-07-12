module.exports = {
  apps : [{
    script: './app.js',
    watch: '.',
    env:{
      PORT:3000,
      DB_HOST:"localhost",
      DB_PORT:27017,
      DB_NAME:"Job",
     
    }
  }
],

};
