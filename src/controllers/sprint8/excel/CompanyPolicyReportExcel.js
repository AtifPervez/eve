let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')

const getCompanyPolicyReportExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        // const tokenUserId = '29'
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // let db = sequelize('59')


        let data = req.body
        let { empCode, employeeId, subCompanyName, branchName, deptName, subDepartmentId, desigName, policyName, status, companyFromDate, companyToDate } = data

        let countQuery = await db.query(`
                SELECT COUNT(*) AS total
                FROM eve_hrm_company_policy_employee AS policy
                LEFT JOIN eve_acc_employee AS emp ON emp.id=policy.employeeId
                WHERE
                policy.status='A'
                AND  policy.signedDocumentUploadDateTime IS NOT NULL

                AND (:empCode IS NULL OR emp.employeeCode = :empCode )
                AND (:employeeId IS NULL OR policy.employeeId = :employeeId )
                AND (:subCompanyName IS NULL OR emp.employeeSubCompanyId=:subCompanyName)
                AND (:branchName IS NULL OR emp.employeeBranchId=:branchName)
                AND (:deptName IS NULL OR emp.employeeDepartmentId=:deptName)
                AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId=:subDepartmentId)
                AND (:desigName IS NULL OR emp.employeeDesignationId=:desigName)
                AND (:policyName IS NULL OR policy.policyId=:policyName)
                  AND (:companyFromDate IS NULL OR DATE(policy.signedDocumentUploadDateTime) >= :companyFromDate)
              AND (:companyToDate IS NULL OR DATE(policy.signedDocumentUploadDateTime) <= :companyToDate)

                AND (:status IS NULL OR policy.policy_status = 
                    CASE 
                    WHEN :status = 'Approved' THEN 'A'
                    WHEN :status = 'Pending' THEN 'W'
                    WHEN :status = 'Rejected' THEN 'C'
                    ELSE null
                    END )
            
            
`, {
            replacements: {
                empCode: empCode || null,
                employeeId: employeeId || null,
                subCompanyName: subCompanyName || null,
                branchName: branchName || null,
                deptName: deptName || null,
                subDepartmentId: subDepartmentId || null,
                desigName: desigName || null,
                policyName: policyName || null,
                status: status || null,
                companyFromDate: companyFromDate || null,
                companyToDate: companyToDate || null,

            },
            type: QueryTypes.SELECT
        })

        const totalData = countQuery[0].total

        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }


        let limit = parseInt(req.body.limit) || totalData
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
         SELECT


                

                policy.employeeId,
                emp.employeeName,
                emp.employeeCode,
                emp.employeeSubCompanyId,
                emp.employeeBranchId,
                emp.employeeDepartmentId,
                emp.employeeSubDepartmentId,
                emp.employeeDesignationId,

                policy.title AS policyName,
                policy.policyId,
                

                CASE 
                WHEN policy.policy_status = 'A' THEN 'Approved'
                WHEN policy.policy_status = 'W' THEN 'Pending'
                WHEN policy.policy_status = 'C' THEN 'Rejected'
                ELSE policy.policy_status
                END AS status,

                DATE_FORMAT(policy.signedDocumentUploadDateTime,'%d-%m-%Y') AS acceptedDate,
                policy.signedDocumentUploadDateTime
                

                FROM eve_hrm_company_policy_employee AS policy
                LEFT JOIN eve_acc_employee AS emp ON emp.id=policy.employeeId

             

                WHERE
                policy.status='A'
                AND  policy.signedDocumentUploadDateTime IS NOT NULL

                AND (:empCode IS NULL OR emp.employeeCode = :empCode )
                AND (:employeeId IS NULL OR policy.employeeId = :employeeId )
                 AND (:subCompanyName IS NULL OR emp.employeeSubCompanyId=:subCompanyName)
              AND (:branchName IS NULL OR emp.employeeBranchId=:branchName)
                AND (:deptName IS NULL OR emp.employeeDepartmentId=:deptName)
                AND (:subDepartmentId IS NULL OR emp.employeeSubDepartmentId=:subDepartmentId)
                 AND (:desigName IS NULL OR emp.employeeDesignationId=:desigName)

                   AND (:policyName IS NULL OR policy.policyId=:policyName)
                   





                      AND (:status IS NULL OR policy.policy_status = 
               CASE 
               WHEN :status = 'Approved' THEN 'A'
               WHEN :status = 'Pending' THEN 'W'
               WHEN :status = 'Rejected' THEN 'C'
               ELSE null
               END )


              AND (:companyFromDate IS NULL OR DATE(policy.signedDocumentUploadDateTime) >= :companyFromDate)
              AND (:companyToDate IS NULL OR DATE(policy.signedDocumentUploadDateTime) <= :companyToDate)

                ORDER BY emp.employeeName
                
                LIMIT :limit
                OFFSET :offset
                
                
