let sequelize = require(("../config/db"))

const { QueryTypes } = require(('sequelize'))

const phpUnserialize = require('php-serialize');

const moment = require('moment');

const { parse } = require('dotenv');

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

function getDaysInMonth(year, month) {

    return new Date(year, month, 0).getDate();

}

const getTodayDate = () => {

    let today = new Date();

    let year = today.getFullYear().toString();

    let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based

    let day = today.getDate().toString().padStart(2, '0');



    let formattedDate = `${year}-${month}-${day}`;

    return formattedDate

}



const getLatePuchDeductionReportExcel = async (req, res) => {

    try {

        let data = req.body

        let { DB_NAME, year, month } = data

        let db = sequelize(DB_NAME)

        let leaveFinancialYear = await db.query('select * from eve_acc_leave_financial_year_master where status="A"',

            {

                replacements: {}, type: QueryTypes.SELECT

            }

        )

        let financialYearStartMonth = leaveFinancialYear[0].financialYearStartMonth

        let financialYearEndMonth = leaveFinancialYear[0].financialYearEndMonth





        let financialYearFrom, financialYearTo

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



        let financialStartDate = new Date(`${financialYearFrom}-${financialYearStartMonth}-01`).toISOString().split('T')[0];

        let lastDayOfMonth = new Date(financialYearTo, financialYearEndMonth, 0).getDate();

        let financialEndDate = new Date(`${financialYearTo}-${financialYearEndMonth}-${lastDayOfMonth}`).toISOString().split('T')[0];



        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignation as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName,emp.employeeSubCompanyId,emp.employmentLeaveType as employmentLeaveTypeId from eve_acc_employee as emp where emp.status="A"', { replacements: {}, type: QueryTypes.SELECT })



        let leaveRes = await db.query('select lt.id,lt.name as leaveTypeName,lt.prefix,lt.colorCode,lt.numberOfDay,l.allocateLeaveDays,l.afterProbationLeaveCount,l.subCompanyId,l.employmentLeaveTypeId from eve_acc_leave_setting as l  left join eve_acc_leave_type as lt  on l .leaveTypeId = lt.id  where l.status="A" && lt.status="A" ORDER BY lt.prefix asc', {



            type: QueryTypes.SELECT

        })



        await Promise.all(getData.map(async (e) => {

            // e.employeeSubCompanyId=e.employeeSubCompanyId.toString()

            e.CL=0

            e.ML=0

            e.PAL=0

            e.SL=0

            e.COFF=0

           e.ml1=0

           e.pL=0

           e.LWP_LOP=0

            e.employeeSubCompanyId=e.employeeSubCompanyId



            e.leaveListArr = []

            if (e.designationName != '' && e.designationName != null) {

                // e.designationName = await getDesignationNameById(e.designationName, db)

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

            leaveRes.map((x) => {

                if (e.employeeSubCompanyId == x.subCompanyId && e.employmentLeaveTypeId == x.employmentLeaveTypeId) {

                    e.leaveListArr.push({

                        // leaveTypeId: x.id.toString(),

                        leaveTypeId: x.id,

                        leaveTypeName: x.leaveTypeName,

                        prefix: x.prefix,

                        colorCode: x.colorCode,

                        totalDeductLeave: 0

                    })

                }

            



            })

        }))

        let deductionLog = await db.query('select * from eve_acc_leave_deduction_log where status="A" && type="L"', {

            replacements: {},

            type: QueryTypes.SELECT

        })

        

        await Promise.all(getData.map(async (e) => {

            deductionLog.map((x) => {

                if(e.leaveListArr.length>=1){

                    e.leaveListArr[4]={

                        leaveTypeId: 0,

                        leaveTypeName: 'Absent',

                        prefix: 'LWP-LOP',

                        colorCode: '#f1bcbc',

                        totalDeductLeave: 0

                    }

                }

            



                if (e.empId == x.empId && month == x.month && year == x.year && financialYearFrom == x.fromDate && financialYearTo == x.toDate) {

                    

                    if (e.leaveListArr[0].leaveTypeId == x.leaveTypeId) {

                        e.leaveListArr[0].totalDeductLeave += parseFloat(x.noOfDay)

                        e.CL+=parseFloat(x.noOfDay)

                    

                    }

                    else if (e.leaveListArr[1].leaveTypeId == x.leaveTypeId) {

                        e.leaveListArr[1].totalDeductLeave += parseFloat(x.noOfDay)

                        e.ML+=parseFloat(x.noOfDay)

                      

                    }

                    else if (e.leaveListArr[2].leaveTypeId == x.leaveTypeId) {

                        e.leaveListArr[2].totalDeductLeave += parseFloat(x.noOfDay)

                        e.PAL+=parseFloat(x.noOfDay)

                    }

                    else if (e.leaveListArr[3].leaveTypeId == x.leaveTypeId) {

                        e.leaveListArr[3].totalDeductLeave += parseFloat(x.noOfDay)

                        e.SL+=parseFloat(x.noOfDay)

                    }

                  

                    else if (e.leaveListArr[4].leaveTypeId == x.leaveTypeId) {

                        e.leaveListArr[4].totalDeductLeave += parseFloat(x.noOfDay)

                        e.LWP_LOP+=parseFloat(x.noOfDay)

                    }

                }

            })

            if(e.leaveListArr.length==0){

                e.leaveListArr[0]={

                    leaveTypeId: 0,

                    leaveTypeName: 'Absent',

                    prefix: 'LWP-LOP',

                    colorCode: '#f1bcbc',

                    totalDeductLeave: 0

                }

            }

        }))

     getData.map((e)=>{

       delete e.leaveListArr

     })

        getData.sort((a, b) => a.name.localeCompare(b.name));

      

        return res.status(200).send({

             status: true, 

             totalData: getData.length, 

             leaveReportArr: getData 

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

           

            url:`${process.env.BASE_URL}/report/getLatePunchDeductionReportExcel`,

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

async function getLatePuchDeductionReportExcelSheet(req, res) {

    try {

        

        let year = req.query.year

        let month = req.query.month



        let apiData = await fetchData({year, month })

        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', 'attachment; filename="latePuchDeductionReportExcelSheet.xlsx"');



        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getLatePuchDeductionReportExcel,getLatePuchDeductionReportExcelSheet }

