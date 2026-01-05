let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const myFunc = require('../../../functions/functions')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')
const os = require('os');
const moment = require('moment')
const getIncidentReportWagesExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const tokenUserId = decodedToken.userId
        const tokenBranchId = decodedToken.branchId
        const tokenMainUserId = decodedToken.mainUserId
        const tokenCompanyId = decodedToken.companyId
        let db = sequelize(tokenCompanyId)
        let db1 = sequelize()

        let data = { ...req.body, ...req.query }

        const { year, month, api, id } = data

        if (!year) {
            return res.status(400).send({ status: false, msg: 'Year is required' })
        }

        if (!month) {
            return res.status(400).send({ status: false, msg: 'Month is required' })
        }

        let countQuery = await db.query(`
            SELECT COUNT(*) AS total
                            FROM eve_incident_report AS a
               LEFT JOIN eve_acc_employee AS b ON a.EmployeeName=b.id
                            
                             WHERE a.status ='A'
                            
                             AND b.employeeType = 'Blue Collar'
                             AND a.IncidentCategoryId IS NOT NULL
                             AND (:id IS NULL OR a.EmployeeName=:id)
                             AND YEAR(a.incidentDateTime)=:year
                             AND MONTH(a.incidentDateTime)=:month
           
            `, {
            replacements: {
                id: id || null,
                year: year,
                month: month,
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

        const getData = await db.query(`
            SELECT 
            year(a.incidentDateTime) as year,
            month(a.incidentDateTime) as month,
            a.EmployeeName AS id,
            b.employeeName,
            b.employeeCode,
            a.subcompany,
            a.Branch,a.Designation,a.Department,b.employeeSubDepartmentId,
            a.CreatedDatetime,
            a.incidentDateTime,
            a.Description AS incidentDescription,
            a.IncidentCategoryId,
            a.createdBy,
            a.modifiedBy
            FROM eve_incident_report AS a
            LEFT JOIN eve_acc_employee AS b ON a.EmployeeName=b.id
                            
                             WHERE a.status ='A'
                              AND a.IncidentCategoryId IS NOT NULL
                           
                             AND b.employeeType = 'Blue Collar'
                             AND (:id IS NULL OR a.EmployeeName=:id)
                             AND YEAR(a.incidentDateTime)=:year
                             AND MONTH(a.incidentDateTime)=:month

                     ORDER BY b.employeeName       
            LIMIT :limit
            OFFSET :offset        
  
         
            `, {
            replacements: {
                limit: limit,
                offset: offset,
                id: id || null,
                year: year,
                month: month,
            },
            type: QueryTypes.SELECT
        })


        await Promise.all(getData.map(async e => {

            const [createdDate, createdtime] = e.CreatedDatetime.split(' ')
            e.createdDate = moment(createdDate).format('DD-MM-YYYY')
            e.createdtime = moment(createdtime, 'HH:mm:ss').format('hh:mm A')

            let rawDateTime = e.incidentDateTime.replace(',', ' '); // Normalize comma to space
            const [incidentDate, incidentTime] = rawDateTime.split(' ');
            e.incidentDate = moment(incidentDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
            e.incidentTime = moment(incidentTime, ['HH:mm:ss', 'HH:mm']).format('hh:mm A');


            e.incidentCategory = await getIncidentCategoryName(e.IncidentCategoryId, db)
            e.pirorityLevel = await getIncidentPriority(e.IncidentCategoryId, db)
            e.createdByName = await myFunc.getEmployeeNameById(e.createdBy, db)

            e.subCompanyName = await myFunc.getSubCompanyNameById(e.subcompany, db)
            e.branchName = await myFunc.getBranchNameByBranchId(e.Branch, db)
            e.designationName = await myFunc.getDesignationNameById(e.Designation, db)
            e.documentAddedBy = await myFunc.getEmployeeNameById(e.modifiedBy, db)
            e.departmentName = await myFunc.getDepartmentNameByDepartmentId(e.Department, db)
            e.subDepartmentName = await myFunc.getSubDepartmentNameBySubDepartmentId(e.employeeSubDepartmentId, db)

        }))


        if (api === 'raw') {

            return res.status(200).json({
                status: true,
                message: 'success',
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                data: getData
            })
        }
        let excelData = getData.map((e, i) => ({
            'Sl. No.': i + 1,
            'Created Date': e.createdDate,
            'Created Time': e.createdtime,
            'Created By': e.createdByName,
            'Incident Category': e.incidentCategory,
            'Pirority Level': e.pirorityLevel,
            'Incident Date': e.incidentDate,
            'Incident Time': e.incidentTime,
            'Employee Code': e.employeeCode,
            'Employee Name': e.employeeName,
            'Sub Company': e.subCompanyName,
            'Branch': e.branchName,
            'Department': e.departmentName,
            'Sub Department': e.subDepartmentName,
            'Designation': e.designationName,
            'Document Added By': e.documentAddedBy,
            'Incident Description': e.incidentDescription,

        }))

        if (api === 'excel') {
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
        const worksheet = workbook.addWorksheet('Advance Report');
        let values = []

        const headers = Object.keys(excelData[0]);
        worksheet.addRow(headers);
        excelData = myFunc.replaceEmptyValues(excelData)

        excelData.forEach(emp => {
            worksheet.addRow(Object.values(emp));
        });
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


        const fileName = `incidentReport_${year}_${month}_${Date.now()}.xlsx`;
        const customPath = path.join(__dirname, process.env.CUSTUM_PATH_URL);
        const customPathToDisplay = `${process.env.CUSTUM_PATH_DISPLAY}\\${fileName}`

        // const customPath = path.join(os.homedir(), 'Downloads');
        // const customPathToDisplay = `${path.join(os.homedir(), 'Downloads')}\\${fileName}`;


    
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
                    type: 'Incident Report'
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
module.exports = { getIncidentReportWagesExcel }

const getIncidentCategoryName = async (idString, db) => {
    // Validate input
    if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        return '';
    }

    // Convert comma-separated string to array of trimmed IDs
    const ids = idString.split(',').map(x => x.trim()).filter(Boolean);

    if (ids.length === 0) {
        return '';
    }

    // Query category names
    const result = await db.query(
        `SELECT categoryName FROM eve_acc_incident_category_master 
     WHERE id IN (:ids)`,
        {
            replacements: { ids },
            type: QueryTypes.SELECT
        }
    );

    // Extract and join names
    const categoryNames = result.map(row => row.categoryName).join(' , ');
    return categoryNames;
}

const getIncidentPriority = async (idString, db) => {
    // Validate input
    if (!idString || typeof idString !== 'string' || idString.trim() === '') {
        return '';
    }

    // Convert comma-separated string to array of trimmed IDs
    const ids = idString.split(',').map(x => x.trim()).filter(Boolean);


    if (ids.length === 0) {
        return '';
    }

    // Query category names
    const result = await db.query(
        `SELECT priority FROM eve_acc_incident_category_master 
        WHERE id IN (:ids)`,
        {
            replacements: { ids },
            type: QueryTypes.SELECT
        }
    );

    // Extract and join names
    const categoryNames = result.map(row => row.priority).join(' , ');
    return categoryNames;
};
















