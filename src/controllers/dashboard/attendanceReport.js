let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../functions/functions')
const dayjs = require('dayjs');
const moment = require('moment')
const getAttendanceReport = async (req, res) => {
    try {

        const decodedToken = req.headerSession
        const tokenCompanyId = decodedToken.companyId
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
                "day": i,
                "present": '',
                "late": '',
                "onLeave": '',
                "normalFlyClockIn": '',
                "absent": '',
            }

            app.push(newObj);

        }
        let totalPresent = 0
        let totalAbsent = 0
        let totalLeave = 0
        let totalNormalClockIn = 0
        let totalLate = 0
        await Promise.all(app.map((async e => {
            const sqlAttPresent = await db.query(
                ` 
                SELECT 
                -- a.attendanceCount,a.type,a.date
                 -- SUM(CAST(attendanceCount AS DECIMAL(3,2)) ) AS presentCount
                 COUNT(*) AS presentCount
                 FROM 
                 eve_acc_employee_attendence_approved AS a
                 LEFT JOIN 
                 eve_acc_employee AS b ON a.employeeId = b.id
                 
                 WHERE a.status = 'A' 
                 AND (b.status='A' OR b.status='I')

                   AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
                OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

             

                 AND a.date = :date
              -- AND a.date = '2025-01-01'
                 AND b.employeeType = 'Blue Collar'
              -- AND b.employeeSubCompanyId IS NOT NULL 
                 AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                 AND a.type IN ('full', 'half','actualWokrHrs');
                `,
                {
                    replacements: {
                        date: e.crtDate,
                        subCompanyId: subCompanyId || null,
                        yearMonth: `${year}-${month}`
                    }
                    , type: QueryTypes.SELECT
                }
            )


            e['present'] = sqlAttPresent[0]['presentCount']
            totalPresent += sqlAttPresent[0]['presentCount']

            const sqlAttAbsent = await db.query(
                `
                    SELECT COUNT(*) AS absentCount
                    FROM eve_acc_employee_attendence_approved AS a
                    LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                    WHERE a.status='A'
                      AND (b.status='A' OR b.status='I')
                    AND a.date=:date   AND b.employeeType='Blue Collar'

                        AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

                    -- AND b.employeeSubCompanyId is not null 
                    AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                    AND a.type='reject' AND a.remarks != 'AB LEAVE' AND a.remarks !='First Half' AND a.remarks !='Second Half'
                    `, {
                replacements: {

                    date: e.crtDate,
                    subCompanyId: subCompanyId || null,
                    yearMonth: `${year}-${month}`

                }, type: QueryTypes.SELECT
            }
            )
            e['absent'] = sqlAttAbsent[0]['absentCount']
            totalAbsent += sqlAttAbsent[0]['absentCount']

            const sqlAttLeave = await db.query(
                `
                    select count(*) as leaveCount
                    from eve_acc_employee_attendence_approved as a
                    left join eve_acc_employee as b on a.employeeId = b.id

                    where a.status='A'
                      AND (b.status='A' OR b.status='I')
                    and a.date=:date   AND b.employeeType='Blue Collar'

                         AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth
 
                    -- and b.employeeSubCompanyId is not null and 
                    AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                    and a.type='holiday' 
                    and a.remarks = 'L LEAVE' 
                    and a.remarks != ''
                    and a.leaveTypeId != ''
                    and a.leaveTypeId is not null
                    `, {
                replacements: {
                    date: e.crtDate,
                    subCompanyId: subCompanyId || null,
                    yearMonth: `${year}-${month}`
                }, type: QueryTypes.SELECT
            }
            )
            e['onLeave'] = sqlAttLeave[0]['leaveCount']
            totalLeave += sqlAttLeave[0]['leaveCount']


            const sqlNormalClockIn = await db.query(
                `
                    select count(*) as normalClockInCount
                    from eve_acc_employee_attendence AS a
                    left join eve_acc_employee as b on a.empId = b.id
                    where a.status='A'
                      AND (b.status='A' OR b.status='I') 
                    AND b.employeeType='Blue Collar'

                          AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

                    -- and b.employeeSubCompanyId is not null 
                    AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                    and a.date=:date
                    -- and a.type='normal'
                    and a.type='biometric'

                `, {
                replacements: {

                    date: e.crtDate,
                    subCompanyId: subCompanyId || null,
                    yearMonth: `${year}-${month}`

                }, type: QueryTypes.SELECT
            }
            )

            e['normalFlyClockIn'] = sqlNormalClockIn[0]['normalClockInCount']
            totalNormalClockIn += sqlNormalClockIn[0]['normalClockInCount']

          

            const sqlEmp = await db.query(
                `
                    -- SELECT count(*) as lateCount
                    SELECT a.empId,b.employeeName,a.date,a.intime,c.shiftId,d.lateTimeEnd
                       FROM eve_acc_employee_attendence AS a
                       LEFT join eve_acc_employee as b on a.empId = b.id
                       LEFT join eve_hrm_employee_details as c on a.empId = c.employeeId
                       LEFT join eve_hrm_employee_shift_master as d on c.shiftId = d.id
                       
                       WHERE a.status='A'   
                               AND (b.status='A' OR b.status='I')                    
                       AND b.employeeType='Blue Collar'

                             AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

                     -- and b.employeeSubCompanyId is not null 
                       AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                       and a.date=:date
                       and a.intime > d.lateTimeEnd             
                `,
                {
                    replacements: {
                        date: e.crtDate,
                        subCompanyId: subCompanyId || null,
                        yearMonth: `${year}-${month}`
                    }, type: QueryTypes.SELECT
                }
            )
           e['late'] = sqlEmp.length
                // totalLate += sqlEmp[0]['lateCount']
            
          
            const sqlEmpRoaster=await db.query(
                `
                       -- SELECT count(*) as lateCount
                       SELECT a.empId,a.date,a.intime,c.shiftId,d.lateTimeEnd 
                       FROM eve_acc_employee_attendence AS a
                       LEFT join eve_acc_employee as b on a.empId = b.id
                       LEFT join eve_hrm_employee_roaster as c on (a.empId = c.employeeId AND fromDate=:date)
                       LEFT join eve_hrm_employee_shift_master as d on c.shiftId = d.id
                       
                       WHERE a.status='A'   
                               AND (b.status='A' OR b.status='I')                    
                       AND b.employeeType='Blue Collar'

                             AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

                     -- and b.employeeSubCompanyId is not null 
                       AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                       and a.date=:date
                       and c.shiftId is not null 
                       and d.lateTimeEnd is not null 
                       -- and a.intime > d.lateTimeEnd             
                `,
                {
                    replacements: {
                        date: e.crtDate,
                        subCompanyId: subCompanyId || null,
                        yearMonth: `${year}-${month}`
                    }, type: QueryTypes.SELECT
                }
            )
         
            
            let arr=[]
            sqlEmpRoaster.forEach(x=>{
                
                if (moment(x.intime, 'HH:mm') > (moment(x.lateTimeEnd, 'HH:mm'))) {
                    arr.push('a')
                    
                 }
                //  console.log(arr);
                 
                 e.late=arr.length
                 
            })
           


            if (e.present === null || e.present === undefined) {
                e['present'] = 0;
            }

            else {
                e['present'] = parseFloat(e.present);
            }

        })))
        //***********************************************ACTIVE AND INACTIVE EMP******************* */

        let presentQuery = await db.query(
            ` 
                SELECT b.id,b.inActiveDate,b.employeeLastWorkingDate,b.employeeCurrentStatus,b.status
                 FROM eve_acc_employee_attendence_approved AS a
                 LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                 
                 WHERE a.status = 'A' 
                 AND (b.status='A' OR b.status='I')
                       AND (
                DATE_FORMAT(b.employeeLastWorkingDate, "%Y-%m") >= :yearMonth
                OR b.employeeLastWorkingDate IS NULL
            )

                   AND (
                DATE_FORMAT(b.inActiveDate, "%Y-%m") >= :yearMonth
                OR b.inActiveDate IS NULL
            )

                   AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth
                  AND DATE_FORMAT(a.date, "%Y-%m") = :yearMonth
                  AND b.employeeType = 'Blue Collar'
                  AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                  AND a.type IN ('full', 'half','actualWokrHrs');
                  
        
                `,
            {
                replacements: {

                    subCompanyId: subCompanyId || null,
                    yearMonth: `${year}-${month}`
                }
                , type: QueryTypes.SELECT
            }
        )


        let activeEmpArr = []
        let inactiveEmpArr = []

        presentQuery.forEach(e => {

            
            if (moment(e.inActiveDate, 'YYYY-MM').isSame(`${year}-${month}`) || moment(e.employeeLastWorkingDate, 'YYYY-MM').isSame(`${year}-${month}`)) {
                inactiveEmpArr.push(e.id)
            }
            else {
                activeEmpArr.push(e.id)
            }



        });
       
        const absentQuery = await db.query(
            `
            SELECT b.id,b.inActiveDate,b.employeeLastWorkingDate,b.employeeCurrentStatus,b.status
            FROM eve_acc_employee_attendence_approved AS a
            LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
            WHERE a.status='A'
            AND (b.status='A' OR b.status='I')
            AND b.employeeType='Blue Collar'
            AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
                OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
                )
                AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

                      AND (
                DATE_FORMAT(b.employeeLastWorkingDate, "%Y-%m") >= :yearMonth
                OR b.employeeLastWorkingDate IS NULL
            )

                   AND (
                DATE_FORMAT(b.inActiveDate, "%Y-%m") >= :yearMonth
                OR b.inActiveDate IS NULL
            )

                AND DATE_FORMAT(a.date, "%Y-%m") = :yearMonth
                AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                AND a.type='reject' AND a.remarks != 'AB LEAVE' AND a.remarks !='First Half' AND a.remarks !='Second Half'
                `, {
            replacements: {


                subCompanyId: subCompanyId || null,
                yearMonth: `${year}-${month}`

            }, type: QueryTypes.SELECT
        }
        )


        absentQuery.forEach(e => {

           
              if (moment(e.inActiveDate, 'YYYY-MM').isSame(`${year}-${month}`) || moment(e.employeeLastWorkingDate, 'YYYY-MM').isSame(`${year}-${month}`)) {
                inactiveEmpArr.push(e.id)
            }
            else {
                activeEmpArr.push(e.id)
            }

        });
       
        const leaveQuery = await db.query(
            `
                  SELECT b.id,b.inActiveDate,b.employeeLastWorkingDate,b.employeeCurrentStatus,b.status
                    from eve_acc_employee_attendence_approved as a
                    left join eve_acc_employee as b on a.employeeId = b.id

                    where a.status='A'
                      AND (b.status='A' OR b.status='I')
                      AND b.employeeType='Blue Collar'

                         AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
              OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth
                        AND (
                DATE_FORMAT(b.employeeLastWorkingDate, "%Y-%m") >= :yearMonth
                OR b.employeeLastWorkingDate IS NULL
            )

                   AND (
                DATE_FORMAT(b.inActiveDate, "%Y-%m") >= :yearMonth
                OR b.inActiveDate IS NULL
            )
                    AND DATE_FORMAT(a.date, "%Y-%m") = :yearMonth
                    AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                    and a.type='holiday' 
                    and a.remarks = 'L LEAVE' 
                    and a.remarks != ''
                    and a.leaveTypeId != ''
                    and a.leaveTypeId is not null
                    `, {
            replacements: {
                subCompanyId: subCompanyId || null,
                yearMonth: `${year}-${month}`
            }, type: QueryTypes.SELECT
        }
        )

        leaveQuery.forEach(e => {
           
              if (moment(e.inActiveDate, 'YYYY-MM').isSame(`${year}-${month}`) || moment(e.employeeLastWorkingDate, 'YYYY-MM').isSame(`${year}-${month}`)) {
                inactiveEmpArr.push(e.id)
            }
            else {
                activeEmpArr.push(e.id)
            }
        })

        const normalClockInQuery = await db.query(
            `
                  SELECT b.id,b.inActiveDate,b.employeeLastWorkingDate,b.employeeCurrentStatus,b.status
                    from eve_acc_employee_attendence AS a
                    left join eve_acc_employee as b on a.empId = b.id
                    where a.status='A'
                      AND (b.status='A' OR b.status='I') 
                    AND b.employeeType='Blue Collar'

                          AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
               OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth
                    AND DATE_FORMAT(a.date, "%Y-%m") = :yearMonth

                     AND (
                DATE_FORMAT(b.employeeLastWorkingDate, "%Y-%m") >= :yearMonth
                OR b.employeeLastWorkingDate IS NULL
            )

                   AND (
                DATE_FORMAT(b.inActiveDate, "%Y-%m") >= :yearMonth
                OR b.inActiveDate IS NULL
            )

                    AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                    and a.type='biometric'

                `, {
            replacements: {
                subCompanyId: subCompanyId || null,
                yearMonth: `${year}-${month}`

            }, type: QueryTypes.SELECT
        }
        )


        normalClockInQuery.forEach(e => {
          
              if (moment(e.inActiveDate, 'YYYY-MM').isSame(`${year}-${month}`) || moment(e.employeeLastWorkingDate, 'YYYY-MM').isSame(`${year}-${month}`)) {
                inactiveEmpArr.push(e.id)
            }
            else {
                activeEmpArr.push(e.id)
            }
        })

        const lateQuery = await db.query(
            `
                
                       SELECT b.id,b.inActiveDate,b.employeeLastWorkingDate,b.employeeCurrentStatus,b.status
                       FROM eve_acc_employee_attendence AS a
                       LEFT join eve_acc_employee as b on a.empId = b.id
                       LEFT join eve_hrm_employee_details as c on a.empId = c.employeeId
                       LEFT join eve_hrm_employee_shift_master as d on c.shiftId = d.id
                       WHERE a.status='A'   
                       AND (b.status='A' OR b.status='I')                    
                       AND b.employeeType='Blue Collar'

                             AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
                OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
            )
                  AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth
                   AND DATE_FORMAT(a.date, "%Y-%m") = :yearMonth

                         AND (
                DATE_FORMAT(b.employeeLastWorkingDate, "%Y-%m") >= :yearMonth
                OR b.employeeLastWorkingDate IS NULL
            )

                   AND (
                DATE_FORMAT(b.inActiveDate, "%Y-%m") >= :yearMonth
                OR b.inActiveDate IS NULL
            )

                       AND (:subCompanyId is null or b.employeeSubCompanyId = :subCompanyId)
                       and a.intime > d.lateTimeEnd             
                `,
            {
                replacements: {
                    subCompanyId: subCompanyId || null,
                    yearMonth: `${year}-${month}`
                }, type: QueryTypes.SELECT
            }
        )

        lateQuery.forEach(e => {
            
              if (moment(e.inActiveDate, 'YYYY-MM').isSame(`${year}-${month}`) || moment(e.employeeLastWorkingDate, 'YYYY-MM').isSame(`${year}-${month}`)) {
                inactiveEmpArr.push(e.id)
            }
            else {
                activeEmpArr.push(e.id)
            }
        })


        const activeEmpuniqueIds = [...new Set(activeEmpArr)];
        const inactiveEmpuniqueIds = [...new Set(inactiveEmpArr)];


        return res.status(200).send({
            status: true,
            result: "success",
            activeEmp: activeEmpuniqueIds.length,
            inactiveEmp: inactiveEmpuniqueIds.length,

            employee: app,
            // employee: absentQuery,

        });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getAttendanceReport }

