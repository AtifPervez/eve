let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const serialize = require('php-serialize')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const getBonusReportExcel = async (req, res) => {
    try {

        let tokenUserId, tokenCompanyId, tokenBranchId, db, db1, tokenMainUserId

        let data = { ...req.body, ...req.query }

        const { yearFrom, yearTo, empId, local, api } = data


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
           
            FROM eve_acc_employee AS a
            LEFT JOIN eve_blue_employee_bonus_payble_details AS b

            ON (a.id=b.employeeId AND b.status='A')

              
       
            WHERE a.status='A'

            AND a.employeeType='Blue Collar'

            AND (YEAR(b.createdDate) = :yearFrom OR YEAR(b.createdDate) = :yearTo)

          
             

          
                                                                      
            `, {
            replacements: {

                // empId: empId || null,
                yearFrom: yearFrom,
                yearTo: yearTo,

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

               

            a.id ,
            a.employeeName ,
            a.employeeBranchId ,
            a.employeeDesignationId ,
            a.employeeDepartmentId,
            a.employeeCode,
            a.employeeSubcompanyId,
            a.employeeSubDepartmentId,
            b.id AS bonusId,
            b.bonusLabel,
           LPAD(b.appliedMonths, 2, '0') AS appliedMonths,
            b.addToPayslip,
            b.addToPayslip AS payrollGenerated,
          
            CAST(YEAR(b.createdDate) AS CHAR) AS year
            
          
            

            FROM eve_acc_employee AS a
            LEFT JOIN eve_blue_employee_bonus_payble_details AS b ON 
            (a.id=b.employeeId AND b.status='A')
         
         
          
                
             

            WHERE a.status='A'
         
          
          
          

                          AND a.employeeType='Blue Collar'

            

             


            AND (YEAR(b.createdDate) = :yearFrom OR YEAR(b.createdDate) = :yearTo)

       
            ORDER BY a.employeeName
              LIMIT :limit
             OFFSET :offset  
            `
            , {
                replacements: {

                    offset: offset,
                    limit: limit,
                    // empId: empId || null,
                    yearFrom: yearFrom,
                    yearTo: yearTo,


                }, type: QueryTypes.SELECT
            }
        )

        // let totalEsicEmployeesContribution = 0

        // let totalEsicEmployerContribution = 0

        // let totalPaidWages = 0
        let jan = 0, feb = 0, march = 0, apr = 0, may = 0, june = 0, july = 0, aug = 0, sep = 0, oct = 0, nov = 0, dec = 0
        let totalAmountForBottom = 0

        const months = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];

        await Promise.all(sqlData.map(async (e, i) => {

            e.subCompany = await myFunc.getSubCompanyNameById(e.employeeSubcompanyId, db)
            e.branch = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e.department = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e.subDepartment = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e.designation = await myFunc.getDesignationNameById(e.employeeDesignationId, db)

            e.bonusLabel = e.bonusLabel === null ? '' : e.bonusLabel
            e.appliedMonths = e.appliedMonths === null ? '' : e.appliedMonths
            e.addToPayslip = e.addToPayslip === null ? '' : e.addToPayslip
            e.employeeCode = e.employeeCode === null ? '' : e.employeeCode
            if (e.appliedMonths != '') {

                e.appliedMonthsName = myFunc.convertMonthName(e.appliedMonths)
            }
            else {
                e.appliedMonthsName = ''
            }

            const bonusMasterModel = await db.query(`
                            SELECT bonusDetails FROM eve_blue_employee_bonus_master
                            WHERE status='A'
                            AND subCompanyId=:subCompanyId
                            AND branchId=:branchId
                            `, {
                replacements: {
                    subCompanyId: e.employeeSubcompanyId,
                    branchId: e.employeeBranchId,

                },
                type: QueryTypes.SELECT
            })




            if (bonusMasterModel.length > 0 && bonusMasterModel[0].bonusDetails) {

                let bonusMaster = serialize.unserialize(bonusMasterModel[0].bonusDetails)



                bonusMaster.map((x) => {
                
                    
                    if (x.appliedOn) {
                        e.appliedOn = x.appliedOn[0]
                    }
                    if (e.bonusLabel == x.bonusLabel && x.calculatedOn === 'percentage') {
                        e.componentToConsider = `${x.bonusPercent}% of(${e.appliedOn})`
                    }
                    else if (e.bonusLabel == x.bonusLabel && x.calculatedOn === 'amount') {

                        e.bonusAmount = x.bonusAmount
                    }

                })
            }




            const paySlipModel = await db.query(`
                        SELECT salary_types,isGenerated
                        FROM eve_acc_blue_coller_employee_payslip_preview
                        WHERE status='A'
                        AND employeeId=:employeeId
                        AND salaryOfMonth=:salaryOfMonth
                        AND salaryOfYear=:salaryOfYear
                        `, {
                replacements: {
                    employeeId: e.id,
                    salaryOfMonth: e.appliedMonths,
                    salaryOfYear: e.year
                },
                type: QueryTypes.SELECT
            })

            if (paySlipModel.length > 0 && paySlipModel[0].salary_types) {
                // e.payRollGenerated = paySlipModel[0]['isGenerated']
                let paySlip = serialize.unserialize(paySlipModel[0].salary_types)

                let salaryData = paySlip.additionDetails


                for (const key in salaryData) {
                    if (salaryData.hasOwnProperty(key)) {
                        const item = salaryData[key];
                        if (item.salaryLabel === 'Bonus') {
                            e.bonusAmount = item.salaryAmount;
                        }
                        if (item.salaryLabel === e.appliedOn) {
                            e.totalamountComponentsSelected12months = item.salaryAmount;
                        }

                    }
                }
            }


            if (!e.totalamountComponentsSelected12months) {
                e.totalamountComponentsSelected12months = ''
            }

            months.forEach((month, index) => {
                e[month] = 0;
            });

            if (e.hasOwnProperty("appliedMonths") && e.appliedMonths != '' && e.bonusAmount) {
                let appliedMonthIndex = parseFloat(e["appliedMonths"]) - 1;
                let appliedMonth = months[appliedMonthIndex];
                e[appliedMonth] = parseFloat(e["bonusAmount"]);
            }

            let totalAmount = 0

            jan += e.January
            totalAmount += e.January
            totalAmountForBottom += e.January
            e.January = myFunc.formatAmount(e.January)

            feb += e.February
            totalAmount += e.February
            totalAmountForBottom += e.February
            e.February = myFunc.formatAmount(e.February)

            march += e.March
            totalAmount += e.March
            totalAmountForBottom += e.March
            e.March = myFunc.formatAmount(e.March)

            apr += e.April
            totalAmount += e.April
            totalAmountForBottom += e.April
            e.April = myFunc.formatAmount(e.April)

            may += e.May
            totalAmount += e.May
            totalAmountForBottom += e.May
            e.May = myFunc.formatAmount(e.May)

            june += e.June
            totalAmount += e.June
            totalAmountForBottom += e.June
            e.June = myFunc.formatAmount(e.June)

            july += e.July
            totalAmount += e.July
            totalAmountForBottom += e.July
            e.July = myFunc.formatAmount(e.July)

            aug += e.August
            totalAmount += e.August
            totalAmountForBottom += e.August
            e.August = myFunc.formatAmount(e.August)

            sep += e.September
            totalAmount += e.September
            totalAmountForBottom += e.September
            e.September = myFunc.formatAmount(e.September)

            oct += e.October
            totalAmount += e.October
            totalAmountForBottom += e.October
            e.October = myFunc.formatAmount(e.October)

            nov += e.November
            totalAmount += e.November
            totalAmountForBottom += e.November
            e.November = myFunc.formatAmount(e.November)

            dec += e.December
            totalAmount += e.December
            totalAmountForBottom += e.December
            e.December = myFunc.formatAmount(e.December)

            e.totalBonusAmount = myFunc.formatAmount((totalAmount))
            e.bonusAmount = myFunc.formatAmount(e.bonusAmount)



        }))


        let excelData = sqlData.map((e, i) => ({
            'Sl. No.': i + 1,
            'Worker Code': e.employeeCode,
            'Worker Name': e.employeeName,
            'Sub Company': e.subCompany,
            'Branch': e.branch,
            'Department': e.department,
            'Designation': e.designation,
            'Bonus Label': e.bonusLabel,
            'Components To Consider': e.componentToConsider || '--',
            'Total Amount Of Components Selected (12 Months)': e.totalamountComponentsSelected12months,
            'Applied Month (s)': e.appliedMonthsName,
            'Added To Payslip': e.addToPayslip,
            'April': e.April,
            'May': e.May,
            'June': e.June,
            'July': e.July,
            'August': e.August,
            'September': e.September,
            'October': e.October,
            'November': e.November,
            'December': e.December,
            'January': e.January,
            'Febuary': e.February,
            'March': e.March,
            'Total Bonus Amount (₹)': e.totalBonusAmount,
            'Payroll Generated': e.payrollGenerated


        }))

        if (api === 'raw') {

            return res.status(200).json({
                status: true,
                message: 'success',
                // totalEsicEmployeesContribution: totalEsicEmployeesContribution,

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


                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                data: excelData
            })
        }


        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bonus Report');
        let values = []

        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);

        excelData = myFunc.replaceEmptyValues(excelData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });

        let len = headers.length;
        let row = new Array(len).fill('');
        row[headers.indexOf('January')] = myFunc.formatAmount(jan)
        row[headers.indexOf('Febuary')] = myFunc.formatAmount(feb)
        row[headers.indexOf('March')] = myFunc.formatAmount(march)
        row[headers.indexOf('April')] = myFunc.formatAmount(apr)
        row[headers.indexOf('May')] = myFunc.formatAmount(may)
        row[headers.indexOf('June')] = myFunc.formatAmount(june)
        row[headers.indexOf('July')] = myFunc.formatAmount(july)
        row[headers.indexOf('August')] = myFunc.formatAmount(aug)
        row[headers.indexOf('September')] = myFunc.formatAmount(sep)
        row[headers.indexOf('October')] = myFunc.formatAmount(oct)
        row[headers.indexOf('November')] = myFunc.formatAmount(nov)
        row[headers.indexOf('December')] = myFunc.formatAmount(dec)
        row[headers.indexOf('Total Bonus Amount (₹)')] = myFunc.formatAmount(totalAmountForBottom)
        row[headers.indexOf('Added To Payslip')] = 'Total :'
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
        const fileName = `BonusReport_${yearFrom}_${yearTo}_${Date.now()}.xlsx`;
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

                    session: `${yearFrom} ${yearTo}`,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    file: customPathToDisplay, // or use filePath if you want to store full path
                    status: 'A',
                    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days                                                   
                    // expiryDate: new Date(Date.now() + 1000 * 60), // 1 min                                                    
                    excelName: fileName,
                    type: 'Bonus Report'
                },
                type: QueryTypes.INSERT
            }
        );
        res.status(200).json({
            status: true,
            result: "success",
            alert: 'Excel file generated successfully',
            filePath: `${customPathToDisplay}`, // Return path if needed on front-end
        });


    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })

    }
}

