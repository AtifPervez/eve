let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')

const getAdvanceReportExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '29'
        // let db = sequelize('59')
        let dbMain = sequelize()

        let data = req.body
        let { currYear, currMonth, empCode, empName, subComp, branch, department, subDepartmentId, designation, fromDate, toDate, AdvanceAmount } = data


        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_acc_employee_other_advance_payment AS a
            LEFT JOIN eve_acc_employee_other_advance_payment_details AS b  ON a.employeeId=b.employeeId
            LEFT JOIN eve_acc_employee AS c  ON a.employeeId=c.id

            
          
         
            WHERE a.status='A'
          
            AND a.yearNumber=:currYear
            

            AND      
                LPAD(
                    CASE 
                    WHEN a.monthNumber = 'January' THEN 1
                    WHEN a.monthNumber = 'February' THEN 2
                    WHEN a.monthNumber = 'March' THEN 3
                    WHEN a.monthNumber = 'April' THEN 4
                    WHEN a.monthNumber = 'May' THEN 5
                    WHEN a.monthNumber = 'June' THEN 6
                    WHEN a.monthNumber = 'July' THEN 7
                    WHEN a.monthNumber = 'August' THEN 8
                    WHEN a.monthNumber = 'September' THEN 9
                    WHEN a.monthNumber = 'October' THEN 10
                    WHEN a.monthNumber = 'November' THEN 11
                    WHEN a.monthNumber = 'December' THEN 12
                    ELSE a.monthNumber END, 2, '0')=:currMonth

            AND (:empCode IS NULL OR   c.employeeCode=:empCode)
            AND (:empName IS NULL OR  a.employeeId=:empName)
            AND (:subComp IS NULL OR  c.employeeSubCompanyId=:subComp)  
            AND (:branch IS NULL OR  c.employeeBranchId=:branch)
            AND (:department IS NULL OR  c.employeeDepartmentId=:department) 
            AND (:subDepartmentId IS NULL OR  c.employeeSubDepartmentId=:subDepartmentId)
            
            AND (:designation IS NULL OR  c.employeeDesignationId=:designation)

            AND (:fromDate IS NULL OR  DATE(b.createdDate)>=:fromDate)
            AND (:toDate IS NULL OR  DATE(b.createdDate)<=:toDate)

              AND (:AdvanceAmount IS NULL OR  b.totalAmount=:AdvanceAmount)
  
         
            `, {
            replacements: {
                currYear: currYear,
                currMonth: currMonth,
                tokenUserId: tokenUserId,
                empCode: empCode || null,
                empName: empName || null,
                subComp: subComp || null,
                branch: branch || null,
                department: department || null,
                subDepartmentId: subDepartmentId || null,
                designation: designation || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
                AdvanceAmount: AdvanceAmount || null,

            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total


        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
            SELECT

            (@row_number:=@row_number + 1) AS slno,
            
            a.employeeId,
            c.employeeName,
            c.employeeCode,
            c.employeeSubCompanyId,
            c.employeeBranchId,
            c.employeeDepartmentId,
            c.employeeSubDepartmentId,
            c.employeeDesignationId,
                            
            a.yearNumber,
            a.createdBy,

           LPAD(
                CASE 
                WHEN a.monthNumber = 'January' THEN 1
                WHEN a.monthNumber = 'February' THEN 2
                WHEN a.monthNumber = 'March' THEN 3
                WHEN a.monthNumber = 'April' THEN 4
                WHEN a.monthNumber = 'May' THEN 5
                WHEN a.monthNumber = 'June' THEN 6
                WHEN a.monthNumber = 'July' THEN 7
                WHEN a.monthNumber = 'August' THEN 8
                WHEN a.monthNumber = 'September' THEN 9
                WHEN a.monthNumber = 'October' THEN 10
                WHEN a.monthNumber = 'November' THEN 11
                WHEN a.monthNumber = 'December' THEN 12
                ELSE a.monthNumber END, 2, '0') AS monthNumber,

            a.openingAmount AS 'Opening Balance',
            a.claimedAmnt AS 'EMI/Deduction',
            a.closingAmnt AS 'Closing Balance',
            a.description AS 'Description',
            b.totalAmount AS 'Advance Amount (₹)',
            DATE_FORMAT(b.createdDate,'%d-%m-%Y') AS 'Advance Taken On'
            	
            
            
            FROM eve_acc_employee_other_advance_payment AS a
            LEFT JOIN eve_acc_employee_other_advance_payment_details AS b  ON a.employeeId=b.employeeId
            LEFT JOIN eve_acc_employee AS c  ON a.employeeId=c.id

            CROSS JOIN (SELECT @row_number := :offset) AS init
          
         
            WHERE a.status='A'
          
            AND a.yearNumber=:currYear
            

            AND      
                LPAD(
                    CASE 
                    WHEN a.monthNumber = 'January' THEN 1
                    WHEN a.monthNumber = 'February' THEN 2
                    WHEN a.monthNumber = 'March' THEN 3
                    WHEN a.monthNumber = 'April' THEN 4
                    WHEN a.monthNumber = 'May' THEN 5
                    WHEN a.monthNumber = 'June' THEN 6
                    WHEN a.monthNumber = 'July' THEN 7
                    WHEN a.monthNumber = 'August' THEN 8
                    WHEN a.monthNumber = 'September' THEN 9
                    WHEN a.monthNumber = 'October' THEN 10
                    WHEN a.monthNumber = 'November' THEN 11
                    WHEN a.monthNumber = 'December' THEN 12
                    ELSE a.monthNumber END, 2, '0')=:currMonth

            AND (:empCode IS NULL OR   c.employeeCode=:empCode)

            AND (:empName IS NULL OR  a.employeeId=:empName)

            AND (:subComp IS NULL OR  c.employeeSubCompanyId=:subComp)

            AND (:branch IS NULL OR  c.employeeBranchId=:branch)

            AND (:department IS NULL OR  c.employeeDepartmentId=:department)

            AND (:subDepartmentId IS NULL OR  c.employeeSubDepartmentId=:subDepartmentId)

            AND (:designation IS NULL OR  c.employeeDesignationId=:designation)
            AND (:fromDate IS NULL OR  DATE(b.createdDate)>=:fromDate)
            AND (:toDate IS NULL OR  DATE(b.createdDate)<=:toDate)
            AND (:AdvanceAmount IS NULL OR  b.totalAmount=:AdvanceAmount)

            LIMIT :limit
            OFFSET :offset        
  
         
            `, {
            replacements: {
                limit: limit,
                offset: offset,
                currYear: currYear,
                currMonth: currMonth,
                tokenUserId: tokenUserId,
                empCode: empCode || null,
                empName: empName || null,
                subComp: subComp || null,
                branch: branch || null,
                department: department || null,
                subDepartmentId: subDepartmentId || null,
                designation: designation || null,
                fromDate: fromDate || null,
                toDate: toDate || null,
                AdvanceAmount: AdvanceAmount || null,

            },
            type: QueryTypes.SELECT
        })
        let emiDeduction=0

        await Promise.all(getData.map(async e => {
            emiDeduction+=parseFloat(e['EMI/Deduction'])

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e['Advance Amount (₹)'] = myFunc.formatAmount(e['Advance Amount (₹)'])
            e['Opening Balance'] = myFunc.formatAmount(e['Opening Balance'])
            e['EMI/Deduction'] = myFunc.formatAmount(e['EMI/Deduction'])
            e['Closing Balance'] = myFunc.formatAmount(e['Closing Balance'])

        }))
        let advanceReportExcel = getData.map(e => ({
            'Sl. No.': e.slno,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'Advance Taken On': e['Advance Taken On'],
            'Advance Amount (₹)': e['Advance Amount (₹)'],
            'Description': e['Description'],
            'Opening Balance': e['Opening Balance'],
            'EMI/Deduction': e['EMI/Deduction'],
            'Closing Balance': e['Closing Balance'],
        }))


        res.status(200).json({
            status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData,
            // employee: getData 
           
            emiDeduction:`TOTAL (₹) : ${myFunc.formatAmount(emiDeduction)}`,
            employee: myFunc.replaceEmptyValues(advanceReportExcel)
        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}

async function fetchData({ token, pageNo, limit, currYear, currMonth, empCode, empName, subComp, branch, department, subDepartmentId, designation, fromDate, toDate, sortOrder, AdvanceAmount }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            // url: 'http://localhost:3000/reports/getAdvanceReportsExcel',
            url:`${process.env.BASE_URL}/reports/getAdvanceReportsExcel`,

            data: { token, pageNo, limit, currYear, currMonth, empCode, empName, subComp, branch, department, subDepartmentId, designation, fromDate, toDate, sortOrder, AdvanceAmount }

        }
        const response = await axios(config)
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { status: false, msg: 'No data found' };
        }
        throw error;
    }
}

