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


const getAllReimbursmentReport = async (req, res) => {
    try {
        let totalPaid = 0
        let totalUnPaid = 0
        let totalApplied = 0
        let totalPending = 0
        let totalReject = 0
        let totalApprove = 0
        //eve_acc_employee=employee
        //eveserverind_main.eve_main_reimburshment=reiburshment
        //eve_hrm_reimburshment_payment_details = reimburshmentDetails
        //eve_acc_company_branch=empBranch
        //eve_main_reimburshment_type=rmburshmntType 
        let data = req.body
        let { DB_NAME, year, month } = data
        let getData = await sequelize(DB_NAME).query('select distinct employee.id as employeeId,employee.employeeName,employee.employeeCode,employee.employeeSubcompanyName,employee.employeeDepartment,employee.employeeDesignation,employee.employeeBranchId,employee.employeeBranchName,employee.employeeDepartmentId,employee.employeeDesignation,employee.employeeDesignationId,employee.employeeSubCompanyId,employee.employeeSubCompanyId as id,reiburshment.date,reiburshment.userId,reiburshment.type,reiburshment.mobile,reiburshment.amount,reiburshment.companyId,reiburshment.mainUserId,reiburshment.paymentStatus,reimburshmentDetails.paymentMode,reimburshmentDetails.paymentBy,reimburshmentDetails.dateOfPayment, reiburshment.fileName as document, reimburshmentDetails.remarks,reimburshmentDetails.id,empBranch.branchName,rmburshmntType.typeName       from eve_acc_employee as employee  left join eveserverind_main.eve_main_reimburshment as reiburshment  on employee.id=reiburshment.userId left join eve_hrm_reimburshment_payment_details as reimburshmentDetails on reiburshment.id=reimburshmentDetails.reimburshmentId left join eve_acc_company_branch as empBranch on employee.employeeBranchId=empBranch.branchId left join eveserverind_main.eve_main_reimburshment_type as rmburshmntType on reiburshment.type=rmburshmntType.id     where employee.status="A" && reiburshment.status="A" && reimburshmentDetails.status="A"',
            {
                replacements: {},
                type: QueryTypes.SELECT
            })

        let eve_main_reimburshment = await sequelize("eveserverind_main").query('select * from eve_main_reimburshment where status="A" ',
            {
                replacements: {},
                type: QueryTypes.SELECT
            })


        let reiburshmentArr = []
        for (let i = 0; i < getData.length; i++) {
            let dateString = getData[i].date
            let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
            let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
            let monthBy = date.format('MM', "MM-DD-YYYY").toString();

            if (getData[i].date !== null && yearBy === year && monthBy === month) {
                reiburshmentArr.push(getData[i])

            }
        }
        reiburshmentArr = reiburshmentArr.map((value, i) => {
            value.slno = Number(i) + 1
            return value
        })

        reiburshmentArr.map(async (value, i) => {
            value.employeeSubCompanyId = value.employeeSubCompanyId.toString()

            if (reiburshmentArr[i].paymentStatus == 'paid') {
                reiburshmentArr[i].paymentColor = 'green'
                totalPaid += parseInt(reiburshmentArr[i].amount)
            }
            else if (reiburshmentArr[i].paymentStatus == 'unpaid') {
                reiburshmentArr[i].paymentColor = 'red'
                totalUnPaid += parseInt(reiburshmentArr[i].amount)
            }
            totalApplied += parseInt(reiburshmentArr[i].amount)
            return value
        })

        for (let i = 0; i < reiburshmentArr.length; i++) {
            reiburshmentArr[i].paymentBy = await getEmployeeNameById((reiburshmentArr[i].paymentBy))
            reiburshmentArr[i].actionList = []
            reiburshmentArr[i].documentLink = ''

            if (reiburshmentArr[i].document == '' || reiburshmentArr[i].document == null) {
                reiburshmentArr[i].document = ''
            }
            if (reiburshmentArr[i].document == '' || reiburshmentArr[i].document == null) {

                reiburshmentArr[i].documentLink = ''

            }
            else {
                reiburshmentArr[i].documentLink = `http//www.eveserver.ind.in/eve/upload/${reiburshmentArr[i].document}`
            }
            reiburshmentArr[i].r1 = null
            reiburshmentArr[i].r2 = null

            reiburshmentArr[i].r3 = null

        }

        for (let i = 0; i < reiburshmentArr.length; i++) {
            for (let j = 0; j < eve_main_reimburshment.length; j++) {
                let reimburshmentdb = eve_main_reimburshment

                if (reiburshmentArr[i].date == reimburshmentdb[j].date && reiburshmentArr[i].amount == reimburshmentdb[j].amount) {

                    if (reimburshmentdb[j].approveStatus == 'W') {
                        reiburshmentArr[i].approveStatus = 'Waiting'
                        reiburshmentArr[i].status = '----'
                        reiburshmentArr[i].color = '#fcc203'
                        reiburshmentArr[i].statusUnderscoreColor = '#fcc203'
                        totalPending += parseInt(reimburshmentdb[j].amount)

                    }
                    else if (reimburshmentdb[j].approveStatus == 'C') {
                        reiburshmentArr[i].approveStatus = 'Rejected'
                        reiburshmentArr[i].status = 'Reimbursement is rejected.'
                        reiburshmentArr[i].color = 'red'
                        totalReject += parseInt(reimburshmentdb[j].amount)

                    }

                    else if (reimburshmentdb[j].approveStatus == 'A') {
                        reiburshmentArr[i].approveStatus = 'Approved'
                        reiburshmentArr[i].status = 'Reimbursement is confirmed'
                        reiburshmentArr[i].color = 'green'

                        totalApprove += parseInt(reimburshmentdb[j].amount)
                    }
                }

                /*******************************************************/
                if (reiburshmentArr[i].date == reimburshmentdb[j].date && reiburshmentArr[i].amount == reimburshmentdb[j].amount) {

                    if ((reiburshmentArr[i].userId == reimburshmentdb[j].appriserId) && (reimburshmentdb[j].isAppriserVisible == 'yes') && (reimburshmentdb[j].isAppriserAccepted == 'no') && (reimburshmentdb[j].approveStatus == 'W')) {

                        reiburshmentArr[i].approveBtn = 'show'
                    }

                    else if ((reiburshmentArr[i].userId == reimburshmentdb[j].appriserId) && (reimburshmentdb[j].isAppriserVisible == 'yes') && (reimburshmentdb[j].isAppriserAccepted == 'yes') && (reimburshmentdb[j].approveStatus == 'W')) {
                        reiburshmentArr[i].approveBtn = 'hide'
                    }

                    else if ((reiburshmentArr[i].userId == reimburshmentdb[j].reviewerId) && (reimburshmentdb[j].isReviewerVisible == 'yes') && (reimburshmentdb[j].isReviewerAccepted == 'no') && (reimburshmentdb[j].approveStatus == 'W')) {
                        reiburshmentArr[i].approveBtn = 'show'
                    }


                    else if ((reiburshmentArr[i].userId == reimburshmentdb[j].reviewerId) && (reimburshmentdb[j].isReviewerVisible == 'yes') && (reimburshmentdb[j].isReviewerAccepted == 'yes') && (reimburshmentdb[j].approveStatus == 'W')) {
                        reiburshmentArr[i].approveBtn = 'hide'
                    }


                    else if ((reiburshmentArr[i].userId == reimburshmentdb[j].managerId) && (reimburshmentdb[j].isManagerVisible == 'yes') && (reimburshmentdb[j].isManagerAccepted == 'no') && (reimburshmentdb[j].approveStatus == 'W')) {
                        reiburshmentArr[i].approveBtn = 'show'
                    }



                    else if ((reiburshmentArr[i].userId == reimburshmentdb[j].managerId) && (reimburshmentdb[j].isManagerVisible == 'yes') && (reimburshmentdb[j].isManagerAccepted == 'yes') && (reimburshmentdb[j].approveStatus == 'W')) {
                        reiburshmentArr[i].approveBtn = 'hide'
                    }



                    else {
                        reiburshmentArr[i].approveBtn = 'hide'
                    }

                    /********************************************/
                    if (reiburshmentArr[i].date == reimburshmentdb[j].date && reiburshmentArr[i].amount == reimburshmentdb[j].amount) {
                        if (reimburshmentdb[j].appriserId != '' && reimburshmentdb[j].isAppriserAccepted == 'yes') {
                            if (reimburshmentdb[j].appriserId != null) {
                                reiburshmentArr[i].actionList.push({
                                    heading: 'R1',
                                    name: await getEmployeeNameById(reimburshmentdb[j].appriserId),
                                    status: 'Approved',
                                }

                                )
                                reiburshmentArr[i].r1 = reiburshmentArr[i].actionList[0].name
                            }
                        }
                        else if (reimburshmentdb[j].appriserId != '' && reimburshmentdb[j].isAppriserAccepted == 'no') {
                            if (reimburshmentdb[j].appriserId != null) {
                                reiburshmentArr[i].actionList.push({
                                    heading: 'R1',
                                    name: await getEmployeeNameById(reimburshmentdb[j].appriserId),
                                    status: '-',
                                }
                                )
                                reiburshmentArr[i].r1 = reiburshmentArr[i].actionList[0].name

                            }
                        }
                        if (reimburshmentdb[j].reviewerId != '' && reimburshmentdb[j].isReviewerAccepted == 'yes') {
                            if (reimburshmentdb[j].reviewerId != null) {
                                reiburshmentArr[i].actionList.push({
                                    heading: 'R2',
                                    name: await getEmployeeNameById(reimburshmentdb[j].reviewerId),
                                    status: 'Approved',
                                }
                                )
                                reiburshmentArr[i].r2 = reiburshmentArr[i].actionList[1].name
                            }
                        }
                        else if (reimburshmentdb[j].reviewerId != '' && reimburshmentdb[j].isReviewerAccepted == 'no') {
                            if (reimburshmentdb[j].reviewerId != null) {
                                reiburshmentArr[i].actionList.push({
                                    heading: 'R2',
                                    name: await getEmployeeNameById(reimburshmentdb[j].reviewerId),
                                    status: '-',
                                }
                                )
                                reiburshmentArr[i].r2 = reiburshmentArr[i].actionList[1].name
                            }
                        }
                        if (reimburshmentdb[j].managerId != '' && reimburshmentdb[j].isManagerAccepted == 'yes') {
                            if (reimburshmentdb[j].managerId != null) {
                                reiburshmentArr[i].actionList.push({
                                    heading: 'R3',
                                    name: await getEmployeeNameById(reimburshmentdb[j].managerId),
                                    status: 'Approved',
                                }
                                )
                                reiburshmentArr[i].r3 = reiburshmentArr[i].actionList[2].name
                            }
                        }
                        else if (reimburshmentdb[j].managerId != '' && reimburshmentdb[j].isManagerAccepted == 'no') {
                            if (reimburshmentdb[j].managerId != null) {
                                reiburshmentArr[i].actionList.push({
                                    heading: 'R3',
                                    name: await getEmployeeNameById(reimburshmentdb[j].managerId),
                                    status: '-',
                                }
                                )
                                reiburshmentArr[i].r3 = reiburshmentArr[i].actionList[2].name
                            }
                        }
                    }
                }
            }
        }
        reiburshmentArr.map((value, i) => {
            reiburshmentArr[i].amount = formatAmount(parseInt(reiburshmentArr[i].amount))
            if (reiburshmentArr[i].mainUserId == null) {
                reiburshmentArr[i].mainUserId = ''
            }
            return value
        })

        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = reiburshmentArr.slice(startIndex, endIndex);

        res.status(200).send({
            recordedPerPage:limit,
            result: 'success',
            totalData: reiburshmentArr.length,
            totalPaid: formatAmount(totalPaid),
            totalApplied: formatAmount(totalApplied),
            totalPending: formatAmount(totalPending),
            totalApprove: formatAmount(totalApprove),
            totalReject: formatAmount(totalReject),
            totalUnPaid: formatAmount(totalUnPaid),
            reimburshmentList: paginatedData
        })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getAllReimbursmentReport }