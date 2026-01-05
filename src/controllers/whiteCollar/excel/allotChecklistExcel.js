let sequelize = require('../../../config/db');
const { QueryTypes } = require('sequelize');
const myFunc = require('../../../functions/functions');
const axios = require('axios')
const ExcelJS = require('exceljs');
const getAllotChecklistExcel = async (req, res) => {
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
        const { branchName, deptName, desigName, employeeName, subCompany,subDepartmentId,employeeCode } = data
        const countQuery = await db.query(
            `
                            SELECT COUNT(*) AS total
                            
                            FROM eve_acc_employee AS a                               
                            LEFT JOIN \`eve_employee-checklist-details\` AS b ON a.id=b.empId
                            WHERE a.status='A'
                            
                            AND (
                            a.employeeType='White Collar'
                            OR a.employeeType=''
                            OR a.employeeType IS NULL
                            )
                            AND (:branchName IS NULL OR a.employeeBranchId=:branchName)
                            AND (:deptName IS NULL OR a.employeeDepartmentId=:deptName)
                            AND (:employeeName IS NULL OR a.id=:employeeName)
                            AND (:subCompany IS NULL OR a.employeeSubCompanyId=:subCompany)
                              AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId=:subDepartmentId)
                               AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
                            

                        
                                 
                                                                      
            `, {
            replacements: {
                branchName: branchName || null,
                deptName: deptName || null,
                desigName: desigName || null,
                employeeName: employeeName || null,
                subCompany: subCompany || null,
                subDepartmentId: subDepartmentId || null,
                employeeCode: employeeCode || null,
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
                            SELECT DISTINCT 
                               a.id,
                               a.employeeCode,
                               a.employeeName,
                               a.employeeSubCompanyId,
                               a.employeeBranchId,
                               a.employeeDepartmentId,
                               a.employeeSubDepartmentId,
                               a.employeeDesignationId,
                               b.checkListCategoryId,
                               b.checkListId,
                               b.acceptStatus,
                               DATE_FORMAT(b.createdDate,'%d-%m-%Y') AS 'alocatedDate',
                               DATE_FORMAT(b.acceptDate,'%d-%m-%Y') AS 'acceptDate'
                               
                               FROM eve_acc_employee AS a
                               
                               LEFT JOIN \`eve_employee-checklist-details\` AS b ON a.id=b.empId
                            
                               WHERE a.status='A'

                                AND (
                            a.employeeType='White Collar'
                            OR a.employeeType=''
                            OR a.employeeType IS NULL
                            )
                                
                               AND (:branchName IS NULL OR a.employeeBranchId=:branchName)
                               AND (:deptName IS NULL OR a.employeeDepartmentId=:deptName)
                               AND (:desigName IS NULL OR a.employeeDesignationId=:desigName)
                               AND (:employeeName IS NULL OR a.id=:employeeName)
                               AND (:subCompany IS NULL OR a.employeeSubCompanyId=:subCompany)
                               AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId=:subDepartmentId)
                               AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)


                            
                               ORDER BY a.employeeName
                             
                               LIMIT :limit
                               OFFSET :offset                       
                         
            `
            , {
                replacements: {
                    offset: offset,
                    limit: limit,
                    branchName: branchName || null,
                    deptName: deptName || null,
                    desigName: desigName || null,
                    employeeName: employeeName || null,
                    subCompany: subCompany || null,
                    subDepartmentId: subDepartmentId || null,
                    employeeCode: employeeCode || null,
                }, type: QueryTypes.SELECT
            }
        )
        await Promise.all(getData.map(async (e, i) => {
            e.slno = i + 1
            e.subComapanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subdepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e.categoryName = await myFunc.getCheckListCategoryNameById(e.checkListCategoryId, db)
            e.checkList = await myFunc.getCheckListNameById(e.checkListId, db)
            if (e.acceptStatus == '0') {
                e.status = 'Pending'
            }
            else if (e.acceptStatus == '1') {
                e.status = 'Approved'
            }
            else if (e.acceptStatus == '2') {
                e.status = 'Rejected'
            }
            else {
                e.status = ''
            }
       
        }))




        const excelData = getData.map(e =>

        ({
            'Sl. No.': e.slno,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subComapanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subdepartmentName,
            'Category Name': e.categoryName,
            'Check List': e.checkList,
            'Status': e.status,
            'Allocated Date': e.alocatedDate,
            'Accepted or Rejected Date': e.acceptDate,


        }))
        return res.status(200).json({
            status: true,
            recordedPerPage: limit, currentPage: pageNo, 
            totalData: totalData,
            // totalData: getData.length,
            // employee: getData
            employee: myFunc.replaceEmptyValues(excelData)

        })

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }
}
async function fetchData({ token, pageNo, limit, branchName, deptName, desigName, employeeName, subCompany,subDepartmentId,employeeCode}) {

    try {

        const config = {
            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            url: `${process.env.BASE_URL}/whiteCollar/getAllotCheckListExcel`,
            data: { token, pageNo, limit, branchName, deptName, desigName, employeeName, subCompany,subDepartmentId,employeeCode }
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
    return workbook.xlsx
}

async function getAllotChecklistExcelSheet(req, res) {
    try {

        let token = req.headers["x-cross-auth"]
        let data = { ...req.query, ...req.body }
        let { pageNo, limit, branchName, deptName, desigName, employeeName, subCompany,subDepartmentId,employeeCode } = data
        let apiData = await fetchData({ token, pageNo, limit, branchName, deptName, desigName, employeeName, subCompany,subDepartmentId,employeeCode })
        let getExcel = createExcelFile(apiData)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Allot Checklist.xlsx"`);
        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }
}
module.exports = { getAllotChecklistExcel, getAllotChecklistExcelSheet }