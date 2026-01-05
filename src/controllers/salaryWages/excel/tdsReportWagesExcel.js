let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const ExcelJS = require('exceljs')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const getTdsReportWagesExcel = async (req, res) => {

    try {

        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        const companyId = decodedToken.companyId
        const branchId = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let db = sequelize(companyId)
        // let db = sequelize('59')
        let data = { ...req.body, ...req.query }
        let { year, month, api, id, employeeCode, employeeSubCompanyId, employeeBranchId, employeeDepartmentId, employeeSubDepartmentId, employeeDesignationId } = data

        let countQuery = await db.query(`

            SELECT COUNT(*) AS total
            FROM eve_acc_employee AS a 
            -- LEFT JOIN eve_blue_employee_tds_amount AS b ON a.id=b.empId 
            WHERE a.status="A"  
            AND a.employeeType='Blue Collar'

            AND (:id IS NULL OR a.id=:id)
             AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
             AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
             AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
             AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
             AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
             AND (:employeeDesignationId IS NULL OR a.employeeDesignationId=:employeeDesignationId)

                AND (
                    a.employeeCurrentStatus = '' 
                    OR a.employeeCurrentStatus IS NULL 
                    OR a.employeeCurrentStatus = 'Active'
                    OR a.employeeCurrentStatus = 'joining'
                    OR a.employeeCurrentStatus = 'offerletter'
                )      

            `, {
            replacements: {
                year: year,
                month: month,
                id: id || null,
                employeeCode: employeeCode || null,
                employeeSubCompanyId: employeeSubCompanyId || null,
                employeeBranchId: employeeBranchId || null,
                employeeDepartmentId: employeeDepartmentId || null,
                employeeSubDepartmentId: employeeSubDepartmentId || null,
                employeeDesignationId: employeeDesignationId || null,
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total
        if (totalData === 0) {
            return res.status(200).json({ status: true, result: 'error', alert: 'No Data Found' })
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
            
            SELECT 
            a.id,a.employeeName,
            -- b.year,b.month,b.amount,
            a.employeeCode,
            a.employeeSubCompanyId,
            a.employeeBranchId,
            a.employeeDepartmentId,
            a.employeeSubDepartmentId,
            a.employeeDesignationId

            FROM eve_acc_employee AS a 
            -- LEFT JOIN eve_blue_employee_tds_amount AS b ON a.id=b.empId

            where a.status="A"  
            AND a.employeeType='Blue Collar'

            AND (:id IS NULL OR a.id=:id)
             AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
             AND (:employeeSubCompanyId IS NULL OR a.employeeSubCompanyId=:employeeSubCompanyId)
             AND (:employeeBranchId IS NULL OR a.employeeBranchId=:employeeBranchId)
             AND (:employeeDepartmentId IS NULL OR a.employeeDepartmentId=:employeeDepartmentId)
             AND (:employeeSubDepartmentId IS NULL OR a.employeeSubDepartmentId=:employeeSubDepartmentId)
             AND (:employeeDesignationId IS NULL OR a.employeeDesignationId=:employeeDesignationId)

              AND (
                    a.employeeCurrentStatus = '' 
                    OR a.employeeCurrentStatus IS NULL 
                    OR a.employeeCurrentStatus = 'Active'
                    OR a.employeeCurrentStatus = 'joining'
                    OR a.employeeCurrentStatus = 'offerletter'
                )

            ORDER BY a.employeeName
            LIMIT :limit
            OFFSET :offset     
                        
            `, {

            replacements: {
                limit: limit,
                offset: offset,
                year: year,
                month: month,
                id: id || null,
                employeeCode: employeeCode || null,
                employeeSubCompanyId: employeeSubCompanyId || null,
                employeeBranchId: employeeBranchId || null,
                employeeDepartmentId: employeeDepartmentId || null,
                employeeSubDepartmentId: employeeSubDepartmentId || null,
                employeeDesignationId: employeeDesignationId || null,
            },
            type: QueryTypes.SELECT
        })
        let noOfMonths = 12
        let aprilAmt = 0, mayAmt = 0, juneAmt = 0, julyAmt = 0;
        let augAmt = 0, sepAmt = 0, octAmt = 0, novAmt = 0;
        let decAmt = 0, janAmt = 0, febAmt = 0, marAmt = 0;

        await Promise.all(getData.map(async (e, i) => {

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await myFunc.departmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            const monthsArray = []


            for (let i = 0; i < noOfMonths; i++) {
                let monthNumber = ((i + 3) % 12) + 1;
                let number = monthNumber.toString().padStart(2, '0');
                let yearPart

                if (monthNumber >= 4) {
                    yearPart = year.split("-")[0]; // April to December
                } else {
                    yearPart = year.split("-")[1]; // January to March
                }

                let newObj = {
                    year: yearPart,
                    month: number,
                    monthName: moment(number, 'M').format('MMMM'),
                }
                monthsArray.push(newObj)
            }

            e.app = monthsArray


            await Promise.all(e.app.map(async (x, i) => {
                let amount = 0
                const getTds = await db.query(
                    `
                 SELECT month,year,a.amount,a.createdBy,
                DATE_FORMAT(a.createdDate,'%d-%m-%Y') AS createdDate,
                a.createdTime
                -- ,a.year,a.month,a.paidStatus 
                FROM eve_blue_employee_tds_amount AS a
                WHERE a.status='A'
                AND a.empId=:id AND a.year=:year AND a.month=:month
                 
                `, {
                    replacements: {
                        year: x.year, month: x.month, id: e.id
                    }, type: QueryTypes.SELECT
                })

                // console.log(getTds);

                if (getTds.length > 0) {
                    const lastTds = getTds[getTds.length - 1]

                    amount += getTds.reduce((sum, ele) => sum + parseFloat(ele.amount), 0)

                    const lastUpdatedBy = await myFunc.getEmployeeNameById(lastTds.createdBy, db)
                    e.updatedBy = `${lastUpdatedBy}(${lastTds.createdDate}-${lastTds.createdTime})`
                }
                else {
                    e.updatedBy = ''
                }
                x.amount = amount

                switch (x.monthName) {
                    case 'April': aprilAmt += x.amount; break;
                    case 'May': mayAmt += x.amount; break;
                    case 'June': juneAmt += x.amount; break;
                    case 'July': julyAmt += x.amount; break;
                    case 'August': augAmt += x.amount; break;
                    case 'September': sepAmt += x.amount; break;
                    case 'October': octAmt += x.amount; break;
                    case 'November': novAmt += x.amount; break;
                    case 'December': decAmt += x.amount; break;
                    case 'January': janAmt += x.amount; break;
                    case 'February': febAmt += x.amount; break;
                    case 'March': marAmt += x.amount; break;
                }

            }))

        }))

        if (api === 'raw') {
            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                employee: getData,
            })
        }

       
        let excelData = getData.map((e, i) => {
            // Convert app array to { April: 10, May: 101, ... }
            const monthData = {};
            e.app.forEach(entry => {
                monthData[entry.monthName] = entry.amount;
            });

            return {
                'Sl. No.': i + 1,
                'Employee Code': e.employeeCode,
                'Employee Name': e.employeeName,
                'Sub Company': e.subCompanyName,
                'Branch': e.branchName,
                'Department': e.departmentName,
                'Sub Department': e.subDepartmentName,
                'Designation': e.designationName,
                'Updated By': e.updatedBy,
                ...monthData // Spread monthName: amount pairs
            };
        });


        if (api === 'excel') {

            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                employee: excelData
            })

        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tds Report');
        let values = []
        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);
        let employee = myFunc.replaceEmptyValues(excelData)

        employee.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        })

        worksheet.addRows(values);

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell(cell => {
                cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            row.height = 20;
        });

        // Header style
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
            cell.font = { bold: true };
        });

        worksheet.columns.forEach(column => {
            column.width = 35;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Tds Report.xlsx"`);

        await workbook.xlsx.write(res);


    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message })
    }
}
module.exports = { getTdsReportWagesExcel }









