let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')

const getPaidReimbursmentExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()

        // const tokenUserId = '29'
        // const tokenCompanyId = '59'
        // const tokenBranchId = '75'
        // let db = sequelize('59')
        // let db1 = sequelize()

        let data = req.body
        const { amount, empInactiveName, empactiveName, paymentBy, fromDate, toDate, paymentStatus, reimburshmentType, remarks, mobileNo, actionById } = data
        const countQuery = await db.query(
            `
                            select count(*) AS total
                             from eve_acc_reimburshment as a
                             left join eve_acc_employee as b on a.userId=b.id
                             left join eve_hrm_reimburshment_payment_details as c on a.id=c.reimburshmentId
                           

                                  where a.status !='D'
                                         and a.companyId = :tokenCompanyId
                                         and a.approveStatus!='W'
                                         and a.approveStatus!='C'

                                         and (:amount is null or a.amount=:amount)
                                         and (:empInactiveName is null or a.userId=:empInactiveName)
                                         and (:empactiveName is null or a.userId=:empactiveName)
                                            and (:paymentStatus is null or a.paymentStatus=:paymentStatus)
                                            and (:reimburshmentType is null or a.type=:reimburshmentType)
                                              and (:remarks is null or a.remarks=:remarks)
                                              and (:mobileNo is null or a.mobile=:mobileNo)
                                              and (:actionById is null or a.actionBy=:actionById)
                                              and (:paymentBy is null or c.paymentBy=:paymentBy)
                                      
                                         and (:fromDate is null or a.date >= :fromDate)
                                         and (:toDate is null or a.date <= :toDate)

                                             AND (b.employeeType = '' 
                                             or
                                                        b.employeeType IS NULL
                                                            OR b.employeeType = 'White Collar'
                                                        )
                                                            and b.employeeBranchId = :tokenBranchId
      
                                                                      
            `, {
            replacements: {

                tokenCompanyId: tokenCompanyId,
                tokenBranchId: tokenBranchId,
                amount: amount || null,
                empInactiveName: empInactiveName || null,
                empactiveName: empactiveName || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
                paymentStatus: paymentStatus || null,
                reimburshmentType: reimburshmentType || null,
                remarks: remarks || null,
                mobileNo: mobileNo || null,
                actionById: actionById || null,
                paymentBy: paymentBy || null,

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
                         select a.id,a.userId,
                         date_format(a.date,'%d-%m-%Y') as appliedDate,
                         a.type,
                         a.amount,
                         a.remarks,
                         a.paymentStatus,
                         a.approveStatus,
                         a.appriserId,
                         a.isAppriserAccepted,
                         a.reviewerId,
                            a.isReviewerAccepted,
                            a.managerId,
                            a.isManagerAccepted,
                            a.mobile,
                            a.actionBy,b.employeeName,b.employeeDesignationId,b.employeeBranchId,b.employeeType,c.paymentBy as paymentById,
                            d.typeName

                      from eve_acc_reimburshment as a
                             left join eve_acc_employee as b on a.userId=b.id
                             left join eve_hrm_reimburshment_payment_details as c on a.id=c.reimburshmentId
                             left join eve_acc_reimburshment_type as d on a.type=d.id
                           

                                  where a.status !='D'
                                         and a.companyId = :tokenCompanyId
                                         and a.approveStatus!='W'
                                         and a.approveStatus!='C'

                                         and (:amount is null or a.amount=:amount)
                                         and (:empInactiveName is null or a.userId=:empInactiveName)
                                         and (:empactiveName is null or a.userId=:empactiveName)
                                            and (:paymentStatus is null or a.paymentStatus=:paymentStatus)
                                            and (:reimburshmentType is null or a.type=:reimburshmentType)
                                              and (:remarks is null or a.remarks=:remarks)
                                              and (:mobileNo is null or a.mobile=:mobileNo)
                                              and (:actionById is null or a.actionBy=:actionById)
                                                   and (:paymentBy is null or c.paymentBy=:paymentBy)
                                      
                                         and (:fromDate is null or a.date >= :fromDate)
                                         and (:toDate is null or a.date <= :toDate)

                                             AND (b.employeeType = '' 
                                             or
                                                        b.employeeType IS NULL
                                                            OR b.employeeType = 'White Collar'
                                                        )
                                                             and b.employeeBranchId = :tokenBranchId

                  

                                                              


                        	ORDER BY a.date DESC
                            limit :limit
                            offset :offset                       
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    tokenCompanyId: tokenCompanyId,
                    tokenBranchId: tokenBranchId,
                    amount: amount || null,
                    empInactiveName: empInactiveName || null,
                    empactiveName: empactiveName || null,
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                    paymentStatus: paymentStatus || null,
                    reimburshmentType: reimburshmentType || null,
                    remarks: remarks || null,
                    mobileNo: mobileNo || null,
                    actionById: actionById || null,
                    paymentBy: paymentBy || null,

                }, type: QueryTypes.SELECT
            }
        )
        let totalApprove = 0
        let totalPaid = 0
        let totalUnpaid = 0
        await Promise.all(getData.map(async (e, i) => {

            if (e.approveStatus === 'A') {
                totalApprove += parseFloat(e.amount)
            }
            if (e.paymentStatus === 'paid') {
                totalPaid += parseFloat(e.amount)
            }
            if (e.paymentStatus === 'unpaid') {
                totalUnpaid += parseFloat(e.amount)
            }

           
            e.designatioName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)

            e.status = e.approveStatus === 'A' ? 'Approved' : e.approveStatus == 'C' ? 'Rejected' : 'Pending'

            if (e.isAppriserAccepted === 'yes') {
                e.appriserStatus = 'approved'
            }
            else if (e.isAppriserAccepted === 'no') {
                e.appriserStatus = 'pending'
            }
            if (e.isReviewerAccepted === 'yes') {
                e.reviewerStatus = 'approved'
            }
            else if (e.isReviewerAccepted === 'no') {
                e.reviewerStatus = 'pending'
            }
            if (e.isManagerAccepted === 'yes') {
                e.managerStatus = 'approved'
            }
            else if (e.isManagerAccepted === 'no') {
                e.managerStatus = 'pending'
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

            e.paymentBy = await myFunc.getEmployeeNameById(e.paymentById, db)

           

        //     const paymentDetails = await db.query(
        //         `
        //                     select paymentBy from eve_hrm_reimburshment_payment_details as a
        //                     where a.status='A'
        //                     and a.reimburshmentId=:reimburshmentId
        //                     `, {
        //         replacements: {
        //             reimburshmentId: e.id
        //         }, type: QueryTypes.SELECT
        //     }
        //     )
        //     if (paymentDetails.length > 0) {
        //         e.paymentBy = await myFunc.getEmployeeNameById(paymentDetails[0].paymentBy, db)
        //         e.paymentById = (paymentDetails[0].paymentBy)
        //     }
        //     else {
        //         e.paymentBy = ''
        //         e.paymentById = ''
        //     }
            // const reimburshmentType = await db1.query(

            //     `
            //                            select typeName from eve_main_reimburshment_type
            //                            where status='A'
            //                            and id=:id

            //                            `
            //     , {
            //         replacements: {
            //             id: e.type
            //         },
            //         type: QueryTypes.SELECT
            //     }
            // )
            // if (reimburshmentType.length > 0) {
            //     e.typeName = reimburshmentType[0].typeName
            // }
            // else {
            //     e.type = null
            // }
        }))
        // let employeeType = ('White Collar'|| null || '')
        // let searchData = {
        //     paymentById: paymentBy,
        //     employeeBranchId:tokenBranchId,
        //     employeeType: employeeType,
        // }



        // let searchEmp = getData.filter((e, i) => {
        //     let boo = true
        //     for (let key in searchData) {
        //         if (searchData[key] && searchData[key] != e[key]) {
        //             boo = false
        //             break
        //         }
        //     }
        //     return boo
        // })




        const excelData = getData.map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Date': e.appliedDate,
            'Employee Name': e.employeeName,
            'Designation': e.designatioName,
            'Type': e.typeName,
            'Mobile': e.mobile,

            'Amount(₹)': myFunc.formatAmount(e.amount),
            'Remarks': e.remarks,
            'R1': e.r1,
            'R2': e.r2,
            'R3': e.r3,
            'Status': e.status,
            'Payment Status': e.paymentStatus,
            'Payment By': e.paymentBy
        }))

        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo,
         
            totalData: totalData,
            totalApprove: myFunc.formatAmount(totalApprove),
            totalPaid: myFunc.formatAmount(totalPaid),
            totalUnpaid: myFunc.formatAmount(totalUnpaid),
           
            employee: myFunc.replaceEmptyValues(excelData)
        })
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, amount, empInactiveName, empactiveName, paymentBy, fromDate, toDate, paymentStatus, reimburshmentType, remarks, mobileNo, actionById }) {
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getPaidReimbursementExcel`,
            data: { token, pageNo, limit, amount, empInactiveName, empactiveName, paymentBy, fromDate, toDate, paymentStatus, reimburshmentType, remarks, mobileNo, actionById }
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


    let a = header.indexOf('Mobile')
    let b = header.indexOf('Amount(₹)')

    let len = header.length
    let row = new Array(len).fill('')
    let space = new Array(len).fill('')
    row[a] = 'Total Approved'
    row[b] = data['totalApprove']


    let row1 = new Array(len).fill('')
    row1[a] = 'Total Paid'
    row1[b] = data['totalPaid']

    let row2 = new Array(len).fill('')
    row2[a] = 'Total Unpaid'
    row2[b] = data['totalUnpaid']

    values.push(space)
    values.push(row)
    values.push(row1)
    values.push(row2)








    worksheet.addRows(values)
    const headerRow = worksheet.getRow(1);
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' }
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
        cell.font = { bold: true }
    })
    worksheet.columns.forEach(column => {
        column.width = 20;
    })

    const lastRow = worksheet.lastRow;
    const secondLastRow = worksheet.getRow(lastRow.number - 1);
    const thirdLastRow = worksheet.getRow(lastRow.number - 2);


    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    secondLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    thirdLastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });


    return workbook.xlsx
}
async function getPaidReimbursmentExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }

        let { pageNo, limit, amount, empInactiveName, empactiveName, paymentBy, fromDate, toDate, paymentStatus, reimburshmentType, remarks, mobileNo, actionById } = data

        let apiData = await fetchData({ token, pageNo, limit, amount, empInactiveName, empactiveName, paymentBy, fromDate, toDate, paymentStatus, reimburshmentType, remarks, mobileNo, actionById })

        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Paid Reimbursment.xlsx"`);
        (await getExcel).write(res)
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getPaidReimbursmentExcel, getPaidReimbursmentExcelSheet }