async function createExcelFile(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    let values = []
    let employee = data.employee

    if (!employee || employee.length === 0) {
        return null;
    }

    let header = Object.keys(employee[0])

    values.push(header)
    employee.forEach(e => {
        let value = Object.values(e)

        values.push(value)
    });


    let emiDeductionIndex = header.indexOf('EMI/Deduction')
    let len = header.length
    let row = new Array(len).fill('')
    row[emiDeductionIndex]=data['emiDeduction']
    values.push(row)




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
            row.height = 30

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

    lastRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
    });
    return workbook.xlsx



}

async function getAdvanceReportExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let currYear = req.body.currYear || req.query.currYear
        let currMonth = req.body.currMonth || req.query.currMonth
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let empCode = req.body.empCode || req.query.empCode

        let empName = req.body.empName || req.query.empName
        let subComp = req.body.subComp || req.query.subComp
        let branch = req.body.branch || req.query.branch

        let department = req.body.department || req.query.department
        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId
        let designation = req.body.designation || req.query.designation
        let fromDate = req.body.fromDate || req.query.fromDate
        let toDate = req.body.toDate || req.query.toDate
        let AdvanceAmount = req.body.AdvanceAmount || req.query.AdvanceAmount


        let apiData = await fetchData({
            token,pageNo, limit, currYear, currMonth, empCode, empName, subComp, branch, department, subDepartmentId, designation, fromDate, toDate, AdvanceAmount
        })
     
        let getExcel = createExcelFile(apiData)
     

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="advanceReport.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, err: error.message, msg: error.stack })
    }
}








module.exports = { getAdvanceReportExcel,getAdvanceReportExcelSheet }
















