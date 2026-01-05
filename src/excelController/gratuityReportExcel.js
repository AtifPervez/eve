let sequelize = require(('../config/db'))

const { QueryTypes, NUMBER } = require('sequelize')

const moment = require('moment')

let DB_NAME

const axios = require('axios')

const ExcelJS = require('exceljs')



async function getEmployeeNameById(id) {

    let employeeName = await sequelize(DB_NAME).query('select employeeName as name from eve_acc_employee where id=:id', {

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

const getGratuityReportExcel = async (req, res) => {

    try {

        let data = req.body

        let { month, year } = data





        let getData = await sequelize(DB_NAME).query('select distinct emp.id as empId,emp.employeeName,emp.employeeSubcompanyName ,emp.employeeSubDepartmentId as SubDepartmentId,emp.employeeBranchId,emp.employeeCode,emp.employeeBranchName,emp.employeeDepartment,emp.employeeDepartmentId,emp.employeeSubCompanyId,emp.employeeDesignation,emp.employeeDesignationId,emp.employeeSubDepartmentId,emp.gratuityAct,emp.employeeDoj,gratuity.month,gratuity.year,gratuity.form,gratuity.paymentStatus,emp.salaryTemplateId,gratuity.amount,gratuity.holdRemarks,gratuity.appriserIdStatus ,gratuity.reviewerIdStatus,gratuity.managerIdStatus,gratuityRep.appriserId,gratuityRep.reviewerId,gratuityRep.managerId,gratuityRep.approvalRequired,gratuityPay.paymentBy,gratuityPay.paymentMode,gratuityPay.dateOfPayment as paidDate,gratuity.approveStatus from eve_acc_employee as emp left join eve_gratuity_list_setting as gratuity on emp.id=gratuity.empId left join eve_acc_employee_gratuity_report as gratuityRep on emp.id=gratuityRep.empId left join eve_gratuity_payment_details as gratuityPay on emp.id=gratuityPay.empId', {

            type: QueryTypes.SELECT

        })



        let branchDb = await sequelize(DB_NAME).query('select * from eve_acc_company_branch where status="A" ', {

            type: QueryTypes.SELECT

        })





        if (!month) {

            return res.status(400).send({ status: false, msg: 'month and year must be present' })

        }

        if (!year) {

            return res.status(400).send({ status: false, msg: 'month and year must be present' })

        }





        getData.map((e) => {

            branchDb.map((x) => {

                if (e.BranchId == x.branchId) {

                    e.employeeBranchName = x.branchName

                }

            })

        })



        getData = getData.filter((e) => {

            if (e.month == month && e.year == year) {

                return e

            }

        })



        getData.map(async (e, i) => {

            e.slNo = Number(i + 1)

            e.empId = e.empId.toString()

            e.r1 = ''

            e.r2 = ''

            e.r3 = ''

            e.employeeSubCompanyId = e.employeeSubCompanyId.toString()

            if (e.paymentStatus == 'Paid') {

                e.color = 'green'

            }

            else if (e.paymentStatus == 'Unpaid') {

                e.color = 'red'

            }

            else if (e.paymentStatus == 'Hold') {

                e.color = '#fcc203'

            }

            //



            if (e.approvalRequired == 'all') {

                if (e.appriserIdStatus == 'yes' && e.managerIdStatus == 'yes' && e.reviewerIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.appriserId != null && e.reviewerId == null && e.managerId == null && e.appriserIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }



                if (e.appriserId == null && e.reviewerId != null && e.managerId == null && e.reviewerIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.appriserId == null && e.reviewerId == null && e.managerId != null && e.managerIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.appriserId != null && e.reviewerId != null && e.managerId == null && e.appriserIdStatus == 'yes' && e.reviewerIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.appriserId == null && e.reviewerId != null && e.managerId != null && e.managerIdStatus == 'yes' && e.reviewerIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.appriserId != null && e.reviewerId == null && e.managerId != null && e.managerIdStatus == 'yes' && e.appriserIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.approveStatus == 'A') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

            }

            if (e.approvalRequired == 'anyone') {

                if (e.managerIdStatus == 'yes' || e.appriserIdStatus == 'yes' || e.reviewerIdStatus == 'yes') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }

                if (e.approveStatus == 'A') {

                    e.approvalStatus = 'Approved'

                    e.statusColor = 'green'

                }



            }



        })





        for (let i = 0; i < getData.length; i++) {

            if (getData[i].appriserIdStatus == 'yes' && getData[i].appriserId != null) {

                getData[i].r1 = await getEmployeeNameById(getData[i].appriserId)

                getData[i].r1Status = 'Approved'

            }

            else if (getData[i].appriserIdStatus == '' && getData[i].appriserId != null) {

                getData[i].r1Status = 'Pending'

            }

            else if (getData[i].appriserIdStatus == 'no' && getData[i].appriserId != null) {

                getData[i].r1Status = 'Rejected'

            }







            if (getData[i].reviewerIdStatus == 'yes') {

                getData[i].r2 = await getEmployeeNameById(getData[i].reviewerId)

                getData[i].r2Status = 'Approved'

            }

            else if (getData[i].reviewerIdStatus == '' && getData[i].reviewerId != null) {

                getData[i].r2Status = 'Pending'

            }

            else if (getData[i].reviewerIdStatus == 'no' && getData[i].reviewerId != null) {

                getData[i].r2Status = 'Rejected'

            }











            if (getData[i].managerIdStatus == 'yes') {

                getData[i].r3 = await getEmployeeNameById(getData[i].managerId)

                getData[i].r3Status = 'Approved'

            }

            else if (getData[i].managerIdStatus == '' && getData[i].managerId != null) {

                getData[i].r3Status = 'Pending'

            }

            else if (getData[i].managerIdStatus == 'no' && getData[i].managerId != null) {

                getData[i].r3Status = 'Rejected'

            }

        }



        await Promise.all(getData.map(async (e) => {

            e.paymentBy = await getEmployeeNameById(e.paymentBy)

            delete e.month

            delete e.year

            delete e.appriserId

            delete e.reviewerId

            delete e.managerId

            delete e.empId

            delete e.employeeBranchId

            delete e.employeeDepartmentId

            delete e.employeeSubCompanyId

            delete e.employeeDesignationId

            delete e.employeeSubDepartmentId

            delete e.gratuityAct

            delete e.employeeDoj

            delete e.form

            delete e.salaryTemplateId

            delete e.holdRemarks

            delete e.appriserIdStatus

            delete e.reviewerIdStatus

            delete e.managerIdStatus

            delete e.approvalRequired

            delete e.approveStatus

            delete e.slNo

            delete e.r2

            delete e.r3

            delete e.r1

            delete e.SubDepartmentId

            delete e.color

            delete e.statusColor

            delete e.r1Status

            delete e.r2Status

        }))



        return res.status(200).send({

            status: true,

            totalData: getData.length,

            gratuityList: getData

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

          

            url:`${process.env.BASE_URL}/report/getGratuityReportExcel`,

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

    let gratuityList = data.gratuityList

    let header = Object.keys(gratuityList[0])







    values.push(header)

    gratuityList.forEach(e => {

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



async function getGratuityReportExcelSheet(req, res) {

    try {

        let month = req.body.month

        let year = req.body.year

    

            let apiData = await fetchData({ year, month })

            let getExcel = createExcelFile(apiData)



            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            res.setHeader('Content-Disposition', 'attachment; filename="gratuityReportExcelSheet.xlsx"');

            (await getExcel).write(res)



    

    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })

    }

}

module.exports = { getGratuityReportExcel, getGratuityReportExcelSheet }