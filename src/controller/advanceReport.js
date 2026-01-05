let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')
let DB_NAME

function formatAmount(numericString) {

    if (numericString != null) {
        let numericValue = numericString
        let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return formattedString
    }
}


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



async function getSubDepartmentNameByParentId(parentId) {
    let departmentName = await sequelize(DB_NAME).query('select name from  eve_acc_department where id=:id', {
        replacements: {
            id: parentId,
        },
        type: QueryTypes.SELECT
    })
    return departmentName[0]
}

const getAllAdvanceReport = async (req, res) => {
    try {

        let data = req.body
        let { DB_NAME, year, month } = data

        let totalApprove = 0
        let totalReject = 0
        let totalPaid = 0
        let totalUnpaid = 0
        let totalApplied = 0

        //eve_acc_employee = employee
        //eve_acc_employee_advance = empAdvance
        //eve_acc_department as empDep
        //eve_acc_employee_advance_payment=empAdvancePay
        
        let getData = await await sequelize(DB_NAME).query('select employee.id as employeeId,employee.employeeName,employee.employeeCode,employee.employeeSubcompanyName,employee.employeeDepartment,employee.employeeDesignation,employee.employeeBranchId,employee.employeeBranchName,employee.employeeBranchName as branchNameAttr ,employee.employeeDepartmentId,employee.employeeDesignation,employee.employeeDesignationId,employee.employeeSubCompanyId,empAdvance.applyDate as date,empAdvance.amount, empAdvance.description,empDep.name as subDepartmentName,empAdvance.id,empAdvancePay.paymentStatus           from eve_acc_employee as employee left join eve_acc_employee_advance as empAdvance on employee.id=empAdvance.employeeId left join eve_acc_department as empDep on employee.id=empDep.parentId left join eve_acc_employee_advance_payment as empAdvancePay on empAdvance.id=empAdvancePay.advanceId  where employee.status="A" && empAdvance.status="A"  ', {
            type: QueryTypes.SELECT
        })

        getData.map((value, i) => {
            getData[i].employeeSubCompanyId = (getData[i].employeeSubCompanyId).toString()
            getData[i].employeeId = (getData[i].employeeId).toString()
            getData[i].actionList = []


            return value
        })



        let advanceReportArr = []
        for (let i = 0; i < getData.length; i++) {
            let dateString = getData[i].date
            let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
            let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
            let monthBy = date.format('MM', "MM-DD-YYYY").toString();

            if (getData[i].date !== null && yearBy === year && monthBy === month) {
                advanceReportArr.push(getData[i])

            }
        }


        let empAdvance = await sequelize(DB_NAME).query('select * from eve_acc_employee_advance where status="A" ',
            {
                replacements: {},
                type: QueryTypes.SELECT
            })




        for (let i = 0; i < advanceReportArr.length; i++) {

            advanceReportArr[i].slno = Number(i) + 1
            advanceReportArr[i].taStatus = ''
            advanceReportArr[i].color = ''
            advanceReportArr[i].remark = ''
            advanceReportArr[i].paymentBy = null
            advanceReportArr[i].dateOfPaymnet = ''
            advanceReportArr[i].transactionNo = null


            for (let j = 0; j < empAdvance.length; j++) {

                if (advanceReportArr[i].date == empAdvance[j].applyDate && advanceReportArr[i].amount == empAdvance[j].amount&&advanceReportArr[i].id==empAdvance[j].id) {


                    if(empAdvance[j].actionedBy!=null){
                        advanceReportArr[i].actionedBy=await getEmployeeNameById(empAdvance[j].actionedBy)
                    }
                    else{
                        advanceReportArr[i].actionedBy=null
                    }


                    if (advanceReportArr[i].amount != null) {

                        totalApplied += parseFloat(advanceReportArr[i].amount)
                    }


                    if (empAdvance[j].advanceStatus == 'Approved') {
                        advanceReportArr[i].taStatus = 'Approved'
                        advanceReportArr[i].taStatusColor = 'green'
                        totalApprove += parseInt(advanceReportArr[i].amount)
                    }

                    else if (empAdvance[j].advanceStatus == 'Rejected') {
                        advanceReportArr[i].taStatus = 'Rejected'
                        advanceReportArr[i].taStatusColor = 'red'
                        totalReject += parseInt(advanceReportArr[i].amount)

                    }
                    else if (empAdvance[j].advanceStatus == 'Waiting') {
                        advanceReportArr[i].taStatus = 'Pending'
                        advanceReportArr[i].taStatusColor = '#fcc203'
                    }


                    if (advanceReportArr[i].paymentStatus == 'paid') {
                        advanceReportArr[i].color = 'green'

                        totalPaid += parseInt(advanceReportArr[i].amount)
                    }
                    else if (advanceReportArr[i].paymentStatus == 'unpaid') {
                        advanceReportArr[i].color = 'red'

                        totalUnpaid += parseInt(advanceReportArr[i].amount)
                    }

                    // if (advanceReportArr[i].date == empAdvance[j].applyDate && advanceReportArr[i].amount == empAdvance[j].amount) {
                        if (empAdvance[j].appriserId != '' && empAdvance[j].isAppriserAccepted == 'yes') {
                            if (empAdvance[j].appriserId != null) {
                                advanceReportArr[i].actionList.push({
                                    heading: 'R1',
                                    name: await getEmployeeNameById(empAdvance[j].appriserId),
                                    status: 'Approved',
                                }

                                )
                            
                            }
                        }
                        else if (empAdvance[j].appriserId != '' && empAdvance[j].isAppriserAccepted == 'no') {
                            if (empAdvance[j].appriserId != null) {
                                advanceReportArr[i].actionList.push({
                                    heading: 'R1',
                                    name: await getEmployeeNameById(empAdvance[j].appriserId),
                                    status: 'Pending',
                                }
                                )


                            }
                        }
                        if (empAdvance[j].reviewerId != '' && empAdvance[j].isReviewerAccepted == 'yes') {
                            if (empAdvance[j].reviewerId != null) {
                                advanceReportArr[i].actionList.push({
                                    heading: 'R2',
                                    name: await getEmployeeNameById(empAdvance[j].reviewerId),
                                    status: 'Approved',
                                }
                                )

                            }
                        }
                        else if (empAdvance[j].reviewerId != '' && empAdvance[j].isReviewerAccepted == 'no') {
                            if (empAdvance[j].reviewerId != null) {
                                advanceReportArr[i].actionList.push({
                                    heading: 'R2',
                                    name: await getEmployeeNameById(empAdvance[j].reviewerId),
                                    status: 'Pending',
                                }
                                )

                            }
                        }
                        if (empAdvance[j].managerId != '' && empAdvance[j].isManagerAccepted == 'yes') {
                            if (empAdvance[j].managerId != null) {
                                advanceReportArr[i].actionList.push({
                                    heading: 'R3',
                                    name: await getEmployeeNameById(empAdvance[j].managerId),
                                    status: 'Pending',
                                }
                                )

                            }
                        }
                        else if (empAdvance[j].managerId != '' && empAdvance[j].isManagerAccepted == 'no') {
                            if (empAdvance[j].managerId != null) {
                                advanceReportArr[i].actionList.push({
                                    heading: 'R3',
                                    name: await getEmployeeNameById(empAdvance[j].managerId),
                                    status: 'Pending',
                                }
                                )

                            }
                        }
                    // }


                    if (empAdvance[j].modeOfPayment == 'monthly') {
                        advanceReportArr[i].paymentMode = 'Adjust With Monthly Salary'
                    }
                }
            }
        }

        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = advanceReportArr.slice(startIndex, endIndex);
        
         paginatedData.map((e)=>{
            e.amount=parseFloat(e.amount)
            e.amount=formatAmount(e.amount)
        })
        
        res.send({
            result: 'success',
            recordedPerPage:limit,
            totalData: advanceReportArr.length,
            totalApplied: formatAmount(totalApplied),
            totalApprove: formatAmount(totalApprove),
            totalPaid: formatAmount(totalPaid),
            totalUnpaid: formatAmount(totalUnpaid),
            items: paginatedData
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getAllAdvanceReport }