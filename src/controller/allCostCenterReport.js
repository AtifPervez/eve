let sequelize = require(("../config/db"))
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const reiburshmentReport = require('../controller/reimbursmentReport')
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

const getAllCostCenterReport = async (req, res) => {
    try {
        let data = req.body
        let { DB_NAME, year, month,divisionName } = data
        let db = sequelize(DB_NAME)

        //getAllReimbursmentReport********************************************************

        let totalPaid = 0
        let totalUnPaid = 0
        let totalApplied = 0
        let totalPending = 0
        let totalReject = 0
        let totalApprove = 0


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
                    //
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
                    //
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


        //advanceReport**************************************************************************************
        let advanceApprove = 0
        let advanceTotalReject = 0
        let advanceTotalPaid = 0
        let advanceTotalUnpaid = 0
        let advanceTotalApplyied = 0

        //eve_acc_employee = employee
        //eve_acc_employee_advance = empAdvance
        //eve_acc_department as empDep
        //eve_acc_employee_advance_payment=empAdvancePay
        let getData0 = await await sequelize(DB_NAME).query('select employee.id as employeeId,employee.employeeName,employee.employeeCode,employee.employeeSubcompanyName,employee.employeeDepartment,employee.employeeDesignation,employee.employeeBranchId,employee.employeeBranchName,employee.employeeBranchName as branchNameAttr ,employee.employeeDepartmentId,employee.employeeDesignation,employee.employeeDesignationId,employee.employeeSubCompanyId,empAdvance.applyDate as date,empAdvance.amount, empAdvance.description,empDep.name as subDepartmentName,empAdvance.id,empAdvancePay.paymentStatus           from eve_acc_employee as employee left join eve_acc_employee_advance as empAdvance on employee.id=empAdvance.employeeId left join eve_acc_department as empDep on employee.id=empDep.parentId left join eve_acc_employee_advance_payment as empAdvancePay on empAdvance.id=empAdvancePay.advanceId  where employee.status="A" && empAdvance.status="A"  ', {
            type: QueryTypes.SELECT
        })

        getData0.map((value, i) => {
            getData0[i].employeeSubCompanyId = (getData0[i].employeeSubCompanyId).toString()
            getData0[i].employeeId = (getData0[i].employeeId).toString()
            getData0[i].actionList = []


            return value
        })



        let advanceReportArr = []
        for (let i = 0; i < getData0.length; i++) {
            let dateString = getData0[i].date
            let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
            let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
            let monthBy = date.format('MM', "MM-DD-YYYY").toString();

            if (getData0[i].date !== null && yearBy === year && monthBy === month) {
                advanceReportArr.push(getData0[i])

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

                if (advanceReportArr[i].date == empAdvance[j].applyDate && advanceReportArr[i].amount == empAdvance[j].amount && advanceReportArr[i].id == empAdvance[j].id) {


                    if (empAdvance[j].actionedBy != null) {
                        advanceReportArr[i].actionedBy = await getEmployeeNameById(empAdvance[j].actionedBy)
                    }
                    else {
                        advanceReportArr[i].actionedBy = null
                    }


                    if (advanceReportArr[i].amount != null) {

                        advanceTotalApplyied += parseFloat(advanceReportArr[i].amount)
                    }


                    if (empAdvance[j].advanceStatus == 'Approved') {
                        advanceReportArr[i].taStatus = 'Approved'
                        advanceReportArr[i].taStatusColor = 'green'
                        advanceApprove += parseInt(advanceReportArr[i].amount)
                    }

                    else if (empAdvance[j].advanceStatus == 'Rejected') {
                        advanceReportArr[i].taStatus = 'Rejected'
                        advanceReportArr[i].taStatusColor = 'red'
                        advanceTotalReject += parseInt(advanceReportArr[i].amount)

                    }
                    else if (empAdvance[j].advanceStatus == 'Waiting') {
                        advanceReportArr[i].taStatus = 'Pending'
                        advanceReportArr[i].taStatusColor = '#fcc203'
                    }


                    if (advanceReportArr[i].paymentStatus == 'paid') {
                        advanceReportArr[i].color = 'green'

                        advanceTotalPaid += parseInt(advanceReportArr[i].amount)
                    }
                    else if (advanceReportArr[i].paymentStatus == 'unpaid') {
                        advanceReportArr[i].color = 'red'

                        advanceTotalUnpaid += parseInt(advanceReportArr[i].amount)
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



        //taReport**********************************************************************
        let taTotalApprove = 0
        let taTotalPending = 0
        let taTotalReject = 0
        let taTotalApplied = 0
        let taTotalPaid = 0
        let taTotalUnpaid = 0



        let getData2 = await sequelize(DB_NAME).query("SELECT DISTINCT eve_acc_employee.id AS employeeId,eve_acc_employee.employeeName,eve_acc_employee.employeeCode,eve_acc_employee.employeeSubcompanyName,eve_acc_employee.employeeDepartment,eve_acc_employee.employeeDesignation,eve_acc_employee.employeeBranchId,eve_acc_employee.employeeBranchName as branchNameAttr,eve_acc_employee.employeeDepartmentId,eve_acc_employee.employeeDesignation,eve_acc_employee.employeeDesignationId,eve_acc_employee.employeeSubCompanyId,eve_acc_employee.employeeSubCompanyId as id,eve_acc_apply_ta_history.date,eve_acc_apply_ta_history.taStatus,eve_acc_apply_ta_history.form,eve_acc_apply_ta_history.to,eve_acc_apply_ta_history.transport,eve_acc_apply_ta_history.description,eve_acc_apply_ta_history.actionedBy,eve_acc_apply_ta_history.amount,eve_acc_apply_ta_history.clientName,eve_acc_apply_ta_history.paymentStatus,eve_acc_apply_ta_payment_details.paymentMode,eve_acc_apply_ta_payment_details.paymentBy,eve_acc_apply_ta_payment_details.paidAmount,eve_acc_employee.employeeBranchName,eve_acc_apply_ta_payment_details.details,eve_acc_apply_ta_payment_details.remarks,eve_acc_apply_ta_payment_details.dateOfPayment,eve_acc_apply_ta_payment_details.transactionNo,eve_acc_apply_ta_history.image as document       FROM eve_acc_employee LEFT JOIN eve_acc_apply_ta_history ON eve_acc_employee.id=eve_acc_apply_ta_history.emp_id left join eve_acc_apply_ta_payment_details on eve_acc_apply_ta_history.id=eve_acc_apply_ta_payment_details.taId where eve_acc_employee.status='A' && eve_acc_apply_ta_history.status='A'",
            {
                replacements:
                {
                    // limit: +limit || 1000, offset: (limit * ((pageNo || 1) - 1)),
                },
                type: QueryTypes.SELECT
            })


        let eve_acc_employee = await sequelize(DB_NAME).query('select * from eve_acc_employee where status="A"', {
            type: QueryTypes.SELECT
        })

        let n = getData2.length

        getData2 = getData2.map((value, index) => {
            value.employeeId = value.employeeId.toString()
            value.employeeSubCompanyId = value.employeeSubCompanyId.toString()
            value.employeeSubDepartment = null

            if (value.id != null) {
                value.id = value.id.toString()
            }
            value.actionList = []


            return value
        })

        let eve_acc_department = await sequelize(DB_NAME).query('select * from eve_acc_department where status="A"', {
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData2.length; i++) {
            for (let j = 0; j < eve_acc_department.length; j++) {
                if (getData2[i].employeeDepartmentId == eve_acc_department[j].parentId) {
                    getData2[i].employeeSubDepartment = eve_acc_department[j].name
                }
            }
        }

        let taReportArr = []
        for (let i = 0; i < n; i++) {
            let dateString = getData2[i].date
            let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
            let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
            let monthBy = date.format('MM', "MM-DD-YYYY").toString();

            if (getData2[i].date !== null && yearBy === year && monthBy === month) {
                taReportArr.push(getData2[i])
            }
        }

        taReportArr = taReportArr.map((value, i) => {
            value.slno = Number(i) + 1

            return value
        })

        taReportArr.map((value, i) => {
            if (taReportArr[i].taStatus == 'C') {
                taReportArr[i].taStatus = 'Rejected'
                taReportArr[i].taStatuscolor = 'Red'
                taTotalReject += taReportArr[i].amount
            }
            else if (taReportArr[i].taStatus == 'A') {
                taReportArr[i].taStatus = 'Approved'
                taReportArr[i].taStatuscolor = 'green'
                taTotalApprove += taReportArr[i].amount

            }
            else if (taReportArr[i].taStatus == 'W') {
                taReportArr[i].taStatus = 'Pending'
                taReportArr[i].taStatuscolor = '#fcc203'
            }

            if (taReportArr[i].paymentStatus == 'paid') {
                taReportArr[i].color = 'green'
                taTotalPaid += taReportArr[i].amount
            }
            else if (taReportArr[i].paymentStatus == 'unpaid') {
                taReportArr[i].color = 'red'
                taTotalUnpaid += taReportArr[i].amount

            }
            taTotalApplied += taReportArr[i].amount
            taReportArr[i].amount = formatAmount(taReportArr[i].amount)
            if (taReportArr[i].document) {

                taReportArr[i].documentLink = `http//www.eveserver.ind.in/eve/upload/${taReportArr[i].document}`
            }
            else taReportArr[i].documentLink = ''



            return value
        })


        let eveEmpDb = eve_acc_employee
        for (let i = 0; i < taReportArr.length; i++) {
            for (let j = 0; j < eveEmpDb.length; j++) {

                if (taReportArr[i].actionedBy == eveEmpDb[j].id) {
                    taReportArr[i].actionedBy = eveEmpDb[j].employeeName
                }
            }
        }


        function formatAmount(numericString) {

            if (numericString != null) {
                let numericValue = numericString
                let formattedString = numericValue.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return formattedString
            }
        }
        const finaltaTotalApprove = formatAmount(taTotalApprove)
        const finaltaTotalPaid = formatAmount(taTotalPaid)
        const finaltaTotalUnpaid = formatAmount(taTotalUnpaid)
        const finaltaTotalApplied = formatAmount(taTotalApplied)

        let eve_acc_apply_ta_history = await sequelize(DB_NAME).query('select * from eve_acc_apply_ta_history where status="A"', {
            type: QueryTypes.SELECT
        })
        let taHistory = eve_acc_apply_ta_history

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




        for (let i = 0; i < taReportArr.length; i++) {
            for (let j = 0; j < taHistory.length; j++) {
                if (taReportArr[i].date == taHistory[j].date && taReportArr[i].form == taHistory[j].form && taReportArr[i].to == taHistory[j].to) {
                    if (taHistory[j].appriserId != '' && taHistory[j].isAppriserAccepted == 'yes') {
                        if (taHistory[j].appriserId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R1',
                                name: await getEmployeeNameById(taHistory[j].appriserId),
                                status: 'Approved',
                            }
                            )
                        }
                    }
                    else if (taHistory[j].appriserId != '' && taHistory[j].isAppriserAccepted == 'no') {
                        if (taHistory[j].appriserId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R1',
                                name: await getEmployeeNameById(taHistory[j].appriserId),
                                status: '-',
                            }
                            )
                        }
                    }
                    if (taHistory[j].reviewerId != '' && taHistory[j].isReviewerAccepted == 'yes') {
                        if (taHistory[j].reviewerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R2',
                                name: await getEmployeeNameById(taHistory[j].reviewerId),
                                status: 'Approved',
                            }
                            )
                        }
                    }
                    else if (taHistory[j].reviewerId != '' && taHistory[j].isReviewerAccepted == 'no') {
                        if (taHistory[j].reviewerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R2',
                                name: await getEmployeeNameById(taHistory[j].reviewerId),
                                status: '-',
                            }
                            )
                        }
                    }
                    if (taHistory[j].managerId != '' && taHistory[j].isManagerAccepted == 'yes') {
                        if (taHistory[j].managerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R3',
                                name: await getEmployeeNameById(taHistory[j].managerId),
                                status: 'Approved',
                            }
                            )
                        }
                    }
                    else if (taHistory[j].managerId != '' && taHistory[j].isManagerAccepted == 'no') {
                        if (taHistory[j].managerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R3',
                                name: await getEmployeeNameById(taHistory[j].managerId),
                                status: '-',
                            }
                            )
                        }
                    }
                }
            }
        }
        taReportArr.map((value, i) => {
            if (taReportArr[i].paidAmount == null) {
                taReportArr[i].paidAmount = '0.00'
            }
            if (taReportArr[i].paymentMode == null) {
                taReportArr[i].paymentMode = ''
            }
            if (taReportArr[i].details == null) {
                taReportArr[i].details = ''
            }
            if (taReportArr[i].remarks == null) {
                taReportArr[i].remarks = ''
            }
            if (taReportArr[i].dateOfPayment == null) {
                taReportArr[i].dateOfPayment = ''
            }
            if (taReportArr[i].transactionNo == null) {
                taReportArr[i].transactionNo = ''
            }
            if (taReportArr[i].document == null) {
                taReportArr[i].document = ''
            }
            if (taReportArr[i].amount == null) {
                taReportArr[i].amount = '0.00'
            }
            return value
        })




        /****************************************************/
        let costCenterList = await db.query('select * from eve_hrm_cost_center_list where status="A"', {

            type: QueryTypes.SELECT
        })

        let getData1 = await db.query('select subcompany_id from eve_hrm_cost_center_list where status="A"', {
            type: QueryTypes.SELECT
        })
        if(year&&month&&!divisionName){
            return res.status(400).send({status:false,msg:'plz enter divisionName'})

        }
        
        let salaryPayroll = await sequelize(DB_NAME).query('select * from eve_acc_employee_monthly_salary_payroll where status="A"', {

            type: QueryTypes.SELECT
        })
        let totalSalaryExpenses = 0
       
        salaryPayroll.map(e => {
            if (e.salaryOfMonth == month && e.salaryOfYear == year){
                totalSalaryExpenses+=(e.totalPayableSalary)
            }
        })
        if (year && month && divisionName=='developer') {
           
            return res.status(200).send({
                status: true, costCenterReportList: {
                    year: year,
                    month: month,
                    divisionName:divisionName,
                    totalReimbursementExpenses:formatAmount(totalPaid),
                    totalAdvanceExpenses: formatAmount(advanceTotalPaid),
                    totalTAExpenses: formatAmount(taTotalPaid),
                    totalSalaryExpenses:formatAmount(totalSalaryExpenses)
                }
            })

        }
        else {
            getData1.map((e) => {
                e.subcompany_name = ''
                e.division_list = []

                costCenterList.map((x) => {
                    if (e.subcompany_id == x.subcompany_id) {

                        let arr = x.division_name.split(',')

                        for (let i = 0; i < arr.length; i++) {
                            e.division_list.push({
                                division_name: arr[i],
                                allPaidAdvanceDefault: '',
                                allPaidReimbursementDefault: '',
                                allPaidSalaryDefault: '',
                                allPaidTADefault: ''
                            })
                        }
                    }

                })


            })
        }

        return res.status(200).send({ status: true, allDataContent: getData1 })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getAllCostCenterReport }