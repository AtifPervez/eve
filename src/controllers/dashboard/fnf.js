let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const getFnf = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { departmentId, subCompanyId, year, month } = data
        let financialYearStart = year.split("-")[0];
        let financialYearEnd = (year.split("-")[1])

        let fnfData = await db.query(
            `
                
                           SELECT a.empId,
                           a.total_amount,
                           a.finalDoneStatus,
                           a.finalDoneDate,
                           a.amount_paid_status,
           YEAR(
    CASE 
      WHEN a.finalDoneDate LIKE '__-__-____%' THEN STR_TO_DATE(a.finalDoneDate, '%d-%m-%Y %H:%i:%s')
      ELSE STR_TO_DATE(a.finalDoneDate, '%Y-%m-%d %H:%i:%s')
    END
  ) AS year,
  MONTH(
    CASE 
      WHEN a.finalDoneDate LIKE '__-__-____%' THEN STR_TO_DATE(a.finalDoneDate, '%d-%m-%Y %H:%i:%s')
      ELSE STR_TO_DATE(a.finalDoneDate, '%Y-%m-%d %H:%i:%s')
    END
  ) AS month
             
                           FROM eve_final_settlement_all_values AS a
                           LEFT JOIN eve_acc_employee AS b ON a.empId = b.id 
                           WHERE a.status="A"
                           AND a.finalDoneDate IS NOT NULL
                           AND a.finalDoneDate != ''
                           -- AND b.employeeType='Blue Collar'
                           AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
                           -- AND YEAR(a.finalDoneDate)= :year
                           -- AND MONTH(a.finalDoneDate)= :month
                                  
            `, {
            replacements: {

                year: year,
                subCompanyId: subCompanyId || null,

            }, type: QueryTypes.SELECT
        })
        const months = [
            ["04", "Apr", financialYearStart], ["05", "May", financialYearStart], ["06", "Jun", financialYearStart], ["07", "Jul", financialYearStart], ["08", "Aug", financialYearStart], ["09", "Sep", financialYearStart],
            ["10", "Oct", financialYearStart], ["11", "Nov", financialYearStart], ["12", "Dec", financialYearStart], ["01", "Jan", financialYearEnd], ["02", "Feb", financialYearEnd], ["03", "Mar", financialYearEnd]
        ];

        const arr = months.map(([num, month, year]) => ({
            num,
            month,
            year,
            paid: '00:00',
            unpaid: '00:00',
            onHold: '00:00',

        }));

        await Promise.all(arr.map(async (e) => {

            const fnfData = await db.query(
        `
                 SELECT 
                 a.empId,
                 a.total_amount,
                 a.finalDoneStatus,
                 a.finalDoneDate,
                 amount_paid_status,
            YEAR(
                 CASE 
                 WHEN a.finalDoneDate LIKE '__-__-____%' THEN STR_TO_DATE(a.finalDoneDate, '%d-%m-%Y %H:%i:%s')
                 ELSE STR_TO_DATE(a.finalDoneDate, '%Y-%m-%d %H:%i:%s')
                 END
                ) AS year,

            MONTH(
            CASE 
            WHEN a.finalDoneDate LIKE '__-__-____%' THEN STR_TO_DATE(a.finalDoneDate, '%d-%m-%Y %H:%i:%s')
            ELSE STR_TO_DATE(a.finalDoneDate, '%Y-%m-%d %H:%i:%s')
            END
            ) AS month

            FROM eve_final_settlement_all_values AS a
            LEFT JOIN eve_acc_employee AS b ON a.empId = b.id

            WHERE a.status = "A"
            AND a.finalDoneDate IS NOT NULL
            AND a.finalDoneDate != ''
            AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
            AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)
            AND b.employeeType='Blue Collar'

            AND YEAR(
                     CASE 
            WHEN a.finalDoneDate LIKE '__-__-____%' THEN STR_TO_DATE(a.finalDoneDate, '%d-%m-%Y %H:%i:%s')
            ELSE STR_TO_DATE(a.finalDoneDate, '%Y-%m-%d %H:%i:%s')
            END
             ) = :year
            AND MONTH(
            CASE 
            WHEN a.finalDoneDate LIKE '__-__-____%' THEN STR_TO_DATE(a.finalDoneDate, '%d-%m-%Y %H:%i:%s')
            ELSE STR_TO_DATE(a.finalDoneDate, '%Y-%m-%d %H:%i:%s')
            END
            ) = :month
        `,
                {
                    replacements: { 
                        year: parseInt(e.year), 
                        month: parseInt(e.num), 
                        subCompanyId: subCompanyId || null, 
                        departmentId: departmentId || null, 
                    }, type: QueryTypes.SELECT,
                })
              
                

            if (fnfData.length > 0) {
                // if (fnfData[0].finalDoneStatus === '1') {
                //     e.paid = fnfData[0].total_amount;
                // }
                // else if (fnfData[0].finalDoneStatus === '2') {
                //     e.unpaid = fnfData[0].total_amount;
                // }
                // else if (fnfData[0].finalDoneStatus === '3') {
                //     e.onHold = fnfData[0].total_amount;
                // }
                if (fnfData[0].amount_paid_status === 'paid') {
                    e.paid = fnfData[0].total_amount;
                }   
                else if (fnfData[0].amount_paid_status === null) {
                    e.unpaid = fnfData[0].total_amount;
                }
            }

        }))
        return res.status(200).send({
            status: true,
            totalData: arr.length,
            data: arr,
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getFnf }

