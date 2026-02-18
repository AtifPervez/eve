const express = require('express')
const cors = require('cors')
const cookieParser = require("cookie-parser")
// require('dotenv').config()
const app = express()



app.use(cors())
//----- Your other middlewares and route handlers ----- //

app.use(cookieParser());
app.use(express.json())

app.use(express.urlencoded({ extended: true }));

const router = require('./router/route')
app.use('/', router)



//-- listen PORT section --//
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`express app is running on ${PORT}`)

})















