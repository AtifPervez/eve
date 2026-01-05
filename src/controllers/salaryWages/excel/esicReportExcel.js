let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const serialize = require('php-serialize')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const getEsicReportExcel = async (req, res) => {
    try {

        let tokenUserId, tokenCompanyId, tokenBranchId, db, db1, tokenMainUserId

        let data = { ...req.body, ...req.query }
        const { year, month, empId, reportCreateType, local, api } = data


        if (local === 'yes') {

            tokenUserId = '29'
            tokenCompanyId = '59'
            tokenBranchId = '75'
            db = sequelize('59')
            db1 = sequelize()
        }
        else {

            const decodedToken = req.headerSession
            tokenUserId = decodedToken.userId
            tokenBranchId = decodedToken.branchId
            tokenMainUserId = decodedToken.mainUserId
            tokenCompanyId = decodedToken.companyId
            db = sequelize(tokenCompanyId)
            db1 = sequelize()
        }

        //reportCreateType value=ownPage,allReportListPage
        const countQuery = await db.query(
            `
                             SELECT COUNT(*) AS total

                             FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id

                             WHERE a.status ='A'

                             AND b.employeeType = 'Blue Collar'
                               AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND a.isGenerated = 'yes'
                             -- AND (a.wagesType='monthly')
                                                                      
            `, {
            replacements: {

                empId: empId || null,
                month: parseInt(month), // make sure it's a number
                year: parseInt(year)

            }, type: QueryTypes.SELECT
        }
        )
        const totalData = countQuery[0]['total']
       if (totalData === 0) {
           return res.status(200).json({ status: true, result:'error', alert: 'Payroll not generated'})
        }
        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        const sqlData = await db.query(
            `
                       SELECT 
                         b.id,
                         b.employeeName,
                         b.employeeSubCompanyId,
                         b.employeeCode,
                         DATE_FORMAT(b.employeeDoj, '%d-%m-%Y') AS employeeDoj,
                         a.salaryOfMonth,
                         a.salaryOfYear,
                         a.salaryTemplateId,
                         a.fromDate,
                         a.toDate,
                         a.remarks,
                         a.salary_summary,
                         a.salary_types,
                         a.netPay,
                         a.dateOfPayment,
                         a.remarksDate,
                         a.description,
                         a.createdDateTime,
                         a.paymentStatus,
                         a.id AS 'payId',

                         b.employeeBranchId,

                         b.employeeDepartmentId,

                         b.employeeSubDepartmentId,

                         b.employeeDesignationId,

                         b.salaryTemplateId,

                         b.employeeType,

                         b.locationID,
                         b.empTypeId,
                         b.employeeESIC,
                      

                          DATE_FORMAT(STR_TO_DATE(CONCAT(c.year, '-', c.months, '-01'), '%Y-%m-%d'), '%M, %Y') AS formattedMonthYear

                      
                         
                         FROM eve_acc_blue_coller_employee_payslip_preview AS a
                             LEFT JOIN eve_acc_employee AS b ON a.employeeId = b.id
                             left join eve_blue_esic_stoper as c on a.employeeId=c.employeeId

                             WHERE a.status ='A'

                             AND b.employeeType = 'Blue Collar'
                             AND a.salaryOfMonth = :month
                             AND a.salaryOfYear = :year
                             AND a.isGenerated = 'yes'
                            -- AND (a.wagesType='monthly')

                            ORDER BY b.employeeName asc

                            limit :limit

                            offset :offset                 
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    empId: empId || null,
                    month: parseInt(month),
                    year: parseInt(year),


                }, type: QueryTypes.SELECT
            }
        )

        let totalEsicEmployeesContribution = 0

        let totalEsicEmployerContribution = 0

        let totalPaidWages = 0

        let totalContributionSum=0

       

        await Promise.all(sqlData.map(async (e, i) => {

            e.subCompany = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e.branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartment = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            let esicEmployerContribution = 0
            let esicEmployeesContribution = 0
            let totalAdditionalAmount = 0
            let totalDeductionAmount = 0

                    let salaryTypes = serialize.unserialize(e.salary_types)

                    let deductionDetails = (salaryTypes.deductionDetails)

                    let additionDetails = (salaryTypes.additionDetails)

                    Object.values(deductionDetails).forEach(item => {
                        if (item?.salaryLabel === 'ESIC(Employees Contribution)') {
                            esicEmployeesContribution += parseFloat(item.salaryAmount||0);
                        }
                        // if (item?.salaryAmount != undefined && item.salaryAmount != '') {
                        //     totalDeductionAmount += parseFloat(item.salaryAmount||0);

                        // }
                        
                        
                    });
                    Object.values(additionDetails).forEach(item => {
                        
                        if (item?.salaryLabel === 'ESIC(Employer Contribution)') {
                            esicEmployerContribution += parseFloat(item.salaryAmount||0);
                        }
                        // if (item?.salaryAmount != undefined && item?.salaryAmount != '') {
                        //     totalAdditionalAmount += parseFloat(item.salaryAmount||0);
                            

                        // }
                    })

            e['esicEmployeesContribution'] = esicEmployeesContribution

            totalEsicEmployeesContribution += esicEmployeesContribution

            totalEsicEmployerContribution += esicEmployerContribution

            e['esicEmployerContribution'] = esicEmployerContribution

            // e['totalPaidWages'] = totalAdditionalAmount - totalDeductionAmount
            e['totalPaidWages'] = e.netPay || 0
            totalPaidWages += parseFloat(e['totalPaidWages'])

            e['totalContribution'] = esicEmployeesContribution + esicEmployerContribution
            totalContributionSum += e['totalContribution'] || 0

        }))


        let excelData = (sqlData).map((e, i) =>
        ({
            'Sl. No.': i + 1,
            'Worker Code': e.employeeCode,
            'ESIC Number': e.employeeESIC,
            'Worker Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Department': e.department,
            'Sub Department': e.subDepartment,
            'Designation': e.designation,
            'Category': e.employeeType,
            'Worker ESIC Contribution': myFunc.formatAmount(e.esicEmployeesContribution),
            'Employer ESIC Contribution': myFunc.formatAmount(e.esicEmployerContribution),
            'Total Contribution': myFunc.formatAmount(e.totalContribution),
            'ESIC Stopped on': e.formattedMonthYear,
            'Monthly Wages': myFunc.formatAmount(e.totalPaidWages),
        }))

        if (api === 'raw') {

            return res.status(200).json({
                status: true,
                message: 'success',
                totalEsicEmployeesContribution: totalEsicEmployeesContribution,
                totalEsicEmployerContribution: totalEsicEmployerContribution,
                totalPaidWages: totalPaidWages,
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                data: sqlData
                // data: excelData
            })
        }

        else if (api === 'excel') {
            return res.status(200).json({
                status: true,
                message: 'success',
                totalEsicEmployeesContribution: totalEsicEmployeesContribution,
                totalEsicEmployerContribution: totalEsicEmployerContribution,
                totalPaidWages: totalPaidWages,

                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                data: excelData
            })
        }


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ESIC Report');
        let values = []

        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);

        excelData = myFunc.replaceEmptyValues(excelData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });

        let workerIndex = headers.indexOf('Worker ESIC Contribution')
        let totalIndex = headers.indexOf('Category')
        let employerIndex = headers.indexOf('Employer ESIC Contribution')
        let monthlyPaidWagesIndex = headers.indexOf('Monthly Wages')
        let totalContributionIndex = headers.indexOf('Total Contribution')
        let len = headers.length;
        let row = new Array(len).fill('');
        row[workerIndex] = `${myFunc.formatAmount(totalEsicEmployeesContribution)}`
        row[employerIndex] = `${myFunc.formatAmount(totalEsicEmployerContribution)}`
        row[monthlyPaidWagesIndex] = `${myFunc.formatAmount(totalPaidWages)}`
        row[totalIndex] = `Total`
        row[totalContributionIndex] = `${myFunc.formatAmount(totalContributionSum)}`
        values.push(row);
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
            column.width = 30;
        });

        const lastRow = worksheet.lastRow;
        lastRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true };
        });



        //     //../../../ is equivalent to level of src


        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `EsicReport_${month}_${year}_${Date.now()}.xlsx`;
       
        const customPathToDisplay = `${process.env.CUSTUM_PATH_DISPLAY}\\${fileName}`




        if (!fs.existsSync(customPath)) {
            fs.mkdirSync(customPath, { recursive: true });
        }

        const filePath = path.join(customPath, fileName);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
       

        // Save the file
        await workbook.xlsx.writeFile(filePath);

        // Insert file info into DB
        await db.query(
            `
              INSERT INTO eve_blue_all_report_download_log (createdDate, createdSession, createdIp, excelFileUrl, status,expiryDate,excelName,type)
              VALUES (NOW(), :session, :ip, :file,:status,:expiryDate, :excelName,:type)
              `,
            {
                replacements: {

                    session: `${moment(month,'MM').format('MMMM')} ${year}`,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    file: customPathToDisplay, // or use filePath if you want to store full path
                    status: 'A',
                    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days                                                   
                    // expiryDate: new Date(Date.now() + 1000 * 60), // 1 min                                                    
                    excelName: fileName,
                    type: 'ESIC Report'
                },
                type: QueryTypes.INSERT
            }
        );
        res.status(200).json({
            status: true,
               result: "success",
            alert : 'Excel file generated successfully',
            filePath: `${customPathToDisplay}`, // Return path if needed on front-end
        });


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })

    }
}

module.exports = { getEsicReportExcel }