let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const dayjs = require('dayjs');
const getGenderDistribution = async (req, res) => {
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
        }

        else {
            year = (year.split("-")[0])
        }

        if (!year && !month) {
            year = (dayjs().year()).toString();
            month = (dayjs().month() + 1).toString().padStart(2, '0') // month is 0-indexed
        }

        let activeEmp = 0
        let inactiveEmp = 0

        const maleQuery = await db.query(
            `
            SELECT 
                a.id,a.employeeName,a.employeeGender,
                a.employeeDoj,a.status,a.inActiveDate,a.employeeLastWorkingDate,
            CASE 
                WHEN 
                (DATE_FORMAT(a.inActiveDate,'%Y-%m') = :yearMonth)
                                      OR
                 (DATE_FORMAT(a.employeeLastWorkingDate,'%Y-%m') = :yearMonth)
                   THEN 'Inactive'
                   ELSE 'Active'
                   END AS empStatus
               
            FROM 
                 eve_acc_employee AS a
            WHERE 
                 (a.status = 'A' OR a.status='I')
            AND a.employeeType = 'Blue Collar'
            AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
            AND (:departmentId IS NULL OR a.employeeDepartmentId = :departmentId)
            AND DATE_FORMAT(a.employeeDoj,'%Y-%m') <= :yearMonth
            AND (DATE_FORMAT(a.inActiveDate,'%Y-%m') >= :yearMonth OR a.inActiveDate IS NULL)
            AND (DATE_FORMAT(a.employeeLastWorkingDate,'%Y-%m') >= :yearMonth OR a.employeeLastWorkingDate IS NULL)
            AND a.employeeGender ='Male'
            ORDER BY a.employeeName

                `, {
            replacements:

            {
                subCompanyId: subCompanyId || null,
                departmentId: departmentId || null,
                yearMonth: `${year}-${month}`

            }, type: QueryTypes.SELECT
            
        })
       
     maleQuery.forEach(e => e.empStatus === 'Inactive' ? inactiveEmp++ : activeEmp++);


        const femaleQuery = await db.query(
            `
            
                SELECT a.id,a.employeeGender,a.employeeDoj,
                CASE
                    WHEN 
                    (DATE_FORMAT(a.inActiveDate,'%Y-%m') = :yearMonth)
                                     OR
                    (DATE_FORMAT(a.employeeLastWorkingDate,'%Y-%m') = :yearMonth)
                    THEN 'Inactive'
                    ELSE 'Active'
                    END AS empStatus

                FROM 
                eve_acc_employee AS a
                WHERE 
                (a.status = 'A' OR a.status='I')
                AND a.employeeType = 'Blue Collar'
                AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                AND (:departmentId IS NULL OR a.employeeDepartmentId = :departmentId)
                AND DATE_FORMAT(a.employeeDoj,'%Y-%m') <= :yearMonth
                AND (DATE_FORMAT(a.inActiveDate,'%Y-%m') >= :yearMonth OR a.inActiveDate IS NULL)
                AND (DATE_FORMAT(a.employeeLastWorkingDate,'%Y-%m') >= :yearMonth OR a.employeeLastWorkingDate IS NULL)  
                AND a.employeeGender ='Female'

                `, {
            replacements:
            {
                subCompanyId: subCompanyId || null,
                departmentId: departmentId || null,
                yearMonth: `${year}-${month}`
            }, type: QueryTypes.SELECT
        })
       femaleQuery.forEach(e => e.empStatus === 'Inactive' ? inactiveEmp++ : activeEmp++)

        let arr = [
            {
                "name": "Female",
                "value": femaleQuery.length
            },
            {
                "name": "Male",
                "value": maleQuery.length
            }
        ]

        return res.status(200).send({
            status: true,
            result: "success",
            activeEmp:activeEmp,
            inactiveEmp:inactiveEmp,
            data: arr,
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getGenderDistribution }

