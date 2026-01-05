let sequelize = require("../config/db")

const { QueryTypes } = require('sequelize')

const moment = require('moment')

const axios = require('axios')

const ExcelJS = require('exceljs')



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

const getBranchNameByBranchId = async (id, db) => {

    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId  ', {

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





const getCompanyPolicyAcceptanceExcel = async (req, res) => {

    try {

        let data = req.body

        let { DB_NAME } = data

        let db = sequelize(DB_NAME)



        let getData = await db.query('select  emp.id as empId,emp.employeeName as name,emp.employeeSubcompanyName as subCompanyName ,emp.employeeDepartment as departmentName,emp.employeeDesignationId as designationName,emp.employeeBranchId as branchName,emp.employeeCode,emp.employeeSubDepartmentId as SubdepartmentName,emp.employeeSubCompanyId,emp.employmentLeaveType as employmentLeaveTypeId from eve_acc_employee as emp where emp.status="A"', { replacements: {}, type: QueryTypes.SELECT })



        let compPolicy = await sequelize(DB_NAME).query('select * from eve_hrm_company_policy where status="A"', {

            type: QueryTypes.SELECT

        })

        let compPolicyAccept = await db.query('select * from eve_company_policy_accept', {

            type: QueryTypes.SELECT

        })

        let policyList = []

        await Promise.all(getData.map(async (e, i) => {

            e.policyList = []

            // e.slNo = Number(i + 1)

            e.empId = e.empId.toString()





            if (e.employeeSubCompanyId != null) {

                e.employeeSubCompanyId = e.employeeSubCompanyId.toString()

            }





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

            compPolicy.map((x) => {

                if (e.employeeSubCompanyId == x.subCompanyId.split(',')) {

                    e.policyList.push({

                        employeeName: e.name,

                        employeeCode:e.employeeCode,

                        subCompanyName:e.subCompanyName,

                        branchName:e.branchName,

                        departmentName:e.departmentName,

                        designationName:e.designationName,

                        SubdepartmentName:e.SubdepartmentName,

                        policyName: x.title,

                        acceptDate: 'NA',

                        empId: e.empId,

                        status: 'Pending'

                    })

                }

            })

            compPolicyAccept.map((k) => {

                for (let i = 0; i < e.policyList.length; i++) {

                    if (e.policyList[i].policyId == k.policyId && e.empId == k.empId) {

                        e.policyList[i].acceptDate = k.submitDate

                        e.policyList[i].status = 'Accepted'

                        policyList.push(e.policyList[i])

                    }

                }

            })



        }))



        getData.sort((a, b) => a.name.localeCompare(b.name))



        let arr = []

        for (let i = 0; i < getData.length; i++) {

            arr.push(getData[i].policyList)

        }



        let mergedArray = arr.reduce((acc, curr) => acc.concat(curr), []);



        return res.status(200).send({

            status: true,

            totalData: mergedArray.length,

            getlistArray: mergedArray,

        })



    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}







async function fetchData() {

    try {

        const config = {

            headers: { 'Content-Type': 'application/json' },

            method: 'GET',

            // url: 'http://localhost:3000/report/getCompanyPolicyAcceptanceExcel',

            url:`${process.env.BASE_URL}/report/getCompanyPolicyAcceptanceExcel`,

            // data: { pageNo, limit, finYear }

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



    

    worksheet.addRows(values)

    const headerRow = worksheet.getRow(1);



    headerRow.eachCell(cell => {

        cell.font = { bold: true };

    });









    return workbook.xlsx

}



async function getCompanyPolicyAcceptanceExcelSheet(req, res) {

    try {

       



        let apiData = await fetchData()

        let getExcel = createExcelFile(apiData)



        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        res.setHeader('Content-Disposition', 'attachment; filename="CompanyPolicyAcceptanceExcelSheet.xlsx"');



        (await getExcel).write(res)





    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getCompanyPolicyAcceptanceExcel,getCompanyPolicyAcceptanceExcelSheet }