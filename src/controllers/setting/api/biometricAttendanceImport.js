let sequelize = require('../../../config/db')
const { QueryTypes } = require('sequelize')
const ExcelJS = require('exceljs')
const moment = require('moment')
const myFunc = require('../../../functions/functions')
const fs = require('fs')
const path = require('path')
const XLSX = require('xlsx');
const getBiometricAttendanceImport = async (req, res) => {
    try {
        const decodedToken = req.headerSession;
        const companyId = decodedToken.companyId;
        let db = sequelize(companyId);

        const data = { ...req.body, ...req.query };
        const { year, month, api } = data;

        // Use uploaded file path
        const uploadedFile = req.file;
        console.log(uploadedFile);
        
        if (!uploadedFile) {
            return res.status(400).json({ status: 'error', msg: 'No file uploaded.' });
        }

        const targetPath = uploadedFile.path;

        const workbook = XLSX.readFile(targetPath);
        const sheetNames = workbook.SheetNames;

        let sheetData;
        sheetNames.forEach((e) => {
            sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[e], { defval: null });
        });

        const attendanceSummary = summarizeAttendance(sheetData);

        return res.status(200).json({
            status: true,
            message: 'success',
            data: attendanceSummary
        });

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message });
    }
};
module.exports = { getBiometricAttendanceImport }

function decimalToTime(decimal) {
    const totalMinutes = Math.round(decimal * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function summarizeAttendance(rows) {
    const grouped = {};

    rows.forEach(row => {
        const biometricId = row['Biometric Id'];
        const date = row['Date (dd-mm-yy)'];
        const time = row['Time '];
        const key = `${biometricId}_${date}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(time);
    });

    const result = []
    Object.entries(grouped).forEach(([key, times]) => {
        const [biometricId, date] = key.split('_');
        const sortedTimes = times.sort((a, b) => a - b);

        result.push({
            'Biometric Id': isNaN(biometricId) ? biometricId : parseInt(biometricId),
            'Date': date,
            'inTime': decimalToTime(sortedTimes[0]),
            'outTime': decimalToTime(sortedTimes[sortedTimes.length - 1]),
            // 'punchCount': sortedTimes.length
        });
    });

    return result;
}







// const fs = require('fs');
// const path = require('path');
// const XLSX = require('xlsx');

// const originalFile = '...'; // base64 string
// const fileType = 'xlsx';
// const targetPath = path.join(__dirname, '../../upload/attendanceXlUpload/', `${Math.floor(Math.random() * 100000)}${Date.now()}.${fileType}`);

// // Save decoded file
// fs.writeFileSync(targetPath, Buffer.from(originalFile, 'base64'));

// const workbook = XLSX.readFile(targetPath);
// const sheetNames = workbook.SheetNames;
// const sheetCount = sheetNames.length;

// console.log(`Total Sheets: ${sheetCount}`);

// sheetNames.forEach((sheetName) => {
//     const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
//     console.log(`Sheet: ${sheetName}`, sheetData);
// });