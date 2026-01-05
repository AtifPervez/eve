let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../functions/functions')
const moment = require('moment')
const getUpcomingLeaves = async (req, res) => {

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
            year = year.split("-")[1]
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
                newCrtDate: `${number}-${month}-${year}`,
                dayName: moment(`${year}-${month}-${number}`, 'YYYY-MM-DD').format('dddd'),
                'status': 'Working Day',
                'type': 'Present',
                'approved': 0,
                'pending': 0,
                'rejected': 0,
                'weekOff': 0,
                'holiday': 0,
            }

            app.push(newObj);

        }
      
        let activeEmpArr = []
        let inactiveEmpArr = []
        await Promise.all(app.map(async (e, i) => {

            let nodeSql = await db.query(
                `           
                   SELECT a.empId,a.leaveStatus,a.fromDate,a.toDate,b.employeeBranchId,b.status,b.inActiveDate,b.employeeLastWorkingDate,b.employeeCurrentStatus
                   FROM eve_acc_employee_leave_history AS a
                   LEFT JOIN eve_acc_employee AS b 
                   ON a.empId = b.id
                    WHERE a.status = 'A' 
                   AND (b.status='A' OR b.status='I') 

                AND (
                b.employeeCurrentStatus = ''
                OR b.employeeCurrentStatus IS NULL
                OR b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
                )

                -- AND DATE_FORMAT(b.employeeDoj, "%Y-%m") <= :yearMonth

                   --   AND (
                -- DATE_FORMAT(b.employeeLastWorkingDate, "%Y-%m") >= :yearMonth
                -- OR b.employeeLastWorkingDate IS NULL
                        --   )

                   -- AND (
                -- DATE_FORMAT(b.inActiveDate, "%Y-%m") >= :yearMonth
                -- OR b.inActiveDate IS NULL
                       --   )
                        
                   AND b.employeeType='Blue Collar' 

                   AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)

                   AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)

                  AND :crtDate BETWEEN a.fromDate AND a.toDate

            
                `, {
                replacements:
                {
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                    crtDate: e.crtDate,
                    yearMonth: `${year}-${month}`

                }, type: QueryTypes.SELECT
            })
          
            if (nodeSql.length > 0) {
                nodeSql.forEach(x => {

                    if (moment(x.inActiveDate, 'YYYY-MM').isSame(`${year}-${month}`) || moment(x.employeeLastWorkingDate, 'YYYY-MM').isSame(`${year}-${month}`)) {
                        inactiveEmpArr.push(x.empId)
                    }
                    else {
                        activeEmpArr.push(x.empId)
                    }
                  
                })
            }

            let approvedCount = 0;
            let pendingCount = 0;
            let rejectedCount = 0;

            for (const x of nodeSql) {

                if (x.leaveStatus === 'A') {
                    approvedCount++;
                } 
                else if (x.leaveStatus === 'W') {
                    pendingCount++
                } 
                else if (x.leaveStatus === 'C') {
                    rejectedCount++
                }
            }

            e.approved = approvedCount;
            e.pending = pendingCount;
            e.rejected = rejectedCount;

            if (subCompanyId) {
                let sqlCompanyHldy = await getGeneralHolidayDateBySubComp(e.newCrtDate, subCompanyId, db)

                if (sqlCompanyHldy === 'yes') {
                    e.holiday = 1
                    e.status = 'Holiday'
                    e.type = 'General Holiday'
                }
            }

            else {
                let sqlCompanyHldy = await getGeneralHoliday(e.crtDate, db)


                if (sqlCompanyHldy === 'yes') {
                    e.holiday = 1
                    e.status = 'Holiday'
                    e.type = 'General Holiday'
                }
            }

            let sqlFixWeeklyOff = await getFixWeeklyOffDay(e.dayName, subCompanyId, db)
            if (sqlFixWeeklyOff === 'yes') {
                e.weekOff = 1
                e.status = 'Weekly Off'
                e.type = 'Fix Weekly Holiday'
            }

        }))

        let addWeekOff = (await additionalWeeklyOffDay(subCompanyId, year, month, db));

        for (const ad of addWeekOff) {
            let objIndex = app.findIndex((obj => obj.crtDate == ad));
            if (objIndex > -1) {
                app[objIndex].weekOff = 1
                app[objIndex].status = 'Additional Weekly Off'
                app[objIndex].type = 'Additional Weekly Holiday'
            }
        }

        const activeEmpuniqueIds = [...new Set(activeEmpArr)];
        const inactiveEmpuniqueIds = [...new Set(inactiveEmpArr)];
        // console.log(activeEmpuniqueIds,inactiveEmpuniqueIds);
        
        return res.status(200).send({
            status: true,
            month: myFunc.convertMonthName(month),
            year: `${year}-${parseInt(year) + 1}`,
            activeEmp: activeEmpuniqueIds.length,
            inactiveEmp: inactiveEmpuniqueIds.length,
            // data: query,
            days: app,
        })

    } 
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getUpcomingLeaves }

