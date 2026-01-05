const express = require('express')
const cors = require('cors')
const cookieParser = require("cookie-parser")
// require('dotenv').config()
const app = express()
// const corsOptions = {
//     origin: (origin, callback) => {
//         const allowedOrigins = [
//             'https://hrm.eveserver.ind.in',
//             'https://www.eveserver.ind.in',
//             'https://www.ntest.eveserver.ind.in',   // ← Add your backend if needed for testing
//             'http://localhost:3000',
//             'http://127.0.0.1:3000',
//         ];
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, origin);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Cross-Auth', 'Cookie'],
//     credentials: true,
//     optionsSuccessStatus: 200 // Some legacy browsers choke on 204
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Optional but safe


// app.use(cors())
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


// let a='WlhsS2FtSXlNWGRaVnpVMVUxZFJhVTlwU1hwTmFrRnBURU5LTVdNeVZubFRWMUZwVDJsSk0wMUVUV2xNUTBwcFkyMUdkVmt5YUVwYVEwazJTV3BGTlU1NVNYTkpiVEZvWVZjMVZtTXlWbmxUVjFGcFQybEplVTU2WXpSUFUwbHpTVzVDYzFsWVVtMWlNMHAwU1dwdmFXUXlWbWxKYVhkcFlrYzVibUZYTlZSa1IwWXdaRmhOYVU5cFNqQmpibFpzU1c0d1BRPT0='
// let headerSession = Buffer.from(Buffer.from(Buffer.from(a, 'base64').toString('ascii'), 'base64').toString('ascii'), 'base64').toString('ascii');
// console.log(headerSession);












