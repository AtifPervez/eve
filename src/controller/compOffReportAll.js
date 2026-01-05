let sequelize = require(("../config/db"))
const { QueryTypes } = require(('sequelize'))
const phpUnserialize = require('php-serialize');
const moment = require('moment');
const { parse } = require('dotenv');

const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (employeeName[0]) {
        let res = Object.values(employeeName[0])
        let newRes = (res.toString());
        return newRes
    }
}
const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A" ', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if (branchName[0]) {
        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
}
function formatAmount(numericString) {
    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
}
const getTodayDate = () => {
    let today = new Date();
    let year = today.getFullYear().toString();
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    let day = today.getDate().toString().padStart(2, '0');

    let formattedDate = `${year}-${month}-${day}`;
    return formattedDate
}

//Main Api
const getCompOffReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME, year, month } = data
        let db = sequelize(DB_NAME)
        let leaveFinancialYear = await db.query('select * from eve_acc_leave_financial_year_master where status="A"',
            {
                replacements: {}, type: QueryTypes.SELECT
            }
        )
        let financialYearFrom
        let financialYearTo
        if (leaveFinancialYear[0].financialYearTypeName == 'Calendar Year') {
            financialYearFrom = year
            financialYearTo = year
        }
        else {
            if (month <= 3) {
                financialYearFrom = `${parseInt(year) - 1}`
                financialYearTo = year
            } else {
                financialYearFrom = year
                financialYearTo = `${parseInt(year) + 1}`

            }
        }
        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignation as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName from eve_acc_employee as emp where emp.status="A"', { replacements: {}, type: QueryTypes.SELECT })

        let compOffLeave = await db.query('select id,name from eve_acc_leave_type where status="A" && name="Comp Off"', {
            replacements: {},
            type: QueryTypes.SELECT
        })
        // console.log(compOffLeave);

        let monthlyCompOffLeave = await db.query('select * from eve_acc_employee_compensatoryoff_alocation where status="A" && compoffStatus="A"', {
            replacements: {},
            type: QueryTypes.SELECT
        })
       
        await Promise.all(getData.map(async (e) => {
        

            if (e.designationName != '' && e.designationName != null) {
                e.designationName = await getDesignationNameById(e.designationName, db)
            }
            if (e.designationName == undefined) {
                e.designationName = ''
            }
            if (e.branchName != '' && e.branchName != null) {
                e.branchName = await getBranchNameByBranchId(e.branchName, db)
            }
            if (e.branchName == undefined) {
                e.branchName = ''
            }
            if (e.SubdepartmentName != '' && e.SubdepartmentName != null) {
                e.SubdepartmentName = await getSubDepartmentNameBySubDepartmentId(e.SubdepartmentName, db)
            }

            e.totalAlotment = 0
            e.compOffleaveExist = false
            e.totalPreMntNotExpire = 0
            e.totalLeave = 0
            e.totalNotExpire = 0
            e.totalNotExpireToday = 0
            e.expired = 0
            e.totalAlotTillPreMnt = 0


            monthlyCompOffLeave.map((x) => {
               

                let dateString = x.approveDate
                let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
                let monthBy = date.format('MM', "MM-DD-YYYY").toString();
                if (e.empId == x.empId && year == yearBy && month == monthBy) {
                    e.totalAlotment += parseFloat(x.countDays)
                    e.compOffleaveExist = true
                }


                //approveDate
                let approveDateString = x.approveDate
                let approveDate = moment(approveDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let approveYear = approveDate.format('YYYY', "MM-DD-YYYY").toString()
                let approveMonth = approveDate.format('MM', "MM-DD-YYYY").toString();
                //expireDate
                let expDateString = x.expDate
                let expDate = moment(expDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let expYear = expDate.format('YYYY', "MM-DD-YYYY").toString()
                let expMonth = expDate.format('MM', "MM-DD-YYYY").toString();

                if (e.empId == x.empId && year == approveYear && year == expYear && (parseInt(month) - 1) == approveMonth && (parseInt(month) - 1) == expMonth) {
                    e.totalPreMntNotExpire += parseFloat(x.countDays)
                }

                let a = e.totalPreMntNotExpire, b = e.totalPreMntApply
                if (a > b) e.preMntRemainingLeave = parseInt(a - b)
                else e.preMntRemainingLeave = parseInt(b - a)
                if (leaveFinancialYear[0].financialYearTypeName == 'Calendar Year') {
                    e.totalLeave = e.totalAlotment
                }
                else {
                    e.totalLeave = e.totalAlotment + e.preMntRemainingLeave
                }

                //current month after expired remain(totalNotExpire)

                if (e.empId == x.empId && year == expYear && expMonth > month) {
                    e.totalNotExpire += parseFloat(x.countDays)
                }

                //current date - live remain & expiry(totalNotExpireToday)
                if (e.empId == x.empId && x.expDate == getTodayDate()) {
                    e.totalNotExpireToday += parseFloat(x.countDays)
                }

                // totalAlotTillPreMnt

                if (e.empId == x.empId && year == approveYear && (parseInt(month) - 1) == approveMonth) {
                    e.totalAlotTillPreMnt += parseFloat(x.countDays)
                }

            })
        }))

        // totalPreMntApply
        let compOffPreviousMonth = await sequelize(DB_NAME).query('select * from eve_acc_employee_compensatoryoff_leave_history where status="A" and (`leaveStatus` = "A" OR `leaveStatus` = "W")', {
            type: QueryTypes.SELECT
        })


        getData.map((e) => {

            e.totalPreMntApply = 0;
            e.preMntRemainingLeave = 0;
            e.apply = 0;
            e.approve = 0;
            e.remaining = 0
            e.totalApplyTillPreMnt = 0

            compOffPreviousMonth.map((x) => {
              
                

                let fromDateString = x.fromDate
                let fromDate = moment(fromDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let fromYearBy = fromDate.format('YYYY', "MM-DD-YYYY").toString()
                let fromMonthBy = fromDate.format('MM', "MM-DD-YYYY").toString();

                let toDateString = x.toDate
                let toDate = moment(toDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
                let toYearBy = toDate.format('YYYY', "MM-DD-YYYY").toString()
                let toMonthBy = toDate.format('MM', "MM-DD-YYYY").toString();

                if (e.empId == x.empId && financialYearFrom == fromYearBy && financialYearTo == toYearBy && (parseInt(month) - 1) == fromMonthBy && (parseInt(month) - 1) == toMonthBy) {
                    e.totalPreMntApply += parseFloat(x.totalDays)
                }

                //apply
                if (e.empId == x.empId && financialYearFrom == fromYearBy && financialYearTo == toYearBy && month == fromMonthBy && month == toMonthBy) {
                    e.apply += parseFloat(x.totalDays)
                }







                //approve
                if (x.leaveStatus == 'A' && e.empId == x.empId && financialYearFrom == fromYearBy && financialYearTo == toYearBy && month == fromMonthBy && month == toMonthBy) {
                    e.approve += parseFloat(x.totalDays)
                }

                //previous month remaining
                if (e.empId == x.empId && financialYearFrom == fromYearBy && financialYearTo == toYearBy && (parseInt(month) - 1) == fromMonthBy && (parseInt(month) - 1) == toMonthBy) {
                    e.totalApplyTillPreMnt += parseFloat(x.totalDays)
                }
            })

            //remaining
            e.remaining = (e.totalLeave) - (e.apply)
            //expired
            e.expired = (e.totalLeave) - ((e.apply) + (e.remaining))

            if (e.remaining > e.totalNotExpire) {
                e.expired = (e.remaining) - (e.totalNotExpire)
                e.remaining = e.totalNotExpire
            }
            //preMntRemainingLeave
            e.preMntRemainingLeave = (e.totalAlotTillPreMnt) - (e.totalApplyTillPreMnt)

            //remaining
            e.remaining = (e.totalLeave) - (e.apply)

            //expire
            e.expired = (e.totalLeave) - ((e.apply) + (e.remaining))



        })
        getData.map((e) => {
            delete e.totalAlotment
            delete e.totalPreMntNotExpire
            delete e.totalNotExpire
            delete e.totalAlotTillPreMnt
            delete e.preMntRemainingLeave
            delete e.totalPreMntApply
            delete e.totalApplyTillPreMnt
            delete e.totalNotExpireToday
        })
       
        getData.sort((a, b) => a.name.localeCompare(b.name));

        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = getData.slice(startIndex, endIndex);

        return res.status(200).send({
            status: true,
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: getData.length,
            leaveReportArr: paginatedData,

        })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getCompOffReport }