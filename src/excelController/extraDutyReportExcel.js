let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const moment = require('moment')

const axios = require('axios')

const ExcelJS = require('exceljs')

let DB_NAME



function removeDuplicates(objectsArray, key) {

    let uniqueObjects = [];

    let seenKeys = new Set();



    for (const obj of objectsArray) {

        if (!seenKeys.has(obj[key])) {

            uniqueObjects.push(obj);

            seenKeys.add(obj[key]);

        }

    }

    return uniqueObjects;

}





const allListTodayforReportExcel = async (req, res) => {

    try {

        let data = req.body

        let { DB_NAME, year, month } = data





        //eve_acc_employee = employee

        //eve_acc_employee_extra_duty_alocation = empDuty

        //eve_acc_department = empDep



        let getData = await sequelize(DB_NAME).query('select distinct employee.id as empId,employee.employeeName,employee.employeeCode as code,employee.employeeSubcompanyName as subcompanyName,employee.employeeDepartment as departmentName,employee.employeeDesignation as designationName,employee.employeeBranchId,employee.employeeBranchName as branchName,empDep.name as subDepartmentName  from  eve_acc_employee as employee right join eve_acc_employee_extra_duty_alocation as empDuty on employee.id=empDuty.empId left join eve_acc_department as empDep on employee.employeeSubDepartmentId=empDep.id  ', {

            type: QueryTypes.SELECT

        })



        let extraDutyDb = await sequelize(DB_NAME).query('select * from  eve_acc_employee_extra_duty_alocation where status="A"', {

            type: QueryTypes.SELECT

        })



        let arr = []

        getData.map((e, i) => {

            extraDutyDb.map((x) => {

                let dateString = x.workDate

                let date = moment(dateString)

                let yearBy = date.year()

                let monthBy = +date.month() + 1



                if (yearBy == year && monthBy == month && e.empId == x.empId) {

                    arr.push((getData[i]))

                }

            })

        })





        let extraDutyArr = removeDuplicates(arr, "empId");



        extraDutyArr.map((e, i) => {

            e.totalApprove = 0

            e.totalReject = 0

            e.totalWorkDays = 0





            e.empId = e.empId.toString()



            extraDutyDb.map((x) => {



                if (x.compoffStatus == 'A' && e.empId == x.empId) {

                    e.totalApprove += 1

                    e.totalWorkDays += 1

                }



                else if (x.compoffStatus == 'W' && e.empId == x.empId) {

                    e.totalReject += 1

                    e.totalWorkDays += 1

                }



            })

            return e

        })

        let limit = parseInt(req.body.limit) || extraDutyArr.length

        let pageNo = parseInt(req.body.pageNo) || 1

        let startIndex = (pageNo - 1) * limit;

        let endIndex = startIndex + limit;

        let paginatedData = extraDutyArr.slice(startIndex, endIndex);



        let extraDutyReport = paginatedData.map((e, i) => ({

            'Sl No': i + 1,

            'Employee Name': e.employeeName,

            'Sub Company': e.subcompanyName,

            'Branch': e.branchName,

            'Designation': e.designationName,

            'Employee Code': e.code,

            'Department': e.departmentName,

            'Sub Department': e.subDepartmentName,

            'Total Approve': e.totalApprove,

            'Total Reject': e.totalReject,

            'Total Work Days': e.totalWorkDays

        }))





        res.status(200).send({

            status: true,

            totalData: extraDutyArr.length,

            employee: extraDutyReport

            

        })



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



async function fetchData({ year, month }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'GET',

          

            url:`${process.env.BASE_URL}/report/getExtraDutyReportExcel`,

            data: { year, month }

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

    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.font = { bold: true };

    });

    return workbook.xlsx







}



async function allListTodayforReportExcelSheet(req, res) {

    try {

        let month = (req.body.month || req.query.month)

        let year = (req.body.year || req.query.year)



        let apiData = await fetchData({ year, month })

        let getExcel = createExcelFile(apiData)



        if (month == '01') {

            month = 'Jan'

        }

        else if (month == '02') {

            month = 'Feb'

        }

        else if (month == '03') {

            month = 'March'

        }

        else if (month == '04') {

            month = 'Apr'

        }

        else if (month == '05') {

            month = 'May'

        }

        else if (month == '06') {

            month = 'June'

        }

        else if (month == '07') {

            month = 'July'

        }

        else if (month == '08') {

            month = 'Aug'

        }

        else if (month == '09') {

            month = 'Sep'

        }

        else if (month == '10') {

            month = 'Oct'

        }

        else if (month == '11') {

            month = 'Nov'

        }

        else if (month == '12') {

            month = 'Dec'

        }



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', `attachment; filename="extraDutyReport ${month}-${year}.xlsx"`);

        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { allListTodayforReportExcel, allListTodayforReportExcelSheet }