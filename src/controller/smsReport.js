let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))
const phpUnserialize = require('php-serialize');
const moment = require('moment');
const { parse } = require('dotenv');

const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if (branchName[0]) {
        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
}

const getSmsReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME} = data
        let db = sequelize(DB_NAME)

        let getData = await db.query('select sendMobileNo,subject,message,createdDate,createdByBranch as branchName from eve_hrm_sms_history where status="A" order by createdDate desc', {
            type: QueryTypes.SELECT
        })

        await Promise.all(getData.map(async (e, i) => {
            e.branchName = await getBranchNameByBranchId(e.branchName, db)
            e.subject = e.subject === null ? '' : e.subject
            e.message = e.message === null ? '' : e.message
        }))
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);

        return res.status(200).send({ 
            status: true, 
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: getData.length, 
            smsHistoryList: paginatedData 
        })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getSmsReport }