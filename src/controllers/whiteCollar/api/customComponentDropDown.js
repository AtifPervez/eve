let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize')

const getCustomComponentDropDown = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { componentId } = data


        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_custom_salary_componnet AS a
            WHERE a.status='A'       
            AND (:id IS NULL OR a.id=:id)     
`, {
            replacements: {

                id: componentId || null,
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
    
             SELECT id,componentName
             FROM eve_custom_salary_componnet AS a
             WHERE a.status='A' 
             AND (:id IS NULL OR a.id=:id)
             
             ORDER BY a.componentName               
             LIMIT :limit
             OFFSET :offset  

            `, {
            replacements: {
                limit: limit,
                offset: offset,
                id: componentId || null,

            },
            type: QueryTypes.SELECT
        })


        return res.status(200).send({
            result: 'success',
            recordPerPage: limit,
            currentPage: pageNo,
            totalData: totalData,
            data: getData

        })


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getCustomComponentDropDown }