async function getFixWeeklyOffDay(day, subCompanyId, db) {
    const sql = await db.query(
        `
        select *  from eve_acc_company_fix_weekly_holiday
        where status='A'
        AND subCompanyId=:subCompanyId
        AND day=:day
      
        `, {
        replacements: {
            subCompanyId: subCompanyId,
            day: day
        }, type: QueryTypes.SELECT
    })

    if (sql[0]) {
        return 'yes'
    }
    else {
        return 'no'
    }
}

async function getGeneralHolidayDateBySubComp(date, subCompanyId, db) {
    const sql = await db.query(
        `
        select * from eve_acc_general_holiday_city_category
        where status='A'
        and subCompanyId=:subCompanyId
        and holidayDate=:date AND category='bluecollar'
        `, {
        replacements: {
            subCompanyId: subCompanyId,
            date: date,
        }, type: QueryTypes.SELECT
    }
    )

    if (sql[0]) {
        return 'yes'
    }
    else {
        return 'no'
    }
}

async function getGeneralHoliday(date, db) {
    const sql = await db.query(
        `
        select * from eve_acc_general_holiday
        where status='A'
        and holidayDate=:date
       
        `, {
        replacements: {
            date: date,
        }, type: QueryTypes.SELECT
    }
    )

    if (sql[0]) {
        return 'yes'
    }
    else {
        return 'no'
    }
}
async function additionalWeeklyOffDay(subCompanyId, year, month, db) {
    // Fetch weekly holiday rules from DB
    const sqlCompanyHldy = await db.query(`
        SELECT day, weeks  
        FROM eve_acc_company_weekly_holiday  
        WHERE status = "A" AND subCompanyId = :subCompanyId
    `, {
        replacements: { subCompanyId },
        type: QueryTypes.SELECT
    })

    const dayMap = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
    }

    const finalDates = []

    for (const rule of sqlCompanyHldy) {
        if (!rule.day || !rule.weeks) continue

        // Normalize day
        const normalizedDay = rule.day.trim().charAt(0).toUpperCase() + rule.day.trim().slice(1).toLowerCase()
        const targetDay = dayMap[normalizedDay]
        if (targetDay === undefined) continue

        // Parse weeks like "2,4"
        const targetWeeks = rule.weeks.split(',').map(w => parseInt(w.trim())).filter(n => !isNaN(n))

        let date = new Date(year, month - 1, 1) // Local time
        let weekdayCount = 0

        while (date.getMonth() === month - 1) {
            if (date.getDay() === targetDay) {
                weekdayCount++
                if (targetWeeks.includes(weekdayCount)) {
                    const yyyy = date.getFullYear()
                    const mm = String(date.getMonth() + 1).padStart(2, '0')
                    const dd = String(date.getDate()).padStart(2, '0')
                    finalDates.push(`${yyyy}-${mm}-${dd}`)
                }
            }
            date.setDate(date.getDate() + 1)
        }
    }
    return finalDates
}


