let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const getWagesReportsListing = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        const db = sequelize(tokenCompanyId)
        const db1 = sequelize()
        let data = req.body
        let { type } = data
           let searchType = type ? `%${type.trim().toLowerCase()}%` : null


        let countQuery = `SELECT COUNT(*) 
                          as totalCount FROM eve_blue_all_report_download_log 
                          WHERE status='A'   
                     AND (:type IS NULL OR LOWER(type) LIKE :type)
                     AND DATE_FORMAT(expiryDate, '%Y-%m-%d') > DATE_FORMAT(CURDATE(), '%Y-%m-%d')`
                     

        let countResult = await db.query(countQuery, {
            replacements: {

                type: searchType
            },
            type: QueryTypes.SELECT
        })
        let totalData = countResult[0].totalCount
        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;


        let sqlListing = await db.query(
            `
            SELECT * FROM eve_blue_all_report_download_log 
            WHERE status='A'
            AND (:type IS NULL OR LOWER(type) LIKE :type)
            AND DATE_FORMAT(expiryDate, '%Y-%m-%d') > DATE_FORMAT(CURDATE(), '%Y-%m-%d')
            ORDER BY createdDate DESC    
            LIMIT :limit
            OFFSET :offset       
            `, {
            replacements: {
                limit: limit,
                offset: offset,
                type:searchType
            },

            type: QueryTypes.SELECT
        })

        res.status(200).send({
            status: true,
            message: 'success',
            recordedPerPage: limit,
            currentPage: pageNo, totalData: totalData, data: sqlListing
        })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports = {
    getWagesReportsListing
}

