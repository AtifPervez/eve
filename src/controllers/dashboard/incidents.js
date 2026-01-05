let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const getIncidents = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { departmentId, subCompanyId, year, month } = data

        if (month <= 3) {

            year = year.split("-")[1];
        } else {
            year = (year.split("-")[0])
        }
  
        let incident = await db.query(
            `
                                          SELECT 
                                          id,
                                          categoryName AS type 
                                          FROM eve_acc_incident_category_master 
                                          WHERE status="A"
                                          ORDER BY categoryName ASC
            
            `, {

            type: QueryTypes.SELECT
        })

        // let getData = await db.query(
        //     `
        //                    SELECT 
        //                    YEAR(a.incidentDateTime) as year,
        //                    MONTH(a.incidentDateTime) as month,
        //                    a.EmployeeName AS employeeId,
        //                    a.IncidentCategoryId ,
        //                    b.employeeName,
        //                    a.modifiedBy,
        //                    c.categoryName
        //                    FROM eve_incident_report AS a
        //                    LEFT JOIN eve_acc_employee AS b ON a.EmployeeName = b.id 
        //                    LEFT JOIN eve_acc_incident_category_master AS c ON a.IncidentCategoryId = c.id                   
        //                    WHERE a.status="A" AND IncidentCategoryId IS NOT NULL
        //                    -- AND YEAR(a.incidentDateTime) = :year
        //                    -- AND MONTH(a.incidentDateTime) = :month
        //                    -- AND b.employeeName IS NOT NULL
        //                    -- AND a.modifiedBy IS NOT NULL
        //                    AND b.employeeType='Blue Collar'
        //                    ORDER BY b.employeeName ASC

        //     `, {
        //     replacements: {
        //         year: (year),
        //         month: (month),
              
        //     }, type: QueryTypes.SELECT
        // })

        await Promise.all(incident.map(async (e) => {
            let getData = await db.query(
                `
                           SELECT COUNT(*) as totalCount
                          
                           FROM eve_incident_report AS a
                           LEFT JOIN eve_acc_employee AS b ON a.EmployeeName = b.id 
                          
                           
                           WHERE a.status="A"
                           AND a.IncidentCategoryId = :id
                           AND YEAR(a.incidentDateTime) = :year
                           AND MONTH(a.incidentDateTime) = :month
                          
                           AND b.employeeType='Blue Collar'
                           AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
                          
            `, {
                replacements: {

                    year: year,
                    month: month,
                    id: e.id,
                    subCompanyId: subCompanyId || null,

                }, type: QueryTypes.SELECT
            })

            e.incidents = getData[0].totalCount

        }))

        return res.status(200).send({
            status: true,
            totalData: incident.length,
            data: incident,
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getIncidents }

