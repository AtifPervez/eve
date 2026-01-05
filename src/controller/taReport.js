let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')

const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
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

const allTaList = async (req, res) => {
    try {

        let data = req.body
        let { DB_NAME, year, month } = data
        let db = sequelize(DB_NAME)


        let totalApproved = 0
        let totalPending = 0
        let totalReject = 0
        let totalApplied = 0
        let totalPaid = 0
        let totalUnpaid = 0



        let getData = await db.query("SELECT DISTINCT eve_acc_employee.id AS employeeId,eve_acc_employee.employeeName,eve_acc_employee.employeeCode,eve_acc_employee.employeeSubcompanyName,eve_acc_employee.employeeDepartment,eve_acc_employee.employeeDesignation,eve_acc_employee.employeeBranchId,eve_acc_employee.employeeBranchName as branchNameAttr,eve_acc_employee.employeeDepartmentId,eve_acc_employee.employeeDesignation,eve_acc_employee.employeeDesignationId,eve_acc_employee.employeeSubCompanyId,eve_acc_employee.employeeSubCompanyId as id,eve_acc_apply_ta_history.date,eve_acc_apply_ta_history.taStatus,eve_acc_apply_ta_history.form,eve_acc_apply_ta_history.to,eve_acc_apply_ta_history.transport,eve_acc_apply_ta_history.description,eve_acc_apply_ta_history.actionedBy,eve_acc_apply_ta_history.amount,eve_acc_apply_ta_history.clientName,eve_acc_apply_ta_history.paymentStatus,eve_acc_apply_ta_payment_details.paymentMode,eve_acc_apply_ta_payment_details.paymentBy,eve_acc_apply_ta_payment_details.paidAmount,eve_acc_employee.employeeBranchName,eve_acc_apply_ta_payment_details.details,eve_acc_apply_ta_payment_details.remarks,eve_acc_apply_ta_payment_details.dateOfPayment,eve_acc_apply_ta_payment_details.transactionNo,eve_acc_apply_ta_history.image as document,eve_acc_apply_ta_history.totalCredit, eve_acc_apply_ta_history.totalUsedCredit,eve_acc_apply_ta_history.pendingCredit      FROM eve_acc_employee LEFT JOIN eve_acc_apply_ta_history ON eve_acc_employee.id=eve_acc_apply_ta_history.emp_id left join eve_acc_apply_ta_payment_details on eve_acc_apply_ta_history.id=eve_acc_apply_ta_payment_details.taId where eve_acc_employee.status='A' && eve_acc_apply_ta_history.status='A'",
            {
                replacements:
                {
                    // limit: +limit || 1000, offset: (limit * ((pageNo || 1) - 1)),
                },
                type: QueryTypes.SELECT
            })


        let eve_acc_employee = await db.query('select * from eve_acc_employee where status="A"', {
            type: QueryTypes.SELECT
        })

        let n = getData.length

        getData = getData.map((value, index) => {
            value.employeeId = value.employeeId.toString()
            value.employeeSubCompanyId = value.employeeSubCompanyId.toString()
            value.employeeSubDepartment = null

            if (value.id != null) {
                value.id = value.id.toString()
            }
            value.actionList = []


            return value
        })

        let eve_acc_department = await db.query('select * from eve_acc_department where status="A"', {
            type: QueryTypes.SELECT
        })

        for (let i = 0; i < getData.length; i++) {
            for (let j = 0; j < eve_acc_department.length; j++) {
                if (getData[i].employeeDepartmentId == eve_acc_department[j].parentId) {
                    getData[i].employeeSubDepartment = eve_acc_department[j].name
                }
            }
        }

        let taReportArr = []
        for (let i = 0; i < n; i++) {
            let dateString = getData[i].date
            let date = moment(dateString, ["MM-DD-YYYY", "YYYY-MM-DD"])
            let yearBy = date.format('YYYY', "MM-DD-YYYY").toString()
            let monthBy = date.format('MM', "MM-DD-YYYY").toString();

            if (getData[i].date !== null && yearBy === year && monthBy === month) {
                taReportArr.push(getData[i])
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

            }
            else if (taReportArr[i].taStatus == 'A') {
                taReportArr[i].taStatus = 'Approved'
                taReportArr[i].taStatuscolor = 'green'
                // totalApprove += taReportArr[i].amount

            }
            else if (taReportArr[i].taStatus == 'W') {
                taReportArr[i].taStatus = 'Pending'
                taReportArr[i].taStatuscolor = '#fcc203'
                // totalPending+=taReportArr[i].amount
            }

            else if (taReportArr[i].paymentStatus == 'paid') {
                taReportArr[i].color = 'green'
                // totalPaid += taReportArr[i].amount
            }
            else if (taReportArr[i].paymentStatus == 'unpaid') {
                taReportArr[i].color = 'red'
                // totalUnpaid += taReportArr[i].amount

            }
            // totalApplied += taReportArr[i].amount
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
      
        let eve_acc_apply_ta_history = await db.query('select * from eve_acc_apply_ta_history where status="A"', {
            type: QueryTypes.SELECT
        })
        let taHistory = eve_acc_apply_ta_history






        for (let i = 0; i < taReportArr.length; i++) {
            for (let j = 0; j < taHistory.length; j++) {
                if (taReportArr[i].date == taHistory[j].date && taReportArr[i].form == taHistory[j].form && taReportArr[i].to == taHistory[j].to) {
                    if (taHistory[j].appriserId != '' && taHistory[j].isAppriserAccepted == 'yes') {
                        if (taHistory[j].appriserId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R1',
                                name: await getEmployeeNameById(taHistory[j].appriserId, db),
                                status: 'Approved',
                            }
                            )
                        }
                    }
                    else if (taHistory[j].appriserId != '' && taHistory[j].isAppriserAccepted == 'no') {
                        if (taHistory[j].appriserId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R1',
                                name: await getEmployeeNameById(taHistory[j].appriserId, db),
                                status: '-',
                            }
                            )
                        }
                    }
                    if (taHistory[j].reviewerId != '' && taHistory[j].isReviewerAccepted == 'yes') {
                        if (taHistory[j].reviewerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R2',
                                name: await getEmployeeNameById(taHistory[j].reviewerId, db),
                                status: 'Approved',
                            }
                            )
                        }
                    }
                    else if (taHistory[j].reviewerId != '' && taHistory[j].isReviewerAccepted == 'no') {
                        if (taHistory[j].reviewerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R2',
                                name: await getEmployeeNameById(taHistory[j].reviewerId, db),
                                status: '-',
                            }
                            )
                        }
                    }
                    if (taHistory[j].managerId != '' && taHistory[j].isManagerAccepted == 'yes') {
                        if (taHistory[j].managerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R3',
                                name: await getEmployeeNameById(taHistory[j].managerId, db),
                                status: 'Approved',
                            }
                            )
                        }
                    }
                    else if (taHistory[j].managerId != '' && taHistory[j].isManagerAccepted == 'no') {
                        if (taHistory[j].managerId != null) {
                            taReportArr[i].actionList.push({
                                heading: 'R3',
                                name: await getEmployeeNameById(taHistory[j].managerId, db),
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


        //pagination
        
        taReportArr.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
        let limit = parseInt(req.body.limit) || 100
        let pageNo = parseInt(req.body.pageNo) || 1
        let startIndex = (pageNo - 1) * limit;
        let endIndex = startIndex + limit;
        let paginatedData = taReportArr.slice(startIndex, endIndex);
      

        let totalCredit = 0
        let totalUsedCredit = 0
        let pendingCredit = 0
        let i = startIndex
        while (i < endIndex && i < taReportArr.length) {
            let e = taReportArr[i]
            if (e.taStatus == 'Rejected') {
                totalReject += parseFloat(e.amount)
            }
            if(e.taStatus=='Approved'){
                totalApproved+=parseFloat(e.amount)
            }
            if(e.taStatus=='Pending'){
                totalPending+=parseFloat(e.amount)
            }
            if(e.paymentStatus=='unpaid'){
                totalUnpaid+=parseFloat(e.amount)
            }
            if(e.paymentStatus=='paid'){
                totalPaid+=parseFloat(e.paidAmount)
            }
            totalApplied+=parseFloat(e.amount)

            if (e.totalCredit != '--') {
                totalCredit += parseFloat(e.totalCredit)
            }
            if (e.totalUsedCredit != '--') {
                totalUsedCredit += parseFloat(e.totalUsedCredit)
            }
            if (e.pendingCredit != '--') {
                pendingCredit += parseFloat(e.pendingCredit)
            }

            i++
        }
        return res.status(200).send({

            recordedPerPage: limit,
            totalData: taReportArr.length,
            currentPage: pageNo,
            'Total Allotted Credit Limit': formatAmount(totalCredit),
            'Total Consumed Credit Limit': formatAmount(totalUsedCredit),
            'Total Pending Credit Amount': formatAmount(pendingCredit),
            totalApplied: formatAmount(totalApplied),
            totalApproved: formatAmount(totalApproved),
            totalPaid: formatAmount(totalPaid),
            totalUnpaid: formatAmount(totalUnpaid),
            totalPending: formatAmount(totalPending),
            totalReject: formatAmount(totalReject),
            items: paginatedData,


        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { allTaList }
