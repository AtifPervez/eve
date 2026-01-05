let sequelize = require(("../config/db"))

const { QueryTypes } = require(('sequelize'))

const phpUnserialize = require('php-serialize');

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

    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId ', {

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



const getSalaryReportExcel = async (req, res) => {

    try {

        let data = req.body

        let { DB_NAME, finYear } = data

        let db = sequelize(DB_NAME)



        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignation as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName from eve_acc_employee as emp where emp.status="A"',

            {

                replacements: {}, type: QueryTypes.SELECT

            }

        )

        let salaryReport = await sequelize(DB_NAME).query('select * from  eve_acc_employee_payslip_preview where status="A" && isGenerated="yes"', {

            type: QueryTypes.SELECT

        })





        for (i in getData) {



            let e = getData[i]



            e.jan = 0

            e.feb = 0

            e.mar = 0

            e.apr = 0

            e.may = 0

            e.jun = 0

            e.jul = 0

            e.aug = 0

            e.sep = 0

            e.oct = 0

            e.nov = 0

            e.dec = 0

            e.totalSalary = 0

            // e.slNo = Number(+i + 1)

            e.createDate = ''

            e.paidDate = ''



            if (e.empId != null) {

                e.empId = e.empId.toString()

            }





            e.branchName = await getBranchNameByBranchId(e.branchName, db)

            if (e.branchName === undefined) {

                e.branchName = null

            }

            if (e.SubdepartmentName != null && e.SubdepartmentName != '') {

                e.SubdepartmentName = await getSubDepartmentNameBySubDepartmentId(e.SubdepartmentName, db)

            }



            e.actionList = []



            for (j in salaryReport) {





                let x = salaryReport[j]

                if (e.empId == x.employeeId && finYear == x.salaryOfYear && x.payrollStatus == 'Accept') {









                    if (x.salaryOfMonth == '04') {

                        let aprilObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += aprilObj.netPay



                        e.apr += aprilObj.netPay

                    }

                    else if (x.salaryOfMonth == '05') {

                        let mayObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += mayObj.netPay



                        e.may += mayObj.netPay

                    }

                    else if (x.salaryOfMonth == '06') {

                        let junObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += junObj.netPay



                        e.jun += junObj.netPay



                    }

                    else if (x.salaryOfMonth == '07') {

                        let julObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += julObj.netPay



                        e.jul += julObj.netPay

                    }

                    else if (x.salaryOfMonth == '08') {

                        let augObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += augObj.netPay



                        e.aug += augObj.netPay

                    }

                    else if (x.salaryOfMonth == '09') {

                        let sepObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += sepObj.netPay



                        e.sep += sepObj.netPay

                    }

                    else if (x.salaryOfMonth == '10') {

                        let octObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += octObj.netPay



                        e.oct += octObj.netPay

                    }

                    else if (x.salaryOfMonth == '11') {

                        let novObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += novObj.netPay



                        e.nov += novObj.netPay



                    }

                    else if (x.salaryOfMonth == '12') {

                        let decObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += decObj.netPay



                        e.dec += decObj.netPay

                    }





                    if (x.appriserId != '' && x.isAppriserAccepted == 'yes' && e.totalSalary > 0) {

                        e.actionList[0] = {

                            emp_id: `${await getEmployeeNameById(x.appriserId, db)}-${x.createdDateTime}`,

                            heading: 'R1',

                            status: 'Approved'

                        }

                    }

                    else if (x.reviewerId != '' && x.isReviewerAccepted == 'yes' && e.totalSalary > 0) {

                        e.actionList[0] = {

                            emp_id: `${await getEmployeeNameById(x.reviewerId, db)}-${x.createdDateTime}`,

                            heading: 'R2',

                            status: 'Approved'



                        }

                    }



                    else if (x.managerId != '' && x.isManagerAccepted == 'yes' && e.totalSalary > 0) {

                        e.actionList[0] = {

                            emp_id: `${await getEmployeeNameById(x.managerId, db)}-${x.createdDateTime}`,

                            heading: 'R3',

                            status: 'Approved'

                        }

                    }

                }

                if ((parseInt(finYear) + 1) == (parseInt(x.salaryOfYear)) && e.empId == x.employeeId && x.payrollStatus == 'Accept' && x.isGenerated == 'yes') {

                    if (x.salaryOfMonth == '01') {

                        let janObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += janObj.netPay

                        e.jan = janObj.netPay



                    }

                    else if (x.salaryOfMonth == '02') {

                        let febObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += febObj.netPay

                        e.feb += febObj.netPay

                    }

                    else if (x.salaryOfMonth == '03') {

                        let marObj = phpUnserialize.unserialize(x.salary_types)

                        e.totalSalary += marObj.netPay

                        e.mar += marObj.netPay

                    }

                    if (x.appriserId != '' && x.isAppriserAccepted == 'yes' && e.totalSalary > 0) {

                        e.actionList[0] = {

                            emp_id: `${await getEmployeeNameById(x.appriserId, db)}-${x.createdDateTime}`,

                            heading: 'R1',

                            status: 'Approved'

                        }

                    }

                    else if (x.reviewerId != '' && x.isReviewerAccepted == 'yes' && e.totalSalary > 0) {

                        e.actionList[0] = {

                            emp_id: `${await getEmployeeNameById(x.reviewerId, db)}-${x.createdDateTime}`,

                            heading: 'R2',

                            status: 'Approved'



                        }

                    }

                    else if (x.managerId != '' && x.isManagerAccepted == 'yes' && e.totalSalary > 0) {

                        e.actionList[0] = {

                            emp_id: `${await getEmployeeNameById(x.managerId, db)}-${x.createdDateTime}`,

                            heading: 'R3',

                            status: 'Approved'

                        }

                    }

                }

            }

        }



        let financialYearShow = `${finYear}-${parseInt(finYear) + 1}`



        getData.sort((a, b) => a.name.localeCompare(b.name));

        let limit = parseInt(req.body.limit) || getData.length

        let pageNo = parseInt(req.body.pageNo) || 1

        let startIndex = (pageNo - 1) * limit;

        let endIndex = startIndex + limit;

        let paginatedData = getData.slice(startIndex, endIndex);



        let jan = 0, feb = 0, mar = 0, apr = 0, may = 0, jun = 0, jul = 0, aug = 0, sep = 0, oct = 0, nov = 0, dec = 0



        // for (let i = startIndex; i < endIndex; i++) {

        //     let e = getData[i]



        //         jan += e.jan, feb += e.feb, mar += e.mar, apr += e.apr, may += e.may, jun += e.jun, jul += e.jul, aug += e.aug, sep += e.sep, oct += e.oct, nov += e.nov, dec += e.dec



        //     }



        let index = startIndex

        while (index < endIndex && index < getData.length) {

            let e = getData[index]

            jan += e.jan, feb += e.feb, mar += e.mar, apr += e.apr, may += e.may, jun += e.jun, jul += e.jul, aug += e.aug, sep += e.sep, oct += e.oct, nov += e.nov, dec += e.dec



            index++



        }



        paginatedData.map((e, i) => {

            e.slNo = Number(i + 1)

        })

        getData.map((e) => {

            if (e.jan == 0) {

                e.jan = '--'

            }

            e.jan = formatAmount(e.jan)



            if (e.feb == 0) {

                e.feb = '--'

            }

            e.feb = formatAmount(e.feb)



            if (e.mar == 0) {

                e.mar = '--'

            }

            e.mar = formatAmount(e.mar)



            if (e.apr == 0) {

                e.apr = '--'

            }



            e.apr = formatAmount(e.apr)



            if (e.may == 0) {

                e.may = '--'

            }



            e.may = formatAmount(e.may)





            if (e.jun == 0) {

                e.jun = '--'

            }



            e.jun = formatAmount(e.jun)



            if (e.jul == 0) {

                e.jul = '--'

            }

            e.jul = formatAmount(e.jul)





            if (e.aug == 0) {

                e.aug = '--'

            }



            e.aug = formatAmount(e.aug)





            if (e.sep == 0) {

                e.sep = '--'

            }



            e.sep = formatAmount(e.sep)





            if (e.oct == 0) {

                e.oct = '--'

            }

            e.oct = formatAmount(e.oct)





            if (e.nov == 0) {

                e.nov = '--'

            }



            e.nov = formatAmount(e.nov)



            if (e.dec == 0) {

                e.dec = '--'

            }

            e.dec = formatAmount(e.dec)



            jan = formatAmount(jan)

            feb = formatAmount(feb)

            mar = formatAmount(mar)

            apr = formatAmount(apr)

            may = formatAmount(may)

            jun = formatAmount(jun)

            jul = formatAmount(jul)

            aug = formatAmount(aug)

            sep = formatAmount(sep)

            oct = formatAmount(oct)

            nov = formatAmount(nov)

            dec = formatAmount(dec)







            // e.totalSalary = (`${e.totalSalary}.00`)

            e.totalSalary = formatAmount(e.totalSalary)

            if (e.actionList.length == 0) {

                e.actionList[0] = {

                    heading: ''

                }

            }

            delete e.actionList



        })

        // "jan": "--",

        // "feb": "--",

        // "mar": "--",

        // "apr": "--",

        // "may": "--",

        // "jun": "--",

        // "jul": "--",

        // "aug": "--",

        // "sep": "--",

        // "oct": "--",

        // "nov": "--",

        // "dec": "--",

        let salaryReportExcel = paginatedData.map((e, i) => ({

            'Sl No': Number(i + 1),

            'Employee Code': e.employeeCode,

            'Employee Name':e.name,

            'Sub Company':e.subCompanyName,

            'Branch Name':e.branchName,

            'Department':e.departmentName,

            'Sub Department':e.SubdepartmentName,

            'Designation':e.designationName,

            'April':e.apr,

            'May':e.may,

            'June':e.jun,

            'July':e.jul,

            'August':e.aug,

            'September':e.sep,

            'October':e.oct,

            'November':e.nov,

            'December':e.dec,

            'January':e.jan,

            'February':e.feb,

            'March':e.mar,

            'Total':e.totalSalary







        }))

        return res.status(200).send({

            // totalData: limit,

            // employeeList: paginatedData,

            employeeList: salaryReportExcel,

            April: apr, 

            May: may, 

            June: jun, 

            July: jul, 

            August: aug, 

            September: sep, 

            October: oct, 

            November: nov, 

            December: dec,

            January: jan, 

            February: feb, 

            March: mar, 

        })



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}





async function fetchData({ pageNo, limit, finYear }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'GET',

           

            url:`${process.env.BASE_URL}/report/getSalaryReportExcel`,

            data: { pageNo, limit, finYear }

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

    let employeeList = data.employeeList

    let header = Object.keys(employeeList[0])



    values.push(header)

    employeeList.forEach(e => {

        let value = Object.values(e)



        values.push(value)

    });



    let aprIndex = header.indexOf('April')

    let len = header.length



    for (let i in data) {

        if (i != 'employeeList') {

            let row = new Array(len).fill('')

            row[aprIndex - 1] = i

            row[aprIndex] = data[i]

            values.push(row)

        }

    }

    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.font = { bold: true };

    });









    return workbook.xlsx

}



async function getSalaryReportExcelSheet(req, res) {

    try {

        // let limit = parseInt(req.query.limit) || 100

        // let pageNo = parseInt(req.query.pageNo) || 1

        let finYear = req.query.finYear



        let apiData = await fetchData({ finYear })

        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="salaryReport ${finYear}.xlsx"`);

     

        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}





module.exports = { getSalaryReportExcel, getSalaryReportExcelSheet }