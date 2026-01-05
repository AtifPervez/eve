let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const jwt = require('jsonwebtoken')
const atob = require('atob')
require('dotenv').config()

// https://www.eveserver.ind.in/eve/mode/candidate-model/getAllEmployeeListOnlyForSearch

const empListCommonDropDownController = async (req, res) => {
    try {
        let token = req.headers["x-auth-token"]

        if (!token) {
            return res.status(400).send({ status: false, msg: 'token must be present' })
        }

        let decodedToken = atob(atob(atob(token)))

        let orgToken = (atob(atob(atob(process.env.TOKEN_NAME))));

        if (decodedToken != orgToken) {
            return res.status(401).send({ status: false, msg: 'token is invalid' })
        }

        let DB_NAME = req.headers['db']
        if (!DB_NAME) {
            return res.status(400).send({ status: false, msg: 'please enter db name' })
        }

        let data = req.query
        let { page, limit } = data
        limit = limit || 100



        let getData = await sequelize(DB_NAME).query('select eve_acc_employee.id,eve_acc_employee.employeeName,eve_acc_employee.employeeMobile  from eve_acc_employee limit :limit offset :offset',
            {
                replacements:
                {
                    limit: +limit || 1000, offset: (100 * ((page || 1) - 1)),
                },
                type: QueryTypes.SELECT
            })

        for (let i = 0; i < getData.length; i++) {

            Object.values(getData[0].employeeName).join('')
        }

        return res.status(200).send({
            msg: "login successfully",
            recordedPerPage: limit || 100, totalData: getData.length, currentPage: page,
            employee: getData
        })
    }

    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

const getAllEmployeeListOnlyForSearch = async (req, res) => {


    try {
        let token = req.headers["x-cross-auth"]

        if (!token) {
            return res.status(400).send({ status: false, msg: 'token must be present' })
        }
        // let obj = {
        //     companyId: "59", userId: "29", branchId: "1", loginStatus: "true"
        // }

        // "companyId":"59","userId":"29","branchId":"1","loginStatus":"true"
        
        let tokenValue = (atob(atob(atob(process.env.TOKEN_NAME))));

        let decodedToken = (atob(atob(atob(token))))
        // console.log(decodedToken);
        let getData

        if (tokenValue == decodedToken) {

            getData = await sequelize(59).query('select id,employeeName,employeeMobile from eve_acc_employee', { replacements: {}, type: QueryTypes.SELECT })

            getData = getData.map((value, i) => {
                value.empStr = `${getData[i].employeeName}(${getData[i].employeeMobile})`
                return value
            })
        }
        else {
            // getData = await sequelize("eveserverind_cpanel_main").query('select id,name,mobile from eve_main_employee_master', { replacements: {}, type: QueryTypes.SELECT })

            // getData = getData.map((value, i) => {
            //     value.empStr = `${getData[i].name}(${getData[i].mobile})`
            //     return value
            // })
            res.status(400).send({ status: false, msg: 'invalid token' })
        }
        let temp = await sequelize(59).query('select * from eve_acc_employee', { type: QueryTypes.SELECT })
        
        res.status(200).send({ status: true, employees: getData })
        
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { empListCommonDropDownController, getAllEmployeeListOnlyForSearch }