// const directoryPath = 'C:/work/@EncodersOffice/encoders/evenodejs/src/wagesExcelDownload';

// async function deleteFilesByExpiry() {
//     const db = sequelize('59');

//     try {
//         // 1. Get files with expired expiryDate
//         const expiredFiles = await db.query(
//             `
//             SELECT excelName ,
//             date_format(expiryDate,'%d-%m-%Y') as expiryDate,
//             date_format(NOW(),'%d-%m-%Y') as currentDate,
//             date_format(expiryDate,'%H:%i:%s') as expiryTime,
//             date_format(NOW(),'%H:%i:%s') as currentTime

//             FROM eve_blue_all_report_download_log 
//             WHERE status = 'A'
//             AND date_format(expiryDate,'%d-%m-%Y') = date_format(NOW(),'%d-%m-%Y')
//             -- AND date_format(expiryDate,'%H:%i:%s') = date_format(NOW(),'%H:%i:%s')





//             `,
//             {
//                 type: QueryTypes.SELECT
//             }
//         );

//         console.log(expiredFiles);

//         for (const { excelName } of expiredFiles) {
//             const filePath = path.join(directoryPath, excelName);


//             try {

//                 if (fs.existsSync(filePath)) {
//                     fs.unlinkSync(filePath);
//                     console.log(`🧹 Deleted expired file: ${excelName}`);
//                 } else {
//                     console.warn(`⚠️ File not found: ${excelName}`);
//                 }

//                 // 2. Update status in DB
//                 await db.query(
//                     `
//                     UPDATE eve_blue_all_report_download_log 
//                     SET status = 'D' 
//                     WHERE excelName = :filename
//                     `,
//                     {
//                         replacements: { filename: excelName },
//                         type: QueryTypes.UPDATE
//                     }
//                 );
//             } catch (err) {
//                 console.error(`Error deleting or updating file: ${excelName}`, err);
//             }
//         }

//     } catch (err) {
//         console.error('Error querying expired files:', err);
//     }
// }

// // Call this inside a cron job or manually
// // cron.schedule('*/15 * * * * *', deleteFilesByExpiry); // every 15s for testing

// cron.schedule('*/15 * * * * *', () => {
//     console.log('🕒 [CRON] Running scheduled file cleanup based on expiryDate...');
//     deleteFilesByExpiry()
//         .then(() => {


//             console.log('✅ [CRON] File cleanup completed.\n');
//         })
//         .catch(err => {
//             console.error('❌ [CRON] Error during file cleanup:', err);
//         });
//     });





module.exports = { getBonusReportExcel }