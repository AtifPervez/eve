let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const axios = require('axios')
const ExcelJS = require('exceljs')

const getLeaveBalanceReportsExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        let dbMain = sequelize()
        // const tokenUserId = '29'
        // let db = sequelize('59')

        let data = req.body
        let { month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId } = data

        let leaveFinancialYear = await db.query(`
            SELECT * 
            FROM eve_acc_leave_financial_year_master 
            WHERE status='A'`,
            {
                replacements: {

                },
                type: QueryTypes.SELECT
                
            }
        )
        let financialYearFrom
        let financialYearTo

        if (leaveFinancialYear[0].financialYearTypeName == 'Calendar Year') {
            financialYearFrom = year
            financialYearTo = year
        }

        else {
            if (month <= 3) {
                financialYearFrom = `${parseInt(year) - 1}`
                financialYearTo = year

            } else {
                financialYearFrom = year
                financialYearTo = `${parseInt(year) + 1}`

            }
        }



        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
            FROM eve_acc_employee
            WHERE status='A'
            AND employeeType='Blue Collar'
            AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
            AND (:empId IS NULL OR id=:empId)
            AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
            AND (:branchId IS NULL OR employeeBranchId=:branchId)
            AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
            AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
            AND (:designationId IS NULL OR employeeDesignationId=:designationId)

              AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth
            






                            AND (employeeCurrentStatus = '' 
                            OR employeeCurrentStatus IS NULL 
                            OR employeeCurrentStatus = 'Active'
                            OR employeeCurrentStatus = 'resignation' 
                            OR employeeCurrentStatus = 'joining'
                            OR employeeCurrentStatus = 'termination'
                            OR employeeCurrentStatus = 'release' 
                            OR employeeCurrentStatus = 'offerletter')
            
            
`, {
            replacements: {
                employeeCode: empCode || null,
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,
                subDepartmentId: subDepartmentId || null,
                designationId: designationId || null,
                yearMonth: year + '-' + month,

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
             (@row_number:=@row_number + 1) AS 'slno',
             id AS empId,
             employeeName,
             employeeCode,
             employeeSubCompanyId,
             employeeBranchId,
             employeeDepartmentId,
             employeeSubDepartmentId,
             employeeDesignationId,
             employmentLeaveType

             FROM eve_acc_employee 
             CROSS JOIN (SELECT @row_number := :offset) AS init
             WHERE status='A'
             AND employeeType='Blue Collar'

               AND DATE_FORMAT(employeeDoj, "%Y-%m") <= :yearMonth

             AND (:employeeCode IS NULL OR employeeCode=:employeeCode)
             AND (:empId IS NULL OR id=:empId)
             AND (:subCompanyId IS NULL OR employeeSubCompanyId=:subCompanyId)
               AND (:branchId IS NULL OR employeeBranchId=:branchId)
                 AND (:departmentId IS NULL OR employeeDepartmentId=:departmentId)
                   AND (:subDepartmentId IS NULL OR employeeSubDepartmentId=:subDepartmentId)
                    AND (:designationId IS NULL OR employeeDesignationId=:designationId)


                            AND (employeeCurrentStatus = '' 
                            OR employeeCurrentStatus IS NULL 
                            OR employeeCurrentStatus = 'Active'
                            OR employeeCurrentStatus = 'resignation' 
                            OR employeeCurrentStatus = 'joining'
                            OR employeeCurrentStatus = 'termination'
                            OR employeeCurrentStatus = 'release' 
                            OR employeeCurrentStatus = 'offerletter')

             ORDER BY employeeName               
             LIMIT :limit
             OFFSET :offset  

            `, {
            replacements: {
                limit: limit,
                offset: offset,
                employeeCode: empCode || null,
                empId: empId || null,
                subCompanyId: subCompanyId || null,
                branchId: branchId || null,
                departmentId: departmentId || null,
                subDepartmentId: subDepartmentId || null,
                designationId: designationId || null,
                yearMonth: year + '-' + month,
            },
            type: QueryTypes.SELECT
        })
        await Promise.all(getData.map(async e => {
            e['subCompany'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e['branch'] = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e['Department'] = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['subDepartment'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e['designation'] = await myFunc.getDesignationNameById(e.employeeDesignationId, db)

            const leaveTypeModel = await db.query(`
                    SELECT

                     
                     CAST(id AS CHAR) AS id,
                     prefix,
                     colorCode
                    
    
                     FROM eve_acc_leave_type 
                 
                     WHERE status='A'
                     
                     
                     
                    `, {
                replacements: {


                },
                type: QueryTypes.SELECT
            })

            e.leaveDetails = []
            e.leaveDetails.push(...leaveTypeModel)

            const leaveSummaryModel = await db.query(`
                        
                        SELECT
                        leaveTypeId,
                        takeLeave,
                        availableLeave,
                        totalLeaveSum
                        FROM eve_acc_employee_leave_summary
                        WHERE status='A'
                        AND empId=:empId
                        AND fromDate=:financialYearFrom
                        AND toDate=:financialYearTo
                          
                        `, {
                replacements: {
                    empId: e.empId,
                    financialYearFrom: financialYearFrom,
                    financialYearTo: financialYearTo

                },
                type: QueryTypes.SELECT
            })

           
            const leaveSummaryMap = leaveSummaryModel.reduce((acc, z) => {
                acc[z.leaveTypeId] = z;
                return acc;
            }, {});

            // Map through leaveDetails and update the properties
            e.leaveDetails.forEach(x => {
                if (leaveSummaryMap[x.id]) {
                    //   x.takeLeave = leaveSummaryMap[x.id].takeLeave;
                    x.total = leaveSummaryMap[x.id].availableLeave;
                    //   x.totalLeaveSum = leaveSummaryMap[x.id].totalLeaveSum;
                } else {
                    //   x.takeLeave = '';
                    x.total = '--';
                    //   x.totalLeaveSum = '';
                }
            });




        }))

        const leaveBalanceExcel = getData.map(e => ({
            'Sl. No.': e.slno,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Department': e.Department,
            'Sub Department': e.subDepartment,
            'Designation': e.designation,
            'Leave Balance': e.leaveDetails
        }))

        return res.status(200).json({
            status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData,
            employee: myFunc.replaceEmptyValues(leaveBalanceExcel)
        });

    } catch (error) {
        return res.status(500).send({ status: false, err: error.message, msg: error.stack })
    }
}

