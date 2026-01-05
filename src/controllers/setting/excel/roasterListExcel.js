let sequelize = require('../../../config/db')
const { QueryTypes, json } = require('sequelize')
const fn = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const getRoasterListExcel = async (req, res) => {

    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenbranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        // const tokenbranchId = '1'
        // const tokenCompanyId = '59'
        let db = sequelize(tokenCompanyId)
        let data = { ...req.body, ...req.query }
        let { departmentId, subCompanyId, year, month, api, branchId, desigId, empName, employeeCode, subDepartmentId, location } = data

        const countQuery = await db.query(
            `                      
                                 SELECT COUNT(*) AS totalData
                              

                                 FROM eve_acc_employee AS a
                                 WHERE a.status='A'
                                 AND a.employeeType='Blue Collar'   
                                 -- AND a.employeeBranchId= :tokenbranchId

                                   AND (:departmentId IS NULL OR a.employeeDepartmentId=:departmentId)
                                   AND (:desigId IS NULL OR a.employeeDesignationId=:desigId)
                                   AND (:location IS NULL OR a.locationId=:location)

                                   AND (
                             a.employeeCurrentStatus = '' 
                             OR a.employeeCurrentStatus IS NULL 
                             OR a.employeeCurrentStatus = 'Active'
                             OR a.employeeCurrentStatus = 'resignation' 
                             OR a.employeeCurrentStatus = 'joining'
                             OR a.employeeCurrentStatus = 'termination'
                             OR a.employeeCurrentStatus = 'release' 
                             OR a.employeeCurrentStatus = 'offerletter'
                             )
                             AND (:branchId IS NULL OR employeeBranchId=:branchId)
                             AND (:empName IS NULL OR a.employeeName=:empName)
                             AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
                             AND (:subCompanyId IS NULL OR a.employeeSubCompanyId=:subCompanyId)
                               AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId=:subDepartmentId)

                             AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth

                           


                             
            `, {
            replacements: {
                tokenbranchId: tokenbranchId,
                yearMonth: year + '-' + month,
                branchId: branchId || null,
                departmentId: departmentId || null,
                desigId: desigId || null,
                empName: empName || null,
                employeeCode: employeeCode || null,
                subCompanyId: subCompanyId || null,
                subDepartmentId: subDepartmentId || null,
                location: location || null,

            }, type: QueryTypes.SELECT
        })



        const totalData = countQuery[0].totalData;


        if (totalData === 0) {

            return res.status(200).send({ status: false, msg: 'no data found', totalData: 0 })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        const empSql = await db.query(
            `                      
            SELECT 
            a.id,
            a.employeeBranchId, 
            a.employeeSubCompanyId,
            a.employeeName,
            a.employeeCode,
            a.employeeDoj,
            -- employeeDepartment,
            a.employeeSubDepartmentId,
            -- employeeDesignation,
            a.employeeDepartmentId,
            a.employeeDesignationId,
            a.locationId
            
            FROM eve_acc_employee AS a
            WHERE a.status='A'
            AND a.employeeType='Blue Collar'   
            -- AND a.employeeBranchId= :tokenbranchId
             AND (:branchId IS NULL OR a.employeeBranchId=:branchId)
             AND (:departmentId IS NULL OR a.employeeDepartmentId=:departmentId)
               AND (:desigId IS NULL OR a.employeeDesignationId=:desigId)
                 AND (:location IS NULL OR a.locationId=:location)
            
            AND (
                a.employeeCurrentStatus = '' 
                OR a.employeeCurrentStatus IS NULL 
                OR a.employeeCurrentStatus = 'Active'
                OR a.employeeCurrentStatus = 'resignation' 
                OR a.employeeCurrentStatus = 'joining'
                OR a.employeeCurrentStatus = 'termination'
                OR a.employeeCurrentStatus = 'release' 
                OR a.employeeCurrentStatus = 'offerletter'
                )

                   AND (:empName IS NULL OR a.employeeName=:empName)
                       AND (:employeeCode IS NULL OR a.employeeCode=:employeeCode)
                         AND (:subCompanyId IS NULL OR a.employeeSubCompanyId=:subCompanyId)
                         AND (:subDepartmentId IS NULL OR a.employeeSubDepartmentId=:subDepartmentId)
                
                AND DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth
                
                ORDER BY a.employeeName
                
                limit :limit offset :offset
                
                
                
                `, {
            replacements: {
                tokenbranchId: tokenbranchId,
                yearMonth: year + '-' + month,
                limit: limit,
                offset: offset,
                branchId: branchId || null,
                departmentId: departmentId || null,
                desigId: desigId || null,
                empName: empName || null,
                employeeCode: employeeCode || null,
                subCompanyId: subCompanyId || null,
                subDepartmentId: subDepartmentId || null,
                location: location || null,

            }, type: QueryTypes.SELECT
        })


        const daysInCurrentMonth = fn.getDaysInMonth(year, month);
        let NoOfdaysInMonth = parseInt(daysInCurrentMonth)
        const app = [];

        for (let i = 1; i <= NoOfdaysInMonth; i++) {
            let number = i.toString().padStart(2, '0');
            let newObj = {
                crtDate: `${year}-${month}-${number}`,
                shiftCatagory: '',
                shiftName: '',
            }
            app.push(newObj);
        }


        // console.log(totalData);

        await Promise.all(empSql.map(async (e) => {
            e.subCompanyName = await fn.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branchName = await fn.getBranchNameByBranchId(e.employeeBranchId, db)
            e.departmentName = await fn.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartmentName = await fn.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designationName = await fn.getDesignationNameById(e.employeeDesignationId, db)
            e.locationName = await fn.getLocationNameById(e.locationId, db)


            e.app = JSON.parse(JSON.stringify(app))

            for (const x of e.app) {
                // await Promise.all(e.app.map(async x => {

                const empRoster = await db.query(
                    `
            SELECT a.employeeId,b.name, b.category,a.fromDate,a.toDate,a.shiftId
            FROM eve_hrm_employee_roaster AS a
            LEFT JOIN eve_hrm_employee_shift_master AS b ON (a.shiftId = b.id)
            WHERE a.status = 'A'
            AND a.fromDate <= :dateTo
            AND a.toDate >= :dateFrom
            AND a.employeeId = :id
        `, {
                    replacements: {
                        dateTo: x.crtDate,
                        dateFrom: x.crtDate,
                        id: e.id,
                    },
                    type: QueryTypes.SELECT
                });

                if (empRoster && empRoster.length > 0) {
                    x.shiftCatagory = empRoster[0].name;
                }
            }
        }));
        if (api == 'raw') {
            return res.status(200).send({
                status: true,
                totalData: empSql.length,
                data: empSql
            });
        }
        let excelData = empSql.map((e, i) => {
            let row = {
                'Sl. No.': i + 1,
                'Employee Code': e.employeeCode,
                'Employee Name': e.employeeName,
                'Sub Company': e.subCompanyName,
                'Branch': e.branchName,
                'Location': e.locationName,
                'Department': e.departmentName,
                'Sub Department': e.subDepartmentName,
                'Designation': e.designationName,
            }
            e.app.forEach(x => {
                row[fn.convertDateDDMMYYYY(x.crtDate)] = x.shiftCatagory
            })
            return row
        })
        if (api === 'excel') {

            return res.status(200).json({
                status: true, pageNo: pageNo, recordedPerPage: limit, totalData: totalData,
                employee: fn.replaceEmptyValues(excelData)
            })
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Roaster List');
        let values = []
        let header = Object.keys(excelData[0]);
        let employee = fn.replaceEmptyValues(excelData)

        values.push(header)
        employee.forEach((e, i) => {
            let row = []
            row.push(...(Object.values(e)))
            values.push(row)
        })
        worksheet.addRows(values)
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                row.height = 20
            });
        });
        const headerRow = worksheet.getRow(1);

        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2EFEF' } }
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true };

        });
        worksheet.columns.forEach(column => {
            column.width = 30
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Roaster List.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack });
    }
}
module.exports = { getRoasterListExcel }
