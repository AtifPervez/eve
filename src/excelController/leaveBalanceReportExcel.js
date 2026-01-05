let sequelize = require(("../config/db"))

const { QueryTypes } = require(('sequelize'))

const phpUnserialize = require('php-serialize');

const moment = require('moment')

const axios = require('axios')

const ExcelJS = require('exceljs')



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



const getLeaveBalanceReportExcel = async (req, res) => {

    try {





        let data = req.body

        let { DB_NAME, month, year } = data

        let db = sequelize(DB_NAME)







        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignationId as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName,emp.employmentLeaveType from eve_acc_employee as emp where emp.status="A"',

            {

                replacements: {}, type: QueryTypes.SELECT

            }

        )

      

        getData.map((e, i) => {

            e.slNo = Number(i + 1)



            e.CL = ''

            e.COFF = ''

            e.mI1 = ''

            e.PAL = ''

            e.pL = ''

            e.SL = ''

            e.ML = ''

        })



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

        let attendanceApproved = await db.query('select * from eve_acc_employee_attendence_approved where status="A" && remarks="First Half" || remarks="Second Half"', {

            type: QueryTypes.SELECT

        })

        getData.map((e, i) => {



            e.monthlyHalfdayLeave = 0

            attendanceApproved.map((x, j) => {

                let dateString = x.date

                let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])

                let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()

                let monthBy = date.format('MM', "MM-DD-YYYY").toString();

                if (e.empId == x.employeeId && year == yearBy && month == monthBy) {

                    e.monthlyHalfdayLeave++

                }

            })

        })



        let leaveDeduction = await db.query('select * from eve_acc_leave_deduction_log where status="A" && type="L" ', {

            type: QueryTypes.SELECT

        })





        getData.map((e, i) => {

            e.totallateAttendanceLeaveDeduction = 0

            e.monthlylateAttendanceLeaveDeductionCL = 0

            e.monthlylateAttendanceLeaveDeductionML = 0

            e.monthlylateAttendanceLeaveDeductionPAL = 0

            e.monthlylateAttendanceLeaveDeductionSL = 0

            leaveDeduction.map((x, j) => {

                let dateString = x.dayOfAction

                let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])

                let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()

                let monthBy = date.format('MM', "MM-DD-YYYY").toString();



                if (e.empId == x.empId && financialYearFrom == x.fromDate && financialYearTo == x.toDate) {

                    e.totallateAttendanceLeaveDeduction++

                }

                if (e.empId == x.empId && financialYearFrom == x.fromDate && financialYearTo == x.toDate && month == monthBy && year == yearBy) {

                    if (x.leaveTypeId == '1') {

                        e.monthlylateAttendanceLeaveDeductionCL++

                    }

                    if (x.leaveTypeId == '14') {

                        e.monthlylateAttendanceLeaveDeductionML++

                    }

                    if (x.leaveTypeId == '13') {

                        e.monthlylateAttendanceLeaveDeductionPAL++

                    }

                    if (x.leaveTypeId == '52') {

                        e.monthlylateAttendanceLeaveDeductionSL++

                    }



                }

            })

        })



        let leaveType = await sequelize(DB_NAME).query('select * from eve_acc_leave_type where status="A" ', {

            type: QueryTypes.SELECT

        })



        leaveType = leaveType.filter((e) => {

            if (e.name == 'Casual Leave' || e.name == 'Paternity Leave' || e.name == 'Maternity Leave' || e.name == 'Sick Leave') {

                return e

            }

        })



        let leaveHistory = await sequelize(DB_NAME).query('select * from eve_acc_employee_leave_history where status="A" ', {

            type: QueryTypes.SELECT

        })



        await Promise.all(getData.map(async (e, i) => {

            e.monthlyCasualLeave = 0

            e.monthlyMaternityLeave = 0

            e.monthlyPaternityLeave = 0

            e.monthlySickLeave = 0



            e.year = year

            e.month = month

            e.empId = e.empId.toString()





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

            leaveHistory.map((x, j) => {

                // let dateString = x.fromDate

                // let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])

                // let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()

                // let monthBy = date.format('MM', "MM-DD-YYYY").toString();



                let fromDateString = x.fromDate

                let fromDate = moment(fromDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])

                let fromYearBy = fromDate.format('YYYY', "MM-DD-YYYY").toString()

                let fromMonthBy = fromDate.format('MM', "MM-DD-YYYY").toString();



                let toDateString = x.toDate

                let toDate = moment(toDateString, ["MM-DD-YYYY", "YYYY-MM-DD"])

                let toYearBy = toDate.format('YYYY', "MM-DD-YYYY").toString()

                let toMonthBy = toDate.format('MM', "MM-DD-YYYY").toString();





                if (e.empId == x.empId && financialYearFrom == fromYearBy && month == fromMonthBy && financialYearTo == toYearBy && month == toMonthBy) {

                    if (x.leaveTypeId == '1') {

                        e.monthlyCasualLeave += parseInt(x.totalDays)

                    }

                    if (x.leaveTypeId == '13') {

                        e.monthlyPaternityLeave += parseInt(x.totalDays)

                    }

                    if (x.leaveTypeId == '14') {

                        e.monthlyMaternityLeave += parseInt(x.totalDays)

                    }

                    if (x.leaveTypeId == '52') {

                        e.monthlySickLeave += parseInt(x.totalDays)

                    }



                }





            })

        }))

        let leaveSummary = await sequelize(DB_NAME).query('select * from eve_acc_employee_leave_summary where status="A" ', {

            type: QueryTypes.SELECT

        })

        getData.map((e, i) => {

            e.availableLeaveCL = 0

            e.availableLeavePAL = 0

            e.availableLeaveML = 0

            e.availableLeaveSL = 0

            leaveSummary.map((x, j) => {

                if (financialYearFrom == x.fromDate && financialYearTo == x.toDate && e.empId == x.empId) {

                    if (x.leaveTypeId == '1') {

                        e.availableLeaveCL += parseFloat(x.availableLeave)

                        // e.CL=x.availableLeave

                    }

                    if (x.leaveTypeId == '13') {

                        e.availableLeavePAL += parseFloat(x.availableLeave)

                        // e.PAL=x.availableLeave

                    }

                    if (x.leaveTypeId == '14') {

                        e.availableLeaveML += parseFloat(x.availableLeave)

                        // e.ML=x.availableLeave

                    }

                    if (x.leaveTypeId == '52') {

                        e.availableLeaveSL += parseFloat(x.availableLeave)

                        // e.SL=x.availableLeave

                    }





                }

            })

        })



        let leaveSetting = await sequelize(DB_NAME).query('select * from eve_acc_leave_setting where status="A" ', {

            type: QueryTypes.SELECT

        })

        leaveSetting = leaveSetting.filter((e, i) => {

            if (e.subCompanyId != null) {

                return e

            }

        })





        getData.map((e, i) => {

            e.leaveListArr = []

            leaveSetting.map((x, j) => {

                if (e.employmentLeaveType == x.employmentLeaveTypeId) {



                    if (x.leaveTypeId == '1') {

                        e.totalCausalLeave = (x.allocateLeaveDays)



                        e.leaveListArr[0] = {

                            CHECKavailableLeave: `${e.availableLeaveCL}/0/0/0/0`,

                            allocateLeaveDays: e.totalCausalLeave,

                            availableLeave: e.availableLeaveCL,

                            afterProbationLeaveCount: 'Total',

                            colorCode: "#FFFF00",

                            leaveTypeId: "1",

                            leaveTypeName: "Casual Leave",

                            prefix: "CL",

                            lateAttendanceLeaveDeduction: e.monthlylateAttendanceLeaveDeductionCL,

                            totalLateAttendanceLeaveDeduction: e.totallateAttendanceLeaveDeduction

                        }

                        e.CL = e.availableLeaveCL



                    }

                    if (x.leaveTypeId == '14') {

                        e.totalMaternityLeave = (x.allocateLeaveDays)

                        e.leaveListArr[2] = {

                            CHECKavailableLeave: `${e.availableLeaveML}/0/0/0/0`,

                            allocateLeaveDays: e.totalMaternityLeave,

                            availableLeave: e.availableLeaveML,

                            afterProbationLeaveCount: 'Total',

                            colorCode: "#80ff80",

                            leaveTypeId: "14",

                            leaveTypeName: "Maternity Leave",

                            prefix: "ML",

                            lateAttendanceLeaveDeduction: e.monthlylateAttendanceLeaveDeductionML,

                            totalLateAttendanceLeaveDeduction: e.totallateAttendanceLeaveDeduction

                        }

                        e.ML = e.availableLeaveML

                    }

                    // else{

                    //     e.totalMaternityLeave = (x.allocateLeaveDays)

                    //     e.leaveListArr[2] = {

                    //         CHECKavailableLeave: `${e.availableLeaveML}/0/0/0/0`,

                    //         allocateLeaveDays: e.totalMaternityLeave,

                    //         availableLeave: e.availableLeaveML,

                    //         afterProbationLeaveCount: 'Total',

                    //         colorCode: "#80ff80",

                    //         leaveTypeId: "14",

                    //         leaveTypeName: "Maternity Leave",

                    //         prefix: "ML",

                    //         lateAttendanceLeaveDeduction:e.monthlylateAttendanceLeaveDeductionML,

                    //         totalLateAttendanceLeaveDeduction:e.totallateAttendanceLeaveDeduction

                    //     }



                    // }

                    if (x.leaveTypeId == '13') {

                        e.totalPaternityLeave = (x.allocateLeaveDays)

                        e.leaveListArr[1] = {

                            CHECKavailableLeave: `${e.availableLeavePAL}/0/0/0/0`,

                            allocateLeaveDays: e.totalPaternityLeave,

                            availableLeave: e.availableLeavePAL,

                            afterProbationLeaveCount: 'Credit',

                            colorCode: "#ff944d",

                            leaveTypeId: "13",

                            leaveTypeName: "Paternity Leave",

                            prefix: "PAL",

                            lateAttendanceLeaveDeduction: e.monthlylateAttendanceLeaveDeductionPAL,

                            totalLateAttendanceLeaveDeduction: e.totallateAttendanceLeaveDeduction

                        }

                        e.PAL = e.availableLeavePAL

                    }





                    if (x.leaveTypeId == '52') {

                        e.totalSickLeave = (x.allocateLeaveDays)

                        e.leaveListArr[3] = {

                            CHECKavailableLeave: `${e.availableLeaveSL}/0/0/0/0`,

                            allocateLeaveDays: e.totalSickLeave,

                            availableLeave: e.availableLeaveSL,

                            afterProbationLeaveCount: 'Total',

                            colorCode: "#c9b031",

                            leaveTypeId: "52",

                            leaveTypeName: "Sick Leave",

                            prefix: "SL",

                            lateAttendanceLeaveDeduction: e.monthlylateAttendanceLeaveDeductionSL,

                            totalLateAttendanceLeaveDeduction: e.totallateAttendanceLeaveDeduction

                        }

                        e.SL = e.availableLeaveSL

                    }

                    // else{

                    //     e.totalSickLeave = (x.allocateLeaveDays)

                    //     e.leaveListArr[3] = {

                    //         CHECKavailableLeave: `${e.availableLeaveSL}/0/0/0/0`,

                    //         allocateLeaveDays: e.totalSickLeave,

                    //         availableLeave: e.availableLeaveSL,

                    //         afterProbationLeaveCount: 'Total',

                    //         colorCode: "#c9b031",

                    //         leaveTypeId: "52",

                    //         leaveTypeName: "Sick Leave",

                    //         prefix: "SL",

                    //         lateAttendanceLeaveDeduction:e.monthlylateAttendanceLeaveDeductionSL,

                    //         totalLateAttendanceLeaveDeduction:e.totallateAttendanceLeaveDeduction

                    //     }



                    // }

                }

            })

        })

        getData.map((e) => {

            delete e.year

            delete e.month

            delete e.monthlyCasualLeave

            delete e.monthlyMaternityLeave

            delete e.monthlyPaternityLeave

            delete e.monthlySickLeave

            delete e.availableLeaveCL

            delete e.availableLeavePAL

            delete e.availableLeaveML

            delete e.availableLeaveSL

            delete e.totalPaternityLeave

            delete e.totalCausalLeave

            delete e.totalMaternityLeave

            delete e.totalSickLeave

            delete e.totallateAttendanceLeaveDeduction

            delete e.monthlylateAttendanceLeaveDeductionCL

            delete e.monthlylateAttendanceLeaveDeductionML

            delete e.monthlylateAttendanceLeaveDeductionPAL

            delete e.monthlylateAttendanceLeaveDeductionSL

            delete e.monthlyHalfdayLeave

            delete e.leaveTemplateExist

            delete e.employmentLeaveType

            delete e.empId

            delete e.leaveTemplateExist



            if (e.leaveListArr.length == 0) {

                delete e.leaveListArr

            }



            // if (e.leaveListArr == undefined) {

            //     e.leaveTemplateExist = false

            // }

            // else e.leaveTemplateExist = true

            delete e.leaveListArr

        })





        getData.sort((a, b) => a.name.localeCompare(b.name));

        return res.status(200).send({

            staus: true,

            totalData: getData.length,

            leaveReportArr: getData,

        })

    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



async function fetchData({month, year }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'GET',

           

            url:`${process.env.BASE_URL}/report/getLeaveBalanceReportExcel`,

            data: {month, year }

        }

        const response = await axios(config)

        return response.data;

    } catch (error) {

        throw error;

    }

}

async function createExcelFile(data) {

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('API Data');

    let values = []

    let leaveReportArr = data.leaveReportArr

    let header = Object.keys(leaveReportArr[0])



    values.push(header)

    leaveReportArr.forEach(e => {

        let value = Object.values(e)



        values.push(value)

    });



    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.font = { bold: true };

    });

    return workbook.xlsx

}

async function getLeaveBalanceReportExcelSheet(req, res) {

    try {

        let year = req.query.year

        let month = req.query.month



        let apiData = await fetchData({year, month })

        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', 'attachment; filename="leaveBalanceReportExcelSheet.xlsx"');



        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getLeaveBalanceReportExcel, getLeaveBalanceReportExcelSheet }