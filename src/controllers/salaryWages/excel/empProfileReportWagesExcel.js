let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const crypto = require('crypto');
const fs = require('fs')
const path = require('path')
const getEmpProfileReportWagesExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenCompanyId = decodedToken.companyId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        let db = sequelize(tokenCompanyId)
        // const tokenUserId = '29'
        // let db = sequelize('59')
      
        let data = req.body

        let { year, month, api } = data

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
             FROM eve_acc_employee AS a LEFT JOIN eve_hrm_employee_details AS b ON a.id=b.employeeId
            WHERE a.status='A'
            AND b.status='A'
            AND a.employeeType='Blue Collar'
            AND (a.employeeCurrentStatus = '' 
                            OR a.employeeCurrentStatus IS NULL 
                            OR a.employeeCurrentStatus = 'Active'
                            OR a.employeeCurrentStatus = 'resignation' 
                            OR a.employeeCurrentStatus = 'joining'
                            OR a.employeeCurrentStatus = 'termination'
                            OR a.employeeCurrentStatus = 'release' 
                            OR a.employeeCurrentStatus = 'offerletter')
                               AND (DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth)
            
            
`, {
            replacements: {
                yearMonth: `${year}-${month}`
            },
            type: QueryTypes.SELECT
        })
        const totalData = countQuery[0].total

        if (totalData === 0) {
            return res.status(200).send({ status: false, totalData: 0, msg: 'no data found', employee: [] })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit
        
        //a=eve_acc_employee
        //b=eve_hrm_employee_details

        let getData = await db.query(`
    SELECT 
    DISTINCT
    a.id AS empId,a.employeeDoj,YEAR(a.employeeDoj) as year,MONTH(a.employeeDoj) as month,a.employeeName,
    a.employeeCode AS 'Employee Code',
    b.biometricAttendanceId AS 'Biometric ID',

    SUBSTRING_INDEX(a.employeeName, ' ', 1) AS 'First Name',
    IF(
        LENGTH(a.employeeName) - LENGTH(REPLACE(a.employeeName, ' ', '')) < 2, 
        '', 
        SUBSTRING_INDEX(SUBSTRING_INDEX(a.employeeName, ' ', 2), ' ', -1)
    ) AS 'Middle Name',
    IF(
        LENGTH(a.employeeName) - LENGTH(REPLACE(a.employeeName, ' ', '')) < 2, 
        SUBSTRING_INDEX(a.employeeName, ' ', -1), 
        SUBSTRING_INDEX(a.employeeName, ' ', -1)
    ) AS 'Last Name',

    a.employeeSubCompanyId,
    a.employeeBranchId,
    a.employeeDepartmentId,
    a.employeeSubDepartmentId,
    a.employeeDesignationId,
    a.employeeType AS 'Category',
    a.locationID,
    a.empTypeId,
    a.workerType,
    a.workSkill AS 'Work Skill',

    DATE_FORMAT(a.employeeDoj,'%d-%m-%Y') AS 'Date Of Joining',
    DATE_FORMAT(a.employeeDesignationSince,'%d-%m-%Y') AS 'Designation Since',

    a.employeeCostCenterDivision AS 'Cost Center Division',
    a.employeeGender AS 'Gender',
    a.employeeUsername AS 'Login Through:',
    a.bankName,
    a.IFSCnum,
    a.accNumber,
    a.accountType,
    a.accountName,
    a.upiId,

    b.referenceMangerSource,
    b.vendorName AS 'Vendor Name',
    DATE_FORMAT(b.contractDtaeFrom,'%d-%m-%Y') AS 'Contract From Date',
    b.contractPeriodOfMonth AS 'Contract Periods in Months',
    DATE_FORMAT(b.contractDateTo,'%d-%m-%Y') AS 'Contract To Date',
    a.employeeUAN AS 'UAN',
    a.employeeESIC AS 'ESI Number',
    b.superVisorReportingManger1,
    b.superVisorReportingManger2,
    b.superVisorReportingManger3,
    
    c.qualification,
    c.boardUnivercity,
    c.yearOfPassing,
    c.percentage,
    c.specialSkill,

    DATE_FORMAT(a.employeeDob,'%d-%m-%Y') AS employeeDob,

    a.nationality,
    b.maritalStatus,
    a.bloodGroup,
    b.contactNumber,
    b.personalEmail,
    a.employeeAddress,
    a.parmanentAddress,
    b.alternateContactNo,
    b.fatherName,
    b.motherName,
    b.spouseName,
    b.guardiansName,
    b.guardianRelationship,
    b.guardiansAddress,
    b.gurdianPincode AS Pincode,
    b.guardiansContactNo,
    b.emergencyContactName,
    b.emergencyContactRelationship,
    b.emergencyContactAddress,
    b.emgContactNo
    
