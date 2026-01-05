let sequelize = require('../../config/db')
const { QueryTypes } = require('sequelize')
const serialize = require('php-serialize')
const fn = require('../../functions/functions')
const moment = require('moment');
const getSalaryReleased = async (req, res) => {

    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let data = req.body
        let { departmentId, subCompanyId, year, month, api } = data
        let financialYearStart = year.split("-")[0];
        let financialMonthStart = '04'
        let financialYearEnd = (year.split("-")[1])
        let financialMonthEnd = '03'

        // const sql = await db.query(
        //     `
        //          SELECT 
        //          b.inActiveDate,
        //          a.employeeId,
        //          b.employeeName,
        //          a.salaryOfYear,
        //          a.salaryOfMonth,
        //          a.isGenerated,
        //          a.payrollStatus,
        //          a.paymentStatus,
        //          a.wagesType,
        //          b.employeeSubCompanyId,
        //          b.employeeDepartmentId,
        //          a.salary_types
        //          FROM eve_acc_blue_coller_employee_payslip_preview AS a 
        //          LEFT JOIN eve_acc_employee AS b ON (a.employeeId = b.id)
        //          WHERE (a.status = 'A' AND (b.status = 'A' OR b.status = 'I'))
        //          AND a.isGenerated='yes'
        //          AND b.employeeName IS NOT NULL
        //          AND a.payrollStatus='Accept'
        //          AND (
        //                 b.employeeCurrentStatus = '' 
        //                 OR 
        //                 b.employeeCurrentStatus IS NULL 
        //                 OR 
        //                 b.employeeCurrentStatus = 'Active'
        //                 OR 
        //                 b.employeeCurrentStatus = 'joining'
        //                 OR 
        //                 b.employeeCurrentStatus = 'offerletter'
        //                 )

        //                 AND (
        //                (a.salaryOfYear = :financialYearStart AND (a.salaryOfMonth) >= (:financialMonthStart))
        //                              OR
        //         (a.salaryOfYear = :financialYearEnd AND (a.salaryOfMonth ) <= (:financialMonthEnd ))
        //                       )

        //          AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
        //          AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)    

        //         `, {
        //     replacements:

        //     {

        //         subCompanyId: subCompanyId || null,
        //         departmentId: departmentId || null,
        //         financialYearStart,
        //         financialMonthStart,
        //         financialYearEnd,
        //         financialMonthEnd

        //     }, type: QueryTypes.SELECT

        // })

        // sql.forEach(e => e.salary_types = serialize.unserialize(e.salary_types))


        // if (api == 'raw') {
        //     return res.status(200).send({ totalData: sql.length, data: sql })
        // }

        const months = [
            ["04", "Apr"], ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"], ["09", "Sep"],
            ["10", "Oct"], ["11", "Nov"], ["12", "Dec"], ["01", "Jan"], ["02", "Feb"], ["03", "Mar"]
        ];

        const arr = months.map(([num, month]) => ({
            num,
            month,
            given: '',
            outstanding: '',
            total: '',
            dateToDate: '',
            monthly: '',
            activeEmp: 0,
            inActiveEmp: 0,
            empCount: 0,
        }));

        let totalSalary = 0

        await Promise.all(arr.map(async (e, i) => {
            e["activeEmpArr"] = []
            e["inactiveEmpArr"] = []

            let nodeSql = await db.query(
                `           
    SELECT
    b.id,b.employeeName,YEAR(b.inActiveDate) AS year,MONTH(b.inActiveDate) AS month,
    b.inActiveDate,
    b.employeeLastWorkingDate, 
    a.salaryOfYear,a.salaryOfMonth,
    a.isGenerated,
    a.payrollStatus,
    a.wagesType,
    a.paymentStatus, 
    a.netPay,
    a.salary_types,a.paymentAmount,a.dueAmount

FROM eve_acc_blue_coller_employee_payslip_preview AS a
LEFT JOIN eve_acc_employee AS b 
    ON a.employeeId = b.id
WHERE 
    a.status = 'A' 
    AND a.isGenerated = 'yes' 
    AND b.employeeName IS NOT NULL

    AND a.wagesType ='monthly'
    AND a.payrollStatus = 'Accept'
    -- AND (:month IS NULL OR a.salaryOfMonth = :month)
    AND (
        b.employeeCurrentStatus = '' 
        OR 
        b.employeeCurrentStatus IS NULL 
        OR 
        b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
    )
    AND (
        (a.salaryOfYear = :financialYearStart AND a.salaryOfMonth >= :financialMonthStart)
        OR
        (a.salaryOfYear = :financialYearEnd AND a.salaryOfMonth <= :financialMonthEnd)
    )
    AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
    AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)
    AND a.salaryOfMonth = :num                        
    
                `, {
                replacements:
                {
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                    financialYearStart,
                    financialMonthStart,
                    financialYearEnd,
                    financialMonthEnd,
                    num: e.num,
                    month: month || null,

                }, type: QueryTypes.SELECT
            })

            let givenAmt = 0
            let monthlyAmt = 0
            let dateToDateAmt = 0
            let outstandingAmt = 0


            if (e.num <= 3) {

                e.year = year.split("-")[1];
            }
            else {
                e.year = (year.split("-")[0])
            }
            const current = moment(`${e.year}-${e.num}`, 'YYYY-MM');
           
         
            nodeSql.forEach(x => {


               
                e.empCount++
                if (moment(x.inActiveDate, 'YYYY-MM').isSame(current) || moment(x.employeeLastWorkingDate, 'YYYY-MM').isSame(current)) {
                    e.inActiveEmp++
                   
                    e["inactiveEmpArr"] = Array.from(new Set([...(e["inactiveEmpArr"] || []), x.id]));
                 

                }
                else {
                    e.activeEmp++
                  
                    e["activeEmpArr"] = Array.from(new Set([...(e["activeEmpArr"] || []), x.id]));
                 



                }

                if (x['salary_types']) {
                    
                    if (x['paymentStatus'] === 'Paid') {
                        givenAmt += parseFloat(x['netPay'])
                    }
                    
                    else if (x['paymentStatus'] === 'Partial') {
                        givenAmt += parseFloat(x['paymentAmount'])
                        // console.log(x.paymentAmount);
                        outstandingAmt += parseFloat(x['dueAmount'])

                    }
                    else if (x['paymentStatus'] === 'Unpaid' || x['paymentStatus'] === 'On Hold') {
                        outstandingAmt += parseFloat(x['netPay'])

                    }

                    if (x['wagesType'] === 'monthly') {
                        monthlyAmt += parseFloat(x['netPay'])
                    }


                }

            })
            let nodeSql1 = await db.query(
                `           
                    SELECT 
                    b.id,b.employeeName,
                    -- YEAR(b.inActiveDate) AS year,MONTH(b.inActiveDate) AS month,
                    b.inActiveDate,b.employeeLastWorkingDate, 
                    a.employeeId,
                    a.salaryOfYear,
                    a.salaryOfMonth,
                    a.isGenerated,
                    a.payrollStatus,
                    a.salary_types,
                    a.wagesType,
                    a.paymentStatus,
                    a.netPay,a.paymentAmount,a.dueAmount,a.variablePay
                    FROM eve_blue_day_to_day_payouts_slip AS a
                    LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                    WHERE 
                    a.status = 'A' 
                    -- AND a.isGenerated = 'yes' 
   
                    AND a.wagesType ='dayTOday'
   
   
    AND (
        b.employeeCurrentStatus = '' OR 
        b.employeeCurrentStatus IS NULL OR 
        b.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter','inactive')
    )
    AND (
        (a.salaryOfYear = :financialYearStart AND a.salaryOfMonth >= :financialMonthStart)
        OR
        (a.salaryOfYear = :financialYearEnd AND a.salaryOfMonth <= :financialMonthEnd)
    )
    AND (:subCompanyId IS NULL OR b.employeeSubCompanyId = :subCompanyId)
    AND (:departmentId IS NULL OR b.employeeDepartmentId = :departmentId)
    AND a.salaryOfMonth = :num                        
    
                `, {
                replacements:
                {
                    subCompanyId: subCompanyId || null,
                    departmentId: departmentId || null,
                    financialYearStart,
                    financialMonthStart,
                    financialYearEnd,
                    financialMonthEnd,
                    num: e.num,
                    month: month || null,

                }, type: QueryTypes.SELECT
            })

        // console.log(nodeSql1);
        

            nodeSql1.forEach(x => {

                // const record = moment(`${x.year}-${x.month}`, 'YYYY-MM');
                e.empCount++
                // if ((x.inActiveDate === null || record.isSameOrAfter(current))) {
                //     e.activeEmp++
                // } else if (record.isBefore(current)) {
                //     e.inActiveEmp++;
                // }
                if (moment(x.inActiveDate, 'YYYY-MM').isSame(current) || moment(x.employeeLastWorkingDate, 'YYYY-MM').isSame(current)) {
                    // e.inActiveEmp++
                    // e["inactiveEmpArr"] = [...(e["inactiveEmpArr"] || []), x.id];
                    e["inactiveEmpArr"] = Array.from(new Set([...(e["inactiveEmpArr"] || []), x.id]));
                    //   e["inactiveArrLength"] = e["inactiveEmpArr"].length;


                }
                else {
                    // e.activeEmp++
                    //    e["activeEmpArr"] = [...(e["activeEmpArr"] || []), x.id];
                    e["activeEmpArr"] = Array.from(new Set([...(e["activeEmpArr"] || []), x.id]));
                    //   e["activeEmpArr"] = e["activeEmpArr"].length;



                }

                if (x['salary_types']) {

                    if (x['paymentStatus'] === 'Paid') {

                        givenAmt += parseFloat(x['netPay'])
                    }

                    else if (x['paymentStatus'] === 'Partial') {
                        givenAmt += parseFloat(x['paymentAmount'])
                        outstandingAmt += parseFloat(x['dueAmount']-parseFloat(x.variablePay))

                    }

                    else if (x['paymentStatus'] === 'Unpaid' || x['paymentStatus'] === 'On Hold') {
                        outstandingAmt += parseFloat(x['netPay'])

                    }

                    if (x['wagesType'] === 'monthly') {
                        monthlyAmt += parseFloat(x['netPay'])
                    }

                    else if (x['wagesType'] === 'dayTOday') {
                        dateToDateAmt += parseFloat(x['netPay'])
                    }
                }
                const activeEmpArr = "activeEmpArr";
                const inactiveEmpArr = "inactiveEmpArr";
                e.activeEmp = (e[activeEmpArr] || []).length;
                e.inActiveEmp = (e[inactiveEmpArr] || []).length;

            })

            e['given'] = fn.formatAmount(givenAmt)

            e['outstanding'] = fn.formatAmount(outstandingAmt)

            e['monthly'] = fn.formatAmount(monthlyAmt)

            e['dateToDate'] = fn.formatAmount(dateToDateAmt)

            e['total'] = fn.formatAmount(givenAmt + outstandingAmt)

            totalSalary += (parseFloat(givenAmt) + parseFloat(outstandingAmt))

        }))
     

        return res.status(200).send({ status: true, totalSalary: fn.formatAmount(totalSalary), data: arr });

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getSalaryReleased }