async function fetchData({ token, month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId }) {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-cross-auth': token
            },
            method: 'POST',
            url: `${process.env.BASE_URL}/reports/getLeaveBalanceReportsExcel`,

            data: { token, month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId }
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
    let values = [];
    let employee = data.employee;
    let header = Object.keys(employee[0]);

    employee.forEach(e => {
        let value = Object.values(e);
        values.push(value);
    });

    const totalData = employee[0]['Leave Balance'];

    const totalPrefixes = totalData.map(e => e.prefix);
    // console.log(totalPrefixes);
    const totalStartIndex = header.indexOf('Leave Balance');

    const headerRowOne = worksheet.getRow(1); // Add the main header to the first row
    header = header.slice(0, totalStartIndex).concat(['Leave Balance']).concat(new Array(totalData.length - 1));
    
    headerRowOne.values = header;
    headerRowOne.commit();

    // Add the subheader to the second row starting from the 9th column
    const subHeaderRow = worksheet.getRow(2);
    const rangeArray = Array.from({ length: 8 }, (v, i) => i + 1);
   
    rangeArray.map(i => {
        const firstCell = subHeaderRow.getCell(i);
            firstCell.value = '';
            firstCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
    });


    for (let i = 0; i < totalPrefixes.length; i++) {
        subHeaderRow.getCell(i + 9).value = totalPrefixes[i];
    }
    subHeaderRow.commit();

    worksheet.addRows(values);

    employee.map((e, i) => {
        e['Leave Balance'].map((item, index) => {
            const cellIndex = headerRowOne.values.indexOf('Leave Balance') + index; // +1 for 1-based index
            const columnLetter = getColumnLetter(cellIndex);
            const valueCell = worksheet.getCell(`${columnLetter}${i + 3}`); // Target cell in the 3rd row

            if (i === 0 && item.colorCode) {
                const cell = subHeaderRow.getCell(cellIndex);
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: item.colorCode.replace('#', '') },
                };
            }

            valueCell.value = item.total;
        });
    });

    worksheet.mergeCells(`${getColumnLetter(headerRowOne.values.indexOf('Leave Balance'))}1:${getColumnLetter(employee[0]['Leave Balance'].length - 1 + headerRowOne.values.indexOf('Leave Balance'))}1`);

    function getColumnLetter(colIndex) {
        let letter = '';
        while (colIndex > 0) {
            let modulo = (colIndex - 1) % 26;
            letter = String.fromCharCode(modulo + 65) + letter;
            colIndex = Math.floor((colIndex - modulo) / 26);
        }
        return letter;
    }

    // Apply formatting to header rows
    const headerRow = worksheet.getRow(1);
    const headerRow2 = worksheet.getRow(2);

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            row.height = 30;
        });
    });

    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
        cell.font = { bold: true };
    });

    headerRow2.eachCell(cell => {
        cell.font = { bold: true };
    });

    // Set column widths
    for (let i = 1; i <= header.length; i++) {
        const column = worksheet.getColumn(i);
        column.width = 20; // Set the desired width in characters
    }

    worksheet.views = [
        { state: 'normal', zoomScale: 80 }
    ];

    return workbook.xlsx;
}




async function getLeaveBalanceReportsExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let year = (req.body.year || req.query.year)
        let month = (req.body.month || req.query.month)
        let limit = (req.body.limit || req.query.limit)
        let pageNo = (req.body.pageNo || req.query.pageNo)
        let empCode = (req.body.empCode || req.query.empCode)
        let empId = (req.body.empId || req.query.empId)
        let subCompanyId = (req.body.subCompanyId || req.query.subCompanyId)
        let branchId = (req.body.branchId || req.query.branchId)
        let departmentId = (req.body.departmentId || req.query.departmentId)
        let subDepartmentId = (req.body.subDepartmentId || req.query.subDepartmentId)
        let designationId = (req.body.designationId || req.query.designationId)


        let apiData = await fetchData({ token, pageNo, limit, month, year, empCode, empId, subCompanyId, branchId, departmentId, subDepartmentId, designationId })

        if (apiData.employee.length == 0) {
            return res.status(400).send({ status: false, msg: 'no data found' })
        }


        let getExcel = createExcelFile(apiData)


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="allLeaveReport.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getLeaveBalanceReportsExcel, getLeaveBalanceReportsExcelSheet }