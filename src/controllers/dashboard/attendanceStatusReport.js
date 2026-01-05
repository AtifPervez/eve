let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../functions/functions')
const dayjs = require('dayjs');
const getAttendanceStatusReport = async (req, res) => {

    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()
        let data = req.body
        let { year, month, subCompanyId } = data

            if (month <= 3) {

                year = year.split("-")[1];
            } else {
                year = (year.split("-")[0])
            }
        
        if (!year && !month) {
            year = (dayjs().year()).toString();
            month = (dayjs().month() + 1).toString().padStart(2, '0') // month is 0-indexed
        }


        const daysInCurrentMonth = myFunc.getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)
        const app = [];
        for (let i = 1; i <= NoOfdaysInMonth; i++) {
            let number = i.toString().padStart(2, '0');
            let newObj = {
                crtDate: `${year}-${month}-${number}`,
                day: i,
                type: '',
                presentCount: 0
            }

            app.push(newObj);

        }
        const sqlEmp = await db.query(
            ` SELECT id ,employeeName
              FROM 
              eve_acc_employee AS a
              WHERE 
              a.status = 'A'
              AND a.employeeType = 'Blue Collar'
           
              AND (:subCompanyId IS NULL OR a.employeeSubCompanyId = :subCompanyId)
                 AND (
                             a.employeeCurrentStatus = '' 
                             OR a.employeeCurrentStatus IS NULL 
                             OR a.employeeCurrentStatus = 'Active'
                             OR a.employeeCurrentStatus = 'resignation' 
                             OR a.employeeCurrentStatus = 'joining'
                             OR a.employeeCurrentStatus = 'termination'
                             OR a.employeeCurrentStatus = 'release' 
                             OR a.employeeCurrentStatus = 'offerletter'
                         )
                               AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
                           AND (DATE_FORMAT(a.employeeLastWorkingDate, "%Y-%m") >= :yearMonth OR a.employeeLastWorkingDate IS NULL )
              ORDER BY a.employeeName ASC

            `,
            {
                replacements: { yearMonth: year + '-' + month, subCompanyId: subCompanyId || null }, type: QueryTypes.SELECT
            }
        )
       
        let empCount = sqlEmp.length;  
       if (empCount === 0) {
            return res.status(200).send({
                status: true,
                result: "success",
                totalData: app.length,
                employee: app,
            });
        }
        
        let arr = []

        sqlEmp.forEach(e => arr.push(e.id))
        

        await Promise.all(app.map((async e => {

            let empAttendanceApproved = await db.query(
                `           SELECT 
                            a.type,a.date,a.employeeId,b.employeeName
                               FROM 
                                 eve_acc_employee_attendence_approved AS a
                                 left join eve_acc_employee AS b on a.employeeId = b.id
                                 WHERE 

                               a.status = 'A'
                               and b.employeeType = 'Blue Collar'
                                AND a.date = :crtDate
                                and b.employeeDoj <= :crtDate

                             AND (
                             a.type IN ('full', 'half','actualWokrHrs','ideal') 
                             OR                                          
                             a.remarks IN ('L LEAVE')
                             OR
                             (a.type='reject' AND a.remarks!='AB LEAVE' AND a.remarks!='First Half' AND a.remarks!='Second Half' )
                             )
                             
                             AND a.employeeId IN (${arr.join(',')})
                               
                            `,
                {
                    replacements: {
                        year, month,
                        crtDate: e.crtDate,
                       
                    }, type: QueryTypes.SELECT
                }
            )
          
            
        

            if (empAttendanceApproved.length === empCount) {
                e.type = 'Approved';
                e.presentCount = empAttendanceApproved.length;
            }
            else if (empAttendanceApproved.length == 0) {
                e.type = 'Pending';

            }
            else if (empAttendanceApproved.length < empCount) {
                e.type = 'Partially Approved';
                e.presentCount = empAttendanceApproved.length;
            }

        })))

        res.status(200).send({
            status: true,
            result: "success",
            totalData: app.length,
            // employee: sqlEmp,
            employee: app,


        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getAttendanceStatusReport }