FROM 
    eve_acc_employee AS a
LEFT JOIN 
    eve_hrm_employee_details AS b ON a.id = b.employeeId

LEFT JOIN eve_acc_emp_educational_qualification AS c ON a.id=c.empId    

WHERE 
    a.status = 'A'
   AND c.status='A'
    AND a.employeeType = 'Blue Collar'
    AND (
        a.employeeCurrentStatus = '' 
        OR a.employeeCurrentStatus IS NULL 
        OR a.employeeCurrentStatus IN ('Active', 'resignation', 'joining', 'termination', 'release', 'offerletter')
    )

  

          AND (DATE_FORMAT(a.employeeDoj, "%Y-%m") <= :yearMonth) 
               ORDER BY a.employeeName ASC

    LIMIT :limit
    OFFSET :offset  


            `, {
            replacements: {
                limit: limit,
                offset: offset,
                yearMonth: `${year}-${month}`
            },
            type: QueryTypes.SELECT
        })


        let result = [];

        await Promise.all(getData.map(async e => {
            e['Sub Company'] = await myFunc.getSubCompanyNameById(e.employeeSubCompanyId, db)
            e['Branch'] = await myFunc.getBranchNameByBranchId(e.employeeBranchId, db)
            e['Department'] = await myFunc.getDepartmentNameByDepartmentId(e.employeeDepartmentId, db)
            e['Sub Department'] = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)
            e['Designation'] = await myFunc.getDesignationNameById(e.employeeDesignationId, db)
            e['Location'] = await myFunc.getLocationNameById(e.locationID, db)
            e['Employee Type'] = await myFunc.getEmpTypeName(e.empTypeId, db)
            e['Worker Type'] = await myFunc.getWorkTypeName(e.workerType, db)
            e['Reference / Manage Source'] = await myFunc.getReferenceNameById(e.referenceMangerSource, db)
            e['Supervisor / Reporting Manager - 1'] = await myFunc.getEmployeeNameById(e.superVisorReportingManger1, db)
            e['Supervisor / Reporting Manager - 2'] = await myFunc.getEmployeeNameById(e.superVisorReportingManger2, db)
            e['Supervisor / Reporting Manager - 3'] = await myFunc.getEmployeeNameById(e.superVisorReportingManger3, db)
            e.qualification = await myFunc.getEmpEducationDegree(e.qualification, db)
            e.nationalityName = await myFunc.getEmpNationality(e.nationality, db)
            e.adharCard = ''
            e.panCard = ''
            e.voterId = ''
            e.passportNo = ''

            const empUploadModel = await db.query(`
                SELECT a.referanceNumber, b.documentName FROM eve_hrm_employee_document_upload_details AS a
                LEFT JOIN eve_hrm_upload_document_master AS b ON a.documentName=b.id
                WHERE a.status='A'
                AND a.status='A'
                AND employeeId=:empId`, {
                replacements: {
                    empId: e.empId
                },
                type: QueryTypes.SELECT
            })

            function openSSLDecryption(encryptedText, algorithm, key, iv) {

                let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(iv));
                let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
                
            }


            const algorithm = 'AES-256-CBC';
            const key = 'LmLWPyqOa1b3nqvOhUdlXoJoKjgZkIjii2eNya6DMbuXRLE3rgXO28q7GLAGfkRZ'.slice(0, 32); // Ensure the key is 32 bytes
            const iv = 'ABCDEFGH91011121'; // Ensure the IV is 16 bytes
          
            empUploadModel.map(x => {

                if (x.documentName == 'Aadhar Card') {

                    e.adharCard = openSSLDecryption(x.referanceNumber, algorithm, key, iv)
                }
                // else{
                //     e.adharCard=''
                // }
                if (x.documentName == 'Pan Card Number') {
                    e.panCard = openSSLDecryption(x.referanceNumber, algorithm, key, iv)
                }
                // else{
                //     e.panCard=''
                // }
                if (x.documentName == 'Voter Id Card Number') {
                    e.voterId = openSSLDecryption(x.referanceNumber, algorithm, key, iv)
                }
                // else{
                //     e.voterId=''
                // }
                if (x.documentName == 'Passport Number') {
                    e.passportNo = openSSLDecryption(x.referanceNumber, algorithm, key, iv)
                }
                // else{
                //     e.passportNo=''
                // }

            })

            let empDetails = await db.query(`
                SELECT 
                empId,
                companyName,

                DATE_FORMAT(companyFromDate,'%d-%m-%Y') AS companyFromDate ,
                DATE_FORMAT(companyToDate,'%d-%m-%Y') AS companyToDate,
                
                totalWorkExprience,companyDesignationName,companyDepartmentName
                FROM eve_acc_additional_details_employee
                WHERE status='A'
                AND empId=:empId  
                `, {
                replacements: {
                    empId: e.empId
                },
                type: QueryTypes.SELECT
            }
            )


            empDetails.forEach(x => {
                if (e.empId == x.empId) {
                    let newEmp = { ...e, ...x };
                    result.push(newEmp);
                }
            })
        }))

        if (api === 'raw') {

            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: result.length,
                data: result
            })
        }

        // result.sort((a, b) => a['First Name'].localeCompare(b['First Name']));
        let excelData = result.map((e, i) => ({
            'Sl. No.': i + 1,
            'Employee Code': e['Employee Code'],
            'Biometric ID': e['Biometric ID'],
            'First Name': e['First Name'],
            'Middle Name': e['Middle Name'],
            'Last Name': e['Last Name'],
            'Sub Company': e['Sub Company'],
            'Branch': e['Branch'],
            'Location': e['Location'],
            'Category': e['Category'],
            'Employee Type': e['Employee Type'],
            'Worker Type': e['Worker Type'],
            'Work Skill': e['Work Skill'],
            'Department': e['Department'],
            'Sub Department': e['Sub Department'],
            'Designation': e['Designation'],
            'Date Of Joining': e['Date Of Joining'],
            'Designation Since': e['Designation Since'],
            'Cost Center Division': e['Cost Center Division'],
            'Gender': e['Gender'],
            'Login Through:': e['Login Through:'],
            'Reference / Manage Source': e['Reference / Manage Source'],
            'Vendor Name': e['Vendor Name'],
            'Contract From Date': e['Contract From Date'],
            'Contract Periods in Months': e['Contract Periods in Months'],
            'Contract To Date': e['Contract To Date'],
            'UAN': e['UAN'],
            'ESI Number': e['ESI Number'],

            'Supervisor / Reporting Manager - 1': e['Supervisor / Reporting Manager - 1'],
            'Supervisor / Reporting Manager - 2': e['Supervisor / Reporting Manager - 2'],
            'Supervisor / Reporting Manager - 3': e['Supervisor / Reporting Manager - 3'],
            'Company Name': e.companyName,
            'From (Date)': e.companyFromDate,
            'To (Date)': e.companyToDate,
            'Total Work Experience': e.totalWorkExprience,
            'Designation Name': e.companyDesignationName,
            'Department Name': e.companyDepartmentName,
            'Highest Educational Qualifications': e.qualification,
            'Board / University': e.boardUnivercity,
            'Year Of Passing': e.yearOfPassing,
            'Percentage Acquired': e.percentage,
            'Specialised Software Skillset': e.specialSkill,

            'Bank Name': e.bankName,
            'IFSC Code': e.IFSCnum,
            'A/c No.': e.accNumber,
            'A/c Type': e.accountType,
            'A/c Holder': e.accountName,
            'UPI ID': e.upiId,
            'Date Of Birth': e.employeeDob,
            'Nationality': e.nationalityName,
            'Marital Status': e.maritalStatus,
            'Blood Group': e.bloodGroup,
            'Contact Number': e.contactNumber,
            'Personal Email ID': e.personalEmail,
            'Current Address': e.employeeAddress,
            'Permanent Address': e.parmanentAddress,
            'Alternate Contact Number': e.alternateContactNo,
            "Father's Name": e.fatherName,
            "Mother's Name": e.motherName,
            "Spouse's Name": e.spouseName,
            "Guardian's Name": e.guardiansName,
            "Guardian's Relationship": e.guardianRelationship,
            "Guardian's Address": e.guardiansAddress,
            "Pincode": e.Pincode,
            "Guardian's No.": e.guardiansContactNo,
            "Emergency Contact Name": e.emergencyContactName,
            "Emergency Contact Relationship": e.emergencyContactRelationship,
            "Emergency Contact Address": e.emergencyContactAddress,
            "Emergency Contact No.": e.emgContactNo,

            'Aadhar No.': e.adharCard,
            'Voter ID No.': e.voterId,
            'PAN': e.panCard,
            'Passport No.': e.passportNo,

        }))

        if (api === 'excel') {

            return res.status(200).json({
                status: true,
                pageNo: pageNo,
                recordedPerPage: limit,
                totalData: excelData.length,
                employee: myFunc.replaceEmptyValues(excelData)
            });
        }
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employee Profile Report');
        let values = []

        let headers = Object.keys(excelData[0]);
        // worksheet.addRow(headers);
        excelData = myFunc.replaceEmptyValues(excelData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });
        
  
        // Add a row at the top for the header "EMPLOYMENT DETAILS" and "PREVIOUS EMPLOYMENT DETAILS"
        worksheet.insertRow(1, ['EMPLOYMENT DETAILS']);
        worksheet.mergeCells('A1:AE1');
        worksheet.getCell('AF1').value = 'PREVIOUS EMPLOYMENT DETAILS';
        worksheet.mergeCells('AF1:AK1');
        worksheet.getCell('AL1').value = 'EDUCATIONAL QUALIFICATION'
        worksheet.mergeCells('AL1:AP1')
        worksheet.getCell('AQ1').value = 'SALARY ACCOUNT DETAILS'
        worksheet.mergeCells('AQ1:AV1')
        worksheet.getCell('AW1').value = 'PERSONAL DETAILS'
        worksheet.mergeCells('AW1:BQ1')
        worksheet.getCell('BR1').value = 'KYC DETAILS'
        worksheet.mergeCells('BR1:BU1')

        // Add the subheader (column names) in the second row
        worksheet.insertRow(2, headers);

        worksheet.addRows(values);

       const titleRow = worksheet.getRow(1);
    const headerRow = worksheet.getRow(2);

     // Center align the title row
    titleRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, fgColor: { argb: 'FFFFFF' } };
    });

    // Style the header row
    headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } };
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Style the entire worksheet
    worksheet.eachRow((row, rowNumber) => {
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

    // Set column width
    worksheet.columns.forEach(column => {
        column.width = 20;
    });

     // Set worksheet view
    worksheet.views = [
        { state: 'normal', zoomScale: 80 }
    ];

        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const fileName = `EmployeeProfileReport_${year}_${month}_${Date.now()}.xlsx`;
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

                    session: `${moment(month, 'MM').format('MMMM')} ${year}`,
                    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                    file: customPathToDisplay, // or use filePath if you want to store full path
                    status: 'A',
                    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days                                                   
                    // expiryDate: new Date(Date.now() + 1000 * 60), // 1 min                                                    
                    excelName: fileName,
                    type: 'Employee Profile Report'
                },
                type: QueryTypes.INSERT
            }
        );
        return res.status(200).json({
            status: true,
            result: "success",
            alert: 'Excel file generated successfully',
            filePath: `${customPathToDisplay}`, // Return path if needed on front-end
        });
    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message, err: error.stack })
    }

}
module.exports = { getEmpProfileReportWagesExcel }