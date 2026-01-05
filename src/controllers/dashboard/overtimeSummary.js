let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const dayjs = require('dayjs');
const myFunc = require('../../functions/functions')
const getOvertimeSummary = async (req, res) => {

    try {

        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId

        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { departmentId, subCompanyId, year, month, api } = data

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
        const daysInCurrentMonth = myFunc.getDaysInMonth(year, month);

        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)
        const app = [];

        for (let i = 1; i <= NoOfdaysInMonth; i++) {
            let number = i.toString().padStart(2, '0');
            let newObj = {
                crtDate: `${year}-${month}-${number}`,
                "day": i,
                'totalOvertimeHours': 0,
                'approved': 0,
                'rejected': 0,
                'editOThrs': 0,
                'workingHrs': 0
            }


            app.push(newObj);

        }
        await Promise.all(app.map(async (e, i) => {
            let approveEdOt = await db.query(`

                       SELECT 
                       b.id,
                       b.employeeName,
                       a.editOTday,
                       a.date,
                       a.type,
                       a.workingHour
                       FROM eve_acc_employee_overtime_approved AS a
                       LEFT JOIN eve_acc_employee AS b ON (a.employeeId=b.id)
                       WHERE a.status='A'
                         AND b.status='A'
                         AND b.employeeType='Blue Collar'
                       AND a.date=:date
                       AND a.type='Approve'

                         AND

                         (
                             b.employeeCurrentStatus = '' 
                             OR b.employeeCurrentStatus IS NULL 
                             OR b.employeeCurrentStatus = 'Active'
                             OR b.employeeCurrentStatus = 'resignation' 
                             OR b.employeeCurrentStatus = 'joining'
                             OR b.employeeCurrentStatus = 'termination'
                             OR b.employeeCurrentStatus = 'release' 
                             OR b.employeeCurrentStatus = 'offerletter'
                         )

                 AND b.isOvertimeApplicable='yes'

                 AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)

                 AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)    
                     
                       `, {
                replacements: {
                    date: e.crtDate,
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                },
                type: QueryTypes.SELECT
            })
            
            let editOThrsArr = []

            approveEdOt.forEach(x => {

                if (x.editOTday !== null) {
                    editOThrsArr.push(x.editOTday)
                }
                    
            })

            e.editOThrs = myFunc.addTimes(editOThrsArr)

            let workingOt = await db.query(`
                      SELECT b.id,b.employeeName,a.editOTday,a.date,a.type,a.workingHour
                      FROM eve_acc_employee_overtime_approved AS a
                      LEFT JOIN eve_acc_employee AS b ON (a.employeeId=b.id)
                      WHERE a.status='A'
                      AND b.status='A'
                      AND a.date=:date
                      AND a.type='Approve'
                      AND a.editOTday IS NULL

                      AND (
                             b.employeeCurrentStatus = '' 
                             OR b.employeeCurrentStatus IS NULL 
                             OR b.employeeCurrentStatus = 'Active'
                             OR b.employeeCurrentStatus = 'resignation' 
                             OR b.employeeCurrentStatus = 'joining'
                             OR b.employeeCurrentStatus = 'termination'
                             OR b.employeeCurrentStatus = 'release' 
                             OR b.employeeCurrentStatus = 'offerletter'
                         )
                              AND b.isOvertimeApplicable='yes'
                              AND b.employeeType='Blue Collar'

                 AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
                 AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)   

                       `, {
                replacements: {
                    date: e.crtDate,
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                },
                type: QueryTypes.SELECT
            })
          
            

            let workingOThrsArr = []
            workingOt.forEach(x => {

                if (x.workingHour !== null) {
                    workingOThrsArr.push(x.workingHour)
                }

            })

            e.workingHrs = myFunc.addTimes(workingOThrsArr)
            let arr = [e.workingHrs, e.editOThrs]
            e.approved = myFunc.addTimes(arr)

            let rejectOt = await db.query(`

                       SELECT b.id,b.employeeName,a.editOTday,a.date,a.type,a.workingHour
                       FROM eve_acc_employee_overtime_approved AS a
                       LEFT JOIN eve_acc_employee AS b ON (a.employeeId=b.id)
                       WHERE a.status='A'
                       AND b.status='A'
                       AND a.date=:date
                       AND a.type='Reject'
                       AND b.employeeType='Blue Collar'

                         AND (
                             b.employeeCurrentStatus = '' 
                             OR b.employeeCurrentStatus IS NULL 
                             OR b.employeeCurrentStatus = 'Active'
                             OR b.employeeCurrentStatus = 'resignation' 
                             OR b.employeeCurrentStatus = 'joining'
                             OR b.employeeCurrentStatus = 'termination'
                             OR b.employeeCurrentStatus = 'release' 
                             OR b.employeeCurrentStatus = 'offerletter'
                         )
                              AND b.isOvertimeApplicable='yes'

                 AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
                 AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)

                       `, {
                replacements: {
                    date: e.crtDate,
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                },

                type: QueryTypes.SELECT
            })

            let rejectArr = []
            rejectOt.forEach(e => {

                if (e.editOTday !== null) {
                    rejectArr.push(e.editOTday)
                }

                else if (e.workingHour !== null) {
                    rejectArr.push(e.workingHour)
                }

            })

            e.rejected = myFunc.addTimes(rejectArr)
            let totalOvertimeHoursArr=[e.approved,e.rejected]
            e.totalOvertimeHours=myFunc.addTimes(totalOvertimeHoursArr)

        }))

        return res.status(200).send({
            status: true, totalData: app.length,
            data: app
        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getOvertimeSummary }
