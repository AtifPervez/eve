let sequelize = require(('../config/db'))
const { QueryTypes, NUMBER } = require('sequelize')
const moment = require('moment')
let DB_NAME

async function getEmployeeNameById(id) {
    let employeeName = await sequelize(DB_NAME).query('select employeeName as name from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    let res = Object.values(employeeName[0])
    let newRes = (res.toString());
    return newRes
}
const getGratuityReport = async (req, res) => {
    try {
        let data = req.body
        let { month, year } = data
        let getData = await sequelize(DB_NAME).query('select distinct emp.id as empId,emp.employeeName,emp.employeeSubcompanyName ,emp.employeeSubDepartmentId as SubDepartmentId,emp.employeeBranchId,emp.employeeCode,emp.employeeBranchName,emp.employeeDepartment,emp.employeeDepartmentId,emp.employeeSubCompanyId,emp.employeeDesignation,emp.employeeDesignationId,emp.employeeSubDepartmentId,emp.gratuityAct,emp.employeeDoj,gratuity.month,gratuity.year,gratuity.form,gratuity.paymentStatus,emp.salaryTemplateId,gratuity.amount,gratuity.holdRemarks,gratuity.appriserIdStatus ,gratuity.reviewerIdStatus,gratuity.managerIdStatus,gratuityRep.appriserId,gratuityRep.reviewerId,gratuityRep.managerId,gratuityRep.approvalRequired,gratuityPay.paymentBy,gratuityPay.paymentMode,gratuityPay.dateOfPayment as paidDate,gratuity.approveStatus from eve_acc_employee as emp left join eve_gratuity_list_setting as gratuity on emp.id=gratuity.empId left join eve_acc_employee_gratuity_report as gratuityRep on emp.id=gratuityRep.empId left join eve_gratuity_payment_details as gratuityPay on emp.id=gratuityPay.empId', {
            type: QueryTypes.SELECT
        })
        let branchDb = await sequelize(DB_NAME).query('select * from eve_acc_company_branch where status="A" ', {
            type: QueryTypes.SELECT
        })

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
                if(e.approveStatus=='A'){
                    e.approvalStatus = 'Approved'
                    e.statusColor = 'green'
                }
            }
            if (e.approvalRequired == 'anyone') {
                if (e.managerIdStatus == 'yes' || e.appriserIdStatus == 'yes' || e.reviewerIdStatus=='yes') {
                    e.approvalStatus = 'Approved'
                    e.statusColor = 'green'
                }
                if(e.approveStatus=='A'){
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



        getData.map((e) => {
            delete e.month
            delete e.year
            delete e.appriserId
            delete e.reviewerId
            delete e.managerId
        })



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
            gratuityList: paginatedData
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })

    }
}
module.exports = { getGratuityReport }