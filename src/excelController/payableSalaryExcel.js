let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const axios = require('axios')

const ExcelJS = require('exceljs')

const moment = require('moment')

const phpUnserialize = require('php-serialize');

const getDepartmentNameByDepartmentId = async (id, db) => {

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

    else {

        return ''

    }

}

const getEmployeeNameById = async (id, db) => {

    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {

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

    else {

        return ''

    }

}

const getBranchNameByBranchId = async (id, db) => {

    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {

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

    else {

        return ''

    }

}

const getDesignationNameById = async (id, db) => {

    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    }

    )

    if (designationName[0]) {

        let res = Object.values(designationName[0])

        let newRes = (res.toString())

        return newRes

    }

    else {

        return ''

    }

}

const getDesignationIdFromEmpId = async (id, db) => {

    let designationName = await db.query('select employeeDesignationId  from eve_acc_employee where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    }

    )

    if (designationName[0]) {

        let res = Object.values(designationName[0])

        let newRes = (res.toString())

        return newRes

    }

    else {

        return ''

    }

}

const getSubCompanyNameById = async (id, db) => {

    let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (subCompanyName[0]) {

        let res = Object.values(subCompanyName[0])

        let newRes = (res.toString())

        return newRes

    }

    else {

        return ''

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

    else {

        return ''

    }

}

function convertDateDDMMYYYY(date) {

    let parsedDate = moment(date)

    let newDate = parsedDate.format('DD-MM-YYYY')

    return newDate

}

const getEmpCodeFromEmpId = async (id, db) => {

    let empCode = await db.query('select employeeCode from eve_acc_employee where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (empCode[0]) {

        let res = Object.values(empCode[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}

function formatAmount(numericString) {

    if (numericString != null) {

        let numericValue = numericString

        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return formattedString

    }

}

const getLocationNameById = async (id, db) => {

    let location = await db.query('select location from eve_acc_locationmaster where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    if (location[0]) {

        let res = Object.values(location[0])

        let newRes = res.toString()

        return newRes

    }

    else {

        return ''

    }

}



const getPayableSalaryExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession

        const userId = decodedToken.userId

        // const userId = '29'

        const companyId = decodedToken.companyId

        const branchId = decodedToken.branchId

        const mainUserId = decodedToken.mainUserId

        let db = sequelize(companyId)

        // let db = sequelize('59')

        let data = req.body

        let { month, year, salaryFrom, salaryTo } = data

        let getData = await db.query('select emp.employeeName as empName,payslip.employeeId as empId,payslip.salaryTemplateId,payslip.salaryOfMonth,payslip.salaryOfYear,emp.employeeCode as empCode,emp.employeeDepartmentId as departmentId,emp.employeeSubCompanyId as subCompId,emp.employeeBranchId as branchId,locationId as locationID,emp.employeeDesignationId as designationId,emp.employeeSubDepartmentId as subDepartmentId,payslip.createdDateTime as PayrollGeneratedOn,payslip.fromDate,payslip.toDate,payslip.salary_types as wagesPayable,payslip.salary_types as wagesPayableFrmt,payslip.paymentStatus  from eve_acc_blue_coller_employee_payslip_preview as payslip left join eve_acc_employee as emp on emp.id=payslip.employeeId where payslip.status="A" &&  emp.employeeType="Blue Collar" && salaryOfMonth=:month && salaryOfYear=:year && payslip.isGenerated="yes" ',

            {

                replacements: {

                    userId: userId,

                    year: year,

                    month: month,

                },

                type: QueryTypes.SELECT

            })





        await Promise.all(getData.map(async (e) => {

            e.department = await getDepartmentNameByDepartmentId(e.departmentId, db)

            e.subCompany = await getSubCompanyNameById(e.subCompId, db)

            e.branch = await getBranchNameByBranchId(e.branchId, db)

            e.designation = await getDesignationNameById(e.designationId, db)

            e.subDepartment = await getSubDepartmentNameBySubDepartmentId(e.subDepartmentId, db)

            e.PayrollGeneratedOn = convertDateDDMMYYYY(e.PayrollGeneratedOn)

            e.fromDate = convertDateDDMMYYYY(e.fromDate)

            e.toDate = convertDateDDMMYYYY(e.toDate)

            e.wagesPayable = phpUnserialize.unserialize(e.wagesPayable)

            e.wagesPayable = (e.wagesPayable.netPay)

            e.wagesPayableFrmt = phpUnserialize.unserialize(e.wagesPayableFrmt)

            e.wagesPayableFrmt = formatAmount(e.wagesPayableFrmt.netPay)

        }))

        let searchData = {

            empId: req.body.empId,

            subCompId: req.body.subCompId,

            branchId: req.body.branchId,

            departmentId: req.body.departmentId,

            designationId: req.body.designationId,

            subDepartmentId: req.body.subDepartmentId,

            locationID: req.body.locationID,

            empCode: req.body.empCode,

            paymentStatus: req.body.paymentStatus,

        }

        let searchEmp = getData.filter((e, i) => {

            let boo = true

            for (let key in searchData) {

                if (searchData[key] && searchData[key] != e[key]) {

                    boo = false

                    break

                }

            }

            return boo

        })

        

        let totalWages = 0

        searchEmp.map((e) => {

            totalWages += parseFloat(e.wagesPayable) 

        })

       

        let payableSalaryExcel = searchEmp.map((e, i) => ({

            'Sl. No.': Number(i + 1),

            'Employee Code': e.empCode,

            'Employee Name': e.empName,

            'Sub Company': e.subCompany,

            'Branch': e.branch,

            'Department': e.department,

            'Sub Department': e.subDepartment,

            'Designation': e.designation,

            'Payroll Generated On': e.PayrollGeneratedOn,

            'From Date': e.fromDate,

            'To Date': e.toDate,

            'Wages Payable (₹)': e.wagesPayableFrmt,

            'Status': e.paymentStatus

        }))



        if (salaryFrom && salaryTo && year && month) {

            let totalWages=0

            let filteredEmployees = searchEmp.filter(e => {



                const wagesPayable = e.wagesPayable || 0

                return (wagesPayable >= salaryFrom && wagesPayable <= salaryTo);

            });

            filteredEmployees.map((e=>{

                totalWages+= parseFloat(e.wagesPayable)       

            }))

           

            let payableSalaryExcel1 = filteredEmployees.map((e, i) => ({

                'Sl No': Number(i + 1),

                'Employee Code': e.empCode,

                'Employee Name': e.empName,

                'Sub Company': e.subCompany,

                'Branch': e.branch,

                'Department': e.department,

                'Sub Department': e.subDepartment,

                'Designation': e.designation,

                'Payroll Generated On': e.PayrollGeneratedOn,

                'From Date': e.fromDate,

                'To Date': e.toDate,

                'Wages Payable (₹)': e.wagesPayableFrmt,

                'Status': e.paymentStatus

            }))



            return res.status(200).send({ 

                status: true, 

                totalWages:`Total : ${formatAmount(totalWages)}`,

                totalData: getData.length, 

                employee: payableSalaryExcel1 

                // employee: filteredEmployees 

            })

        }



        return res.status(200).send({

            status: true, 

            totalData: getData.length,

            totalWages:`Total : ${formatAmount(totalWages)}`,

            employee: payableSalaryExcel,

            // employee: searchEmp,

        })



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

async function fetchData({ token, year, month, empId,subCompId, branchId, departmentId, designationId, empCode, subDepartmentId, paymentStatus, salaryFrom, salaryTo }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },

            method: 'POST',

            // url: 'http://localhost:5000/payableSalary/paybleSalaryExcel',

            url:`${process.env.BASE_URL}/payableSalary/paybleSalaryExcel`,

            data: { token, year, month, empId,subCompId, branchId, departmentId, designationId, empCode, subDepartmentId, paymentStatus, salaryFrom, salaryTo }

        }

        const response = await axios(config)

        return response.data;

    } catch (error) {

        throw error;

    }

}

async function createExcelFile(data) {

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Sheet1');

    let values = []

    let employee = data.employee

    let header = Object.keys(employee[0])

    values.push(header)

    employee.forEach(e => {

        let value = Object.values(e)

        values.push(value)

    });





    let wagesIndex = header.indexOf('Wages Payable (₹)')

    let len = header.length

    let row = new Array(len).fill('')

    row[wagesIndex] = data['totalWages']

    values.push(row)



    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);

    worksheet.eachRow((row) => {

        row.eachCell((cell) => {

            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

            cell.border = {

                top: { style: 'thin' },

                left: { style: 'thin' },

                bottom: { style: 'thin' },

                right: { style: 'thin' },

            };

            row.height = 40

        });

    });

    headerRow.eachCell(cell => {

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }

        cell.font = { bold: true };

    });

    for (let i = 1; i <= 1000; i++) {

        const column = worksheet.getColumn(i);

        column.width = 20; // Set the desired width in characters

    }

    const lastRow = worksheet.lastRow;

    lastRow.eachCell((cell, colNumber) => {

        cell.font = { bold: true };

    });

    return workbook.xlsx

}

async function getPayableSalaryExcelSheet(req, res) {

    try {

        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]

        let year = req.body.year || req.query.year

        let month = req.body.month || req.query.month

        let subCompId = req.body.subCompId || req.query.subCompId

        let branchId = req.body.branchId || req.query.branchId

        let departmentId = req.body.departmentId || req.query.departmentId

        let designationId = req.body.designationId || req.query.designationId

        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId

        let paymentStatus = req.body.paymentStatus || req.query.paymentStatus

        let salaryFrom = req.body.salaryFrom || req.query.salaryFrom

        let salaryTo = req.body.salaryTo || req.query.salaryTo

        let empCode = req.body.empCode || req.query.empCode

        let empId = req.body.empId || req.query.empId



        let apiData = await fetchData({

            token, year, month,empId, subCompId, branchId, departmentId, designationId, empCode, subDepartmentId, paymentStatus, salaryFrom, salaryTo

        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="payableSalary.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



module.exports = { getPayableSalaryExcel, getPayableSalaryExcelSheet }