`,
            {
                replacements: {
                    limit: limit,
                    offset: offset,
                    empCode: empCode || null,
                    employeeId: employeeId || null,
                    subCompanyName: subCompanyName || null,
                    branchName: branchName || null,
                    deptName: deptName || null,
                    subDepartmentId: subDepartmentId || null,
                    desigName: desigName || null,
                    policyName: policyName || null,
                    status: status || null,
                    companyFromDate: companyFromDate || null,
                    companyToDate: companyToDate || null,


                },
                type: QueryTypes.SELECT
            })

        await Promise.all(getData.map(async (e, i) => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
        }))

        let companyPolicyAcceptanceExcel=getData.map((e,i)=>({
            'Sl. No.': Number(i+1),
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'Policy Name':e.policyName,
            'Status':e.status,
            'Accepted Date':e.acceptedDate
        }))

        return res.status(200).json({
            status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData,
            // employee: getData
            employee: myFunc.replaceEmptyValues(companyPolicyAcceptanceExcel)
        })

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}

async function fetchData({ token, empCode, employeeId, subCompanyName, branchName, deptName, subDepartmentId, desigName, policyName, status, companyFromDate, companyToDate }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            // url: 'http://localhost:3000/reports/getCompanyPolicyReportExcel',
            url:`${process.env.BASE_URL}/reports/getCompanyPolicyReportExcel`,

            data: { token, empCode, employeeId, subCompanyName, branchName, deptName, subDepartmentId, desigName, policyName, status, companyFromDate, companyToDate }

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


    // let quantityIndex = header.indexOf('Quantity')
    // let len = header.length
    // let row = new Array(len).fill('')
    // row[quantityIndex] = data['totalQuantity']
    // values.push(row)




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


    // //totalAmount Bold 
    // const lastRow = worksheet.lastRow;

    // lastRow.eachCell((cell, colNumber) => {
    //     cell.font = { bold: true };
    // });

    return workbook.xlsx



}

async function getCompanyPolicyReportExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let empCode = req.body.empCode || req.query.empCode

        let employeeId = req.body.employeeId || req.query.employeeId
        let subCompanyName = req.body.subCompanyName || req.query.subCompanyName
        let branchName = req.body.branchName || req.query.branchName

        let deptName = req.body.deptName || req.query.deptName
        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId
        let desigName = req.body.desigName || req.query.desigName
        let policyName = req.body.policyName || req.query.policyName
        let status = req.body.status || req.query.status
        let companyFromDate = req.body.companyFromDate || req.query.companyFromDate
        let companyToDate = req.body.companyToDate || req.query.companyToDate
       
       

        let apiData = await fetchData({
            pageNo,limit,token, empCode, employeeId, subCompanyName, branchName, deptName, subDepartmentId, desigName, policyName, status, companyFromDate, companyToDate
        })
        if (!apiData || !apiData.status || (apiData.employee && apiData.employee.length === 0)) {
            return res.status(404).send({ status: false, msg: 'No data found' });
        }
        let getExcel = createExcelFile(apiData)
        if (!getExcel) {
            return res.status(404).send({ status: false, msg: 'No data found' });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="assetRequestReport.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, err: error.message, msg: error.stack })
    }
}
module.exports = { getCompanyPolicyReportExcel, getCompanyPolicyReportExcelSheet }