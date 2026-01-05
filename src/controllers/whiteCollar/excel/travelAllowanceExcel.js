let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getTravelAllowanceExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)

       
        // const tokenUserId = '29'
        // let db = sequelize('59')

        let data = req.body;
        const { amount, branchId, clientName, creditAmount, department, description, designation, empCode, empInactiveName, empactiveName, fromDate, toDate, modeOfTransport, paymentStatus, routeFrom, routeTo, subdepartment, taEmplId, taStatus } = data

        const countQuery = await db.query(
            `
                            select count(*) AS total

                          from eve_tA_details as a 
                            left join eve_acc_employee as b on a.emp_id=b.id
                            left join eve_acc_apply_ta_payment_details as c on a.id=c.taId
                                left join eve_acc_apply_ta_history as d on a.taID=d.id
                         
                            where a.status='A' 


                               and (:amount is null or a.amount=:amount)
                               and (:branchId is null or   b.employeeBranchId=:branchId)
                                  and (:clientName is null or d.clientName=:clientName)
                                  and (:creditAmount is null or d.pendingCredit=:creditAmount)
                                     and (:department is null or  b.employeeDepartmentId=:department)
                                         and (:description is null or  d.description=:description)


                                            and (:designation is null or  b.employeeDesignationId=:designation)
                                            and (:empCode is null or  b.employeeCode=:empCode)
                                            and (:empInactiveName is null or  a.emp_id=:empInactiveName)
                                            and (:empactiveName is null or  a.emp_id=:empactiveName)
                                            and (:modeOfTransport is null or  a.transport=:modeOfTransport)


                                            and (:fromDate is null or  a.appriserApprovedDate >= :fromDate)
                                            and (:toDate is null or  a.appriserApprovedDate <= :toDate)
                                               and (:paymentStatus is null or  a.paymentStatus=:paymentStatus)
                                                   and (:routeFrom is null or d.form=:routeFrom)
                                                   and (:routeTo is null or d.to=:routeTo)
                                                  and (:subdepartment is null or b.employeeSubDepartmentId=:subdepartment)
                                                  and (:taStatus is null or a.taStatus=:taStatus)

                              

                               and (
                                      (a.appriserId=:tokenUserId and a.isAppriserVisible='yes')
                                                            or
                                      (a.reviewerId=:tokenUserId and a.isReviewerVisible='yes')
                                                            or
                                      (a.managerId=:tokenUserId and a.isManagerVisible='yes')
                                    )

                            and (b.employeeType='' or b.employeeType is null or b.employeeType='White Collar')
                        
                                     
                        
                            
                         
                                                                      
            `, {
            replacements: {

                tokenUserId: tokenUserId,
                amount: amount || null,
                branchId: branchId || null,
                clientName: clientName || null,
                creditAmount: creditAmount || null,
                department: department || null,
                description: description || null,
                designation: designation || null,
                empCode: empCode || null,
                empInactiveName: empInactiveName || null,
                empactiveName: empactiveName || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
                modeOfTransport: modeOfTransport || null,
                paymentStatus: paymentStatus || null,
                routeFrom: routeFrom || null,
                routeTo: routeTo || null,
                subdepartment: subdepartment || null,
                taStatus: taStatus || null,

            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
        if (totalData === 0) {
            return res.status(200).json({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;
        let getData = await db.query(
            `
                            select 
                             a.id,
                              a.taID,
                               a.emp_id,
                                date_format(a.appriserApprovedDate,'%d-%m-%Y') as date,
                                  b.employeeName,
                                    b.employeeCode,
                                      b.employeeBranchId,
                                       b.employeeDepartmentId,
                                        b.employeeDesignationId,
                                         b.employeeSubDepartmentId,
                            a.transport,
                            c.paymentMode,
                            c.paymentBy,
                            c.paidAmount,
                            a.amount,
                            a.appriserId,
                            a.isAppriserAccepted,
                            a.reviewerId,
                            a.isReviewerAccepted,
                            a.managerId,
                            a.isManagerAccepted,
                            a.actionedBy,
                            a.taStatus,
                                         a.paymentStatus,
                                         c.paymentBy,
                                         a.image,
                                         d.clientName,
                                         d.description,
                                         d.pendingCredit,
                                         d.form,
                                         d.to



                            from eve_tA_details as a 
                            left join eve_acc_employee as b on a.emp_id=b.id
                            left join eve_acc_apply_ta_payment_details as c on a.id=c.taDetailsId
                            left join eve_acc_apply_ta_history as d on a.taID=d.id
                         
                            where a.status='A' 


                            and (:amount is null or a.amount=:amount)
                              and (:branchId is null or b.employeeBranchId=:branchId)
                              and (:clientName is null or d.clientName=:clientName)
                                  and (:creditAmount is null or d.pendingCredit=:creditAmount)
                                  and (:department is null or  b.employeeDepartmentId=:department)
                                  and (:description is null or  d.description=:description)
                                  and (:designation is null or  b.employeeDesignationId=:designation)

                                     and (:empCode is null or  b.employeeCode=:empCode)
                                        and (:empInactiveName is null or  a.emp_id=:empInactiveName)
                                        and (:empactiveName is null or  a.emp_id=:empactiveName)
                                         and (:fromDate is null or  a.appriserApprovedDate >= :fromDate)
                                            and (:toDate is null or  a.appriserApprovedDate <= :toDate)

                                             and (:modeOfTransport is null or  a.transport=:modeOfTransport)
                                             and (:paymentStatus is null or  a.paymentStatus=:paymentStatus)
                                             and (:routeFrom is null or d.form=:routeFrom)
                                                  and (:routeTo is null or d.to=:routeTo)
                                                   and (:subdepartment is null or b.employeeSubDepartmentId=:subdepartment)
                                                        and (:taStatus is null or a.taStatus=:taStatus)



                            and (
                            (a.appriserId=:tokenUserId and a.isAppriserVisible='yes')
                            or
                            (a.reviewerId=:tokenUserId and a.isReviewerAccepted='yes')
                            or
                            (a.managerId=:tokenUserId and a.isManagerVisible='yes')
                            )

                                        and (b.employeeType='' or b.employeeType is null or b.employeeType='White Collar')
                         

                            order by a.id desc
                            limit :limit
                            offset :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    tokenUserId: tokenUserId,
                    amount: amount || null,
                    branchId: branchId || null,
                    clientName: clientName || null,
                    creditAmount: creditAmount || null,
                    department: department || null,
                    description: description || null,
                    designation: designation || null,
                    empCode: empCode || null,
                    empInactiveName: empInactiveName || null,
                    empactiveName: empactiveName || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                    modeOfTransport: modeOfTransport || null,
                    paymentStatus: paymentStatus || null,
                    routeFrom: routeFrom || null,
                    routeTo: routeTo || null,
                    subdepartment: subdepartment || null,
                    taStatus: taStatus || null,

                }, type: QueryTypes.SELECT
            }
        )

        let totalApplied = 0
        let totalApproved = 0
        let totalRejected = 0
        let totalPending = 0
        let totalPaid = 0
        let totalUnpaid = 0
        await Promise.all(getData.map(async (e, i) => {



            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)

            if (e.isAppriserAccepted === 'yes') {
                e.appriserStatus = 'Approved'
            }
            else if (e.actionedBy !== '' && e.taStatus == 'C' && e.appriserId == e.actionedBy) {
                e.appriserStatus = 'Rejected'
            }
            else if (e.taStatus === 'A') {
                e.appriserStatus = 'N/A'

            }
            else {
                e.appriserStatus = 'Pending'
            }
            if (e.isReviewerAccepted === 'yes') {
                e.reviewerStatus = 'Approved'
            }
            else if (e.actionedBy != '' && e.taStatus == 'C' && e.reviewerId == e.actionedBy) {
                e.reviewerStatus = 'Rejected'
            }
            else if (e.taStatus == 'A') {
                e.reviewerStatus = 'N/A'

            }
            else {
                e.reviewerStatus = 'Pending'
            }
            if (e.isManagerAccepted === 'yes') {
                e.managerStatus = 'Approved'
            }
            else if (e.actionedBy != '' && e.taStatus == 'C' && e.managerId == e.actionedBy) {
                e.managerStatus = 'Rejected'
            }
            else if (e.taStatus == 'A') {
                e.managerStatus = 'N/A'
            }
            else {
                e.managerStatus = 'Pending'
            }
            if (e.appriserId) {
                e.r1 = `${await myFunc.getEmployeeNameById(e.appriserId, db)} - ${e.appriserStatus}`
            }
            else {
                e.r1 = ''
            }
            if (e.reviewerId) {
                e.r2 = `${await myFunc.getEmployeeNameById(e.reviewerId, db)} - ${e.reviewerStatus}`
            }
            else {
                e.r2 = ''
            }

            if (e.managerId) {
                e.r3 = `${await myFunc.getEmployeeNameById(e.managerId, db)} - ${e.managerStatus}`
            }
            else {
                e.r3 = ''
            }


            if (e.taStatus === 'A') {
                e.approvalStatus = 'Approved'
            }
            else if (e.taStatus === 'C') {
                e.approvalStatus = 'Rejected'
            }
            else if (e.taStatus === 'W') {
                e.approvalStatus = 'Pending'
            }
            else {
                e.approvalStatus = 'N/A'
            }
            if (e.paymentBy !== null) {
                e.paymentByName = await myFunc.getEmployeeNameById(e.paymentBy, db)
            }
            else {
                e.paymentByName = 'N/A'
            }


            totalApplied += parseFloat(e.amount) || 0
            if (e.approvalStatus === 'Approved') {
                totalApproved += parseFloat(e.amount) || 0
            }
            if (e.approvalStatus === 'Rejected') {
                totalRejected += parseFloat(e.amount) || 0
            }
            if (e.approvalStatus === 'Pending') {
                totalPending += parseFloat(e.amount) || 0
            }
            if (e.paymentStatus === 'paid') {
                totalPaid += parseFloat(e.amount) || 0
            }
            if (e.paymentStatus === 'unpaid') {
                totalUnpaid += parseFloat(e.amount) || 0
            }





        }))
        const excelData = getData.map((e, i) =>

        ({
            'Sl. No.': i + 1,
            'Date': e.date,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,

            'Route': `From : ${e.form} To :${e.to}`,
            'Client Name': e.clientName,
            'Description': e.description,
            'Pending Credit Limit (₹)': myFunc.formatAmount(e.pendingCredit),

            'Mode Of Transport': e.transport,
            'Claimed Amount (₹)': myFunc.formatAmount(e.amount),

            // 'Document': e.image,
            'R1': e.r1,
            'R2': e.r2,
            'R3': e.r3,
            'Approval Status': e.approvalStatus,
            'Payment Status	': e.paymentStatus,
            'Payment By': e.paymentByName,
        }))





        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo,
            totalData: totalData,
            totalApplied: myFunc.formatAmount(totalApplied),
            totalApproved: myFunc.formatAmount(totalApproved),
            totalRejected: myFunc.formatAmount(totalRejected),
            totalPending: myFunc.formatAmount(totalPending),
            totalPaid: myFunc.formatAmount(totalPaid),
            totalUnpaid: myFunc.formatAmount(totalUnpaid),


            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)


        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, amount, branchId, clientName, creditAmount, department, description, designation, empCode, empInactiveName, empactiveName, fromDate, toDate, modeOfTransport, paymentStatus, routeFrom, routeTo, subdepartment, taEmplId, taStatus }) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getTravelAllowanceExcel`,
            data: { token, pageNo, limit, amount, branchId, clientName, creditAmount, department, description, designation, empCode, empInactiveName, empactiveName, fromDate, toDate, modeOfTransport, paymentStatus, routeFrom, routeTo, subdepartment, taEmplId, taStatus }
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
    let a = header.indexOf('Mode Of Transport')
    let b = header.indexOf('Claimed Amount (₹)')


    let len = header.length
    let row = new Array(len).fill('')
    let space = new Array(len).fill('')

    row[a] = 'Total Applied'
    row[b] = data['totalApplied']

    let row1 = new Array(len).fill('')

    row1[a] = 'Total Approved'
    row1[b] = data['totalApproved']
    let len2 = header.length
    let row2 = new Array(len).fill('')
    row2[a] = 'Total Rejected'
    row2[b] = data['totalRejected']
    let len3 = header.length
    let row3 = new Array(len).fill('')
    row3[a] = 'Total Pending'
    row3[b] = data['totalPending']
    let len4 = header.length
    let row4 = new Array(len).fill('')
    row4[a] = 'Total Paid'
    row4[b] = data['totalPaid']
    let len5 = header.length
    let row5 = new Array(len).fill('')
    row5[a] = 'Total Unpaid'
    row5[b] = data['totalUnpaid']
    values.push(space)
    values.push(row)
    values.push(row1)
    values.push(row2)
    values.push(row3)
    values.push(row4)
    values.push(row5)



    worksheet.addRows(values)
    const headerRow = worksheet.getRow(1);


    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            row.height = 15

        });
    });
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };
    });
    worksheet.columns.forEach(column => {
        column.width = 20;
    });
    //totalAmount Bold 
    const lastRow = worksheet.lastRow;
    const secondLastRow = worksheet.getRow(lastRow.number - 1);
    const thirdLastRow = worksheet.getRow(lastRow.number - 2);
    const fourthLastRow = worksheet.getRow(lastRow.number - 3);
    const fifthLastRow = worksheet.getRow(lastRow.number - 4);
    const sixthLastRow = worksheet.getRow(lastRow.number - 5);


    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    secondLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    thirdLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    fourthLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    fifthLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    sixthLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    return workbook.xlsx
}

async function getTravelAllowanceExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, amount, branchId, clientName, creditAmount, department, description, designation,empCode,empInactiveName,empactiveName,fromDate,toDate,modeOfTransport,paymentStatus,routeFrom,routeTo,subdepartment,taEmplId,taStatus } = data

        let apiData = await fetchData({ token, pageNo, limit, amount, branchId, clientName, creditAmount, department, description, designation,empCode,empInactiveName,empactiveName,fromDate,toDate,modeOfTransport,paymentStatus,routeFrom,routeTo,subdepartment,taEmplId,taStatus })

        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Travel Allownce.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getTravelAllowanceExcel, getTravelAllowanceExcelSheet }