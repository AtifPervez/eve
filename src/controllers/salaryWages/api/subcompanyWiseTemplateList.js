let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const getSubcompanyWiseTemplateList = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { year, month, api, empId, subCompanyId } = data

      

        let getData = await db.query(`
            SELECT DISTINCT
              a.id,
              a.templateName,
              b.subCompanyId,
              a.templateType
            FROM eve_blue_company_salary_components as a
             left join eve_acc_blue_company_salary_temp_details as b on a.id = b.templateId
            WHERE a.status='A'
            and (:subCompanyId is null or b.subCompanyId = :subCompanyId)
            and b.subCompanyId IS not NULL
            -- and a.templateType='CTC'
          and  a.wageSetting='monthly'
          
        `, {
            replacements: {
                subCompanyId: subCompanyId || null
            },
            type: QueryTypes.SELECT
        })

        if (!getData || getData.length === 0) {
            return res.status(404).send({ status: false, msg: 'No data found' })
        }
        await Promise.all(getData.map(async e => {
        //         const sql =await db.query(
        //             `
        //                      select
        //                      a.subCompanyId
        //                      from eve_acc_blue_company_salary_temp_details as a
        //                      where a.templateId = :id
        //                      and a.status = 'A'
                           
        //             `,
        //             {
        //                 replacements: {
        //                     id: e.id
        //                 },
        //                 type: QueryTypes.SELECT
        //             }
        //         )
        //         e.subCompanyId = sql && sql.length > 0 ? sql[0].subCompanyId : null
              e.subCompanyName = await myFunc.getSubCompanyNameById(e.subCompanyId, db)
                
        }))

        return res.status(200).send({ status: true,total: getData.length, data: getData })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getSubcompanyWiseTemplateList }