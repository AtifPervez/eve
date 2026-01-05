let sequelize = require(("../config/db"))

const { QueryTypes } = require(('sequelize'))

const axios = require('axios')

const ExcelJS = require('exceljs')





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



const getAttendanceRegularizationReportExcel = async (req, res) => {

    try {

        let data = req.body

        let { DB_NAME } = data

        let db = sequelize(DB_NAME)

        let getData = await db.query('select  emp.id as employeeId,emp.employeeName as name,emp.employeeSubcompanyName as subcompany,emp.employeeDepartment as Department,emp.employeeDesignationId as Designation,emp.employeeBranchId as Branch,emp.employeeCode,emp.employeeSubDepartmentId as SubDepartment,self.mm,self.yyyy,self.used as creditUsed,self.remaining as creditremain,self.creadit_month as creditDay from eve_acc_employee as emp left join eve_self_registration as self on emp.id=self.empId where emp.status="A" && self.status="A"',

            {

                replacements: {}, type: QueryTypes.SELECT

            }

        )

        for (i in getData) {

            let e = getData[i]



            if (e.employeeId != null) {

                e.employeeId = e.employeeId.toString()

            }



            e.Designation = await getDesignationNameById(e.Designation, db)

            if (e.Designation === undefined) {

                e.Designation = null

            }

            e.Branch = await getBranchNameByBranchId(e.Branch, db)

            if (e.Branch === undefined) {

                e.Branch = null

            }

            if (e.SubDepartment != null && e.SubDepartment != '') {

                e.SubDepartment = await getSubDepartmentNameBySubDepartmentId(e.SubDepartment, db)

            }

            if (e.mm == '01') {

                e.mm = `Jan-${e.yyyy}`

            }

            else if (e.mm == '02') {

                e.mm = `Feb-${e.yyyy}`

            }

            else if (e.mm == '03') {

                e.mm = `March-${e.yyyy}`

            }

            else if (e.mm == '04') {

                e.mm = `April-${e.yyyy}`

            }

            else if (e.mm == '05') {

                e.mm = `May-${e.yyyy}`

            }

            else if (e.mm == '06') {

                e.mm = `June-${e.yyyy}`

            }

            else if (e.mm == '07') {

                e.mm = `July-${e.yyyy}`

            }

            else if (e.mm == '08') {

                e.mm = `Aug-${e.yyyy}`

            }

            else if (e.mm == '09') {

                e.mm = `Sep-${e.yyyy}`

            }

            else if (e.mm == '10') {

                e.mm = `Oct-${e.yyyy}`

            }

            else if (e.mm == '11') {

                e.mm = `Nov-${e.yyyy}`

            }

            else if (e.mm == '12') {

                e.mm = `Dec-${e.yyyy}`

            }

        }



        getData.sort((a, b) => a.name.localeCompare(b.name));

        getData.map((x, i) => {

            x.slNo = Number(i + 1)

            delete x.yyyy

            delete x.employeeId

        })



        res.status(200).send({

            status: true,

            totalData: getData.length,

            getlistArray: getData

        })



    } catch (error) {

        return res.status(500).json({ status: false, msg: error.message })

    }

}



async function fetchData({ pageNo, limit, finYear }) {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'GET',

            // url: 'http://localhost:3000/report/getAttendanceRegularizationReportExcel',

            url:`${process.env.BASE_URL}/report/getAttendanceRegularizationReportExcel`,

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

    let getlistArray = data.getlistArray

    let header = Object.keys(getlistArray[0])



    values.push(header)

    getlistArray.forEach(e => {

        let value = Object.values(e)



        values.push(value)

    });



    // let janIndex = header.indexOf('jan')

    // let len = header.length



    // for (let i in data) {

    //     if (i != 'employeeList') {

    //         let row = new Array(len).fill('')

    //         row[janIndex - 1] = i

    //         row[janIndex] = data[i]

    //         values.push(row)

    //     }

    // }

    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.font = { bold: true };

    });









    return workbook.xlsx

}



async function getAttendanceRegularizationReportExcelSheet(req, res) {

    try {

        let limit = parseInt(req.query.limit) || 100

        let pageNo = parseInt(req.query.pageNo) || 1

        let finYear = req.query.finYear



        let apiData = await fetchData({ pageNo, limit, finYear })

        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', 'attachment; filename="attendanceRegularizationReportExcelSheet.xlsx"');



        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}



module.exports = { getAttendanceRegularizationReportExcel, getAttendanceRegularizationReportExcelSheet }