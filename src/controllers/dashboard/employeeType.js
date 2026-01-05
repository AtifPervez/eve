
let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const dayjs = require('dayjs');
function getRandomColor() {
    return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

const getEmployeeType = async (req, res) => {
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

        if (!year && !month) {
            year = (dayjs().year()).toString();
            month = (dayjs().month() + 1).toString().padStart(2, '0') // month is 0-indexed
        }
       
        const sqlQuery = await db.query(
            `
            
                SELECT b.typeName as name, COUNT(*) AS value 
                FROM 
                eve_acc_employee AS a 
                LEFT JOIN eve_hrm_employee_type_master AS b ON (a.empTypeId = b.id)
                WHERE 
                (a.status = 'A' OR a.status='I')
                AND b.status = 'A'
                AND a.employeeType = 'Blue Collar'
                AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                AND (:departmentId IS NULL OR a.employeeDepartmentId = :departmentId)
                AND a.empTypeId IS NOT NULL
                AND a.empTypeId != ''
                
                AND DATE_FORMAT(a.employeeDoj,'%Y-%m') <= :yearMonth
                AND (DATE_FORMAT(a.inActiveDate,'%Y-%m') >= :yearMonth OR a.inActiveDate IS NULL)
                AND (DATE_FORMAT(a.employeeLastWorkingDate,'%Y-%m') >= :yearMonth OR a.employeeLastWorkingDate IS NULL)

                          
                   GROUP BY 
                   b.typeName;

             
              
                `
            , {
                replacements:
                {
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                    yearMonth: `${year}-${month}`
                }, type: QueryTypes.SELECT
            })

        const colorMap = {
            "Bench": "#f95656",
            "Contractual": "#ffce74",
            "Permanent": "#93c595",
        };


        const updatedData = Object.entries(colorMap).map(([typeName, color]) => {

            const match = sqlQuery.find(item => item.name === typeName);

            return {
                name: typeName,
                value: match ? match.value : 0,
                fill: color ? color : getRandomColor(),
            };
        });
        let activeEmp = 0
        let inactiveEmp = 0
        const statusQuery = await db.query(
            `
              SELECT a.id,a.inActiveDate,a.employeelastWorkingDate,
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
                LEFT JOIN eve_hrm_employee_type_master AS b ON (a.empTypeId = b.id)
                WHERE 
                (a.status = 'A' OR a.status='I')
                AND b.status = 'A'
                AND a.employeeType = 'Blue Collar'
                AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                AND (:departmentId IS NULL OR a.employeeDepartmentId = :departmentId)
                AND a.empTypeId IS NOT NULL
                AND a.empTypeId != ''
                
                AND DATE_FORMAT(a.employeeDoj,'%Y-%m') <= :yearMonth
                AND (DATE_FORMAT(a.inActiveDate,'%Y-%m') >= :yearMonth OR a.inActiveDate IS NULL)
                AND (DATE_FORMAT(a.employeeLastWorkingDate,'%Y-%m') >= :yearMonth OR a.employeeLastWorkingDate IS NULL)

                          
                   ORDER BY a.employeeName
                  
            `    , {
            replacements:
            {
                subCompanyId: subCompanyId || null,
                departmentId: departmentId || null,
                yearMonth: `${year}-${month}`
            }, type: QueryTypes.SELECT
        })
          statusQuery.forEach(e => e.empStatus === 'Inactive' ? inactiveEmp++ : activeEmp++);
        
        return res.status(200).send({
            status: true,
            result: "success",
            activeEmp:activeEmp,
            inactiveEmp:inactiveEmp,
            totalData: sqlQuery.length,
            data: updatedData,

        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getEmployeeType }


