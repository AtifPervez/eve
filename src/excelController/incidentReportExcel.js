

const axios = require('axios')

const ExcelJS = require('exceljs')

let sequelize = require(("../config/db"))

const { QueryTypes } = require(('sequelize'))



const getEmployeeNameById = async (id, db) => {

    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id && status="A"', {

        replacements: {

            id: id,

        },

        type: QueryTypes.SELECT

    })

    let res = Object.values(employeeName[0])

    let newRes = (res.toString());

    return newRes

}

const getBranchNameByBranchId = async (id, db) => {

    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {

        replacements: {

            branchId: id,

        },

        type: QueryTypes.SELECT

    })

    if(branchName[0]){



        let res = Object.values(branchName[0])

        let newRes = (res.toString())

        return newRes

    }

}

const getDesignationNameById = async (id, db) => {

    let designationName = await db.query('select name  from eve_acc_designation where id=:id &&status="A"', {

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



const getIncidentReportExcel = async (req, res) => {

    try {

        let data = req.body

        let { DB_NAME } = data

        let db = sequelize(DB_NAME)



        //eve_acc_employee as emp





        let getData = await db.query('select distinct emp.employeeName as EmployeeName,emp.employeeSubcompanyName as subcompany,emp.employeeDepartment as Department,inc.Branch,inc.slno,inc.CreatedDatetime,inc.Description,inc.Designation,inc.EmployeeName as empId,inc.incidentDateTime,inc.taggedBy,inc.taggedEmployees,inc.Designation from eve_incident_report as inc left join eve_acc_employee as emp on emp.id=inc.EmployeeName  where inc.status="A" && emp.status="A"',

            {

                replacements: {}, type: QueryTypes.SELECT

            }

        )



        for (let i in getData) {



            let e = getData[i]



            getData[i].id = Number(+i + 1)



            if (getData[i].taggedBy != null) {

                getData[i].taggedBy = await getEmployeeNameById(getData[i].taggedBy, db)

            }







            if (e.Designation != null && e.Designation != '') {

                e.Designation = await getDesignationNameById(e.Designation, db)

            }

            if (e.Designation == undefined) {

                e.Designation = null

            }

         

            e.Branch=await getBranchNameByBranchId(e.Branch,db)



            







            if (e.taggedEmployees != null && e.taggedEmployees != '') {



                let arr = e.taggedEmployees.split(',')



                let newArr = []

                for (let j in arr) {

                    let employeeName = await getEmployeeNameById(arr[j], db)

                    newArr.push(employeeName)

                }

                e.taggedEmployees = newArr.join(',')

            }

        }



        getData.map((e) => {

            delete e.empId

            delete e.slno

            delete e.id

        })





      



        return res.status(200).json({

            totalData: getData.length,

            report: getData

        })



    } catch (error) {

        return res.status(500).json({ status: false, msg: error.message })

    }

}







async function fetchData() {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'GET',

           

            url:`${process.env.BASE_URL}/report/getIncidentReportExcel`,

            data: {}

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

    let report = data.report

    let header = Object.keys(report[0])



    values.push(header)

    report.forEach(e => {

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



async function getIncidentReportExcelSheet(req, res) {

    try {



        let apiData = await fetchData()

        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', 'attachment; filename="Incident-Report-ExcelSheet.xlsx"');



        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getIncidentReportExcel,getIncidentReportExcelSheet}

