// require('dotenv').config()
// const Sequelize = require('sequelize')


// const sequelize = (DB_NAME) => {
    
//     const newDbCompanyArr = [354,105,398,399,400,401,402,403,404,405,406,408,409,410,411,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466];

//     //----eveservergen----//
//     if (newDbCompanyArr.includes(parseInt(DB_NAME))) {

//         DB_NAME="eveservergen_cpanel_"+DB_NAME ;

//         return new Sequelize(DB_NAME , process.env.DB_GEN_SERVER_USER , process.env.DB_GEN_SERVER_PASSWORD , {
//             dialect: process.env.DB_TYPE,
//             host: process.env.DB_GEN_SERVER_HOST,
//             logging: false
//         });
        
        
//     }
//     //----eve24hrs----//
//     else{

//         if(Number(DB_NAME) && (DB_NAME) && DB_NAME.trim() != ""){
//             DB_NAME="eve24hrs_cpanel_"+DB_NAME
//         }
//         else{
//             DB_NAME="eve24hrs_main"
//         }

//         return new Sequelize(
//             (DB_NAME ),
//             process.env.DB_USER,
//             process.env.DB_PASSWORD, 
//             {
//                 dialect: process.env.DB_TYPE,
//                 host: process.env.DB_HOST,
//                 logging: false
//             }
//         );

//     }
    
// }
// module.exports = sequelize;

require('dotenv').config()
const Sequelize = require('sequelize')


const sequelize = (DB_NAME) => {
    if (Number(DB_NAME) && (DB_NAME) && DB_NAME.trim() != "") {

        // DB_NAME = "eveserverind_cpanel_" + DB_NAME
        DB_NAME = "eve24hrs_cpanel_" + DB_NAME


    }
    else {
        // DB_NAME = "eveserverind_main"
        DB_NAME = "eve24hrs_main"
    }
    return new Sequelize(

        (DB_NAME|| process.env.DB_NAME),
        process.env.DB_USER,
        process.env.DB_PASSWORD
        , 
        {

        dialect: process.env.DB_TYPE,
        // host: process.env.HOST_NAME,
        host: process.env.DB_HOST,
        logging: false
    }
    )
}
module.exports = sequelize;






