let sequelize = require("../config/db")
const { QueryTypes, NUMBER } = require('sequelize')
const phpUnserialize = require('php-serialize');
const moment = require('moment')
const axios = require('axios')
const ExcelJS = require('exceljs')
const myFunc=require('../functions/functions')


const departmentNameByDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
}
const getEmployeeNameById = async (id, db) => {
    let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })

    if (employeeName[0]) {

        let res = Object.values(employeeName[0])
        let newRes = (res.toString());
        return newRes
    }
}


const getBranchNameByBranchId = async (id, db) => {
    let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
        replacements: {
            branchId: id,
        },
        type: QueryTypes.SELECT
    })
    if (branchName[0]) {

        let res = Object.values(branchName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getDesignationNameById = async (id, db) => {
    let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    }
    )

    if (designationName[0]) {
        let res = Object.values(designationName[0])
        let newRes = (res.toString())
        return newRes
    }
}

const getSubCompanyNameById = async (id, db) => {
    let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subCompanyName[0]) {
        let res = Object.values(subCompanyName[0])
        let newRes = (res.toString())
        return newRes
    }
}
const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
    let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
        replacements: {
            id: id,
        },
        type: QueryTypes.SELECT
    })
    if (subDepartment[0]) {
        let res = Object.values(subDepartment[0])
        let newRes = res.toString()
        return newRes
    }
}

//api
const getEmpListExcel = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        const companyId = decodedToken.companyId
        const branch_Id = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let db = sequelize(companyId)

        let data = req.body
        let { employeeCode, name, subCompanyId, companyFromDate, companyToDate, location, biometricAttendanceId, branchId, departmentNameId, subDepartmentId, designationNewId, status, doj } = data


        let countQuery = await db.query(
            `SELECT COUNT(*) AS total FROM eve_acc_employee 

            LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id = eve_hrm_employee_details.employeeId 

            WHERE (eve_acc_employee.status = 'A' OR eve_acc_employee.status = 'I')
             AND eve_acc_employee.employeeType='Blue Collar'
            AND (:subCompanyId IS NULL OR eve_acc_employee.employeeSubCompanyId = :subCompanyId) 
             AND (:employeeCode IS NULL OR eve_acc_employee.employeeCode = :employeeCode) 
            AND (:name IS NULL OR eve_acc_employee.employeeName = :name)
            AND (:location IS NULL OR eve_acc_employee.locationID = :location)
            AND (:biometricAttendanceId IS NULL OR eve_hrm_employee_details.biometricAttendanceId = :biometricAttendanceId)
            AND (:branchId IS NULL OR eve_acc_employee.employeeBranchId = :branchId)
            AND (:departmentNameId IS NULL OR eve_acc_employee.employeeDepartmentId = :departmentNameId)
            AND (:subDepartmentId IS NULL OR eve_acc_employee.employeeSubDepartmentId = :subDepartmentId)
            AND (:designationNewId IS NULL OR eve_acc_employee.employeeDesignationId = :designationNewId)
            AND (:status IS NULL OR (:status = 'Active' AND eve_acc_employee.status = 'A') OR (:status = 'Inactive' AND eve_acc_employee.status = 'I'))
            AND (:companyFromDate IS NULL
                OR (eve_acc_employee.employeeDoj >= :companyFromDate AND eve_acc_employee.employeeDoj <= CURDATE())
               )
            AND (:companyToDate IS NULL OR eve_acc_employee.employeeDoj <= :companyToDate)

            `, {
            replacements: {
                subCompanyId: subCompanyId || null,
                employeeCode: employeeCode || null,
                name: name || null,
                companyFromDate: companyFromDate || null,
                companyToDate: companyToDate || null,
                location: location || null,
                biometricAttendanceId: biometricAttendanceId || null,
                branchId: branchId || null,
                departmentNameId: departmentNameId || null,
                subDepartmentId: subDepartmentId || null,
                designationNewId: designationNewId || null,
                status: status || null,
            },
            type: QueryTypes.SELECT
        }
        );


        const totalData = countQuery[0].total;
        if (totalData === 0) {
            return res.status(200).send({ status: false, msg: 'no data found', totalData: 0 })
        }

        let limit = parseInt(req.body.limit) || totalData;
        let maxPage = Math.ceil(totalData / limit)
        let pageNo = parseInt(req.body.pageNo) || 1;
        pageNo = pageNo <= maxPage ? pageNo : maxPage
        let offset = (pageNo - 1) * limit;

        let getData = await db.query(`
            SELECT DISTINCT eve_acc_employee.id, 
            eve_acc_employee.employeeCode, 
            eve_acc_employee.employeeName AS name, 
            eve_acc_employee.employeeAddress AS address, 
            eve_acc_employee.employeePincode AS pincode, 
            eve_acc_employee.employeeEmail AS email, 
            eve_acc_employee.employeeMobile AS mobile, 
            eve_acc_employee.employeeGender AS gender, 
            eve_acc_employee.employeeDob AS dob, 
            eve_acc_employee.employeeDoj AS doj, 
            eve_acc_employee.employeeDesignationId AS designationNew, 
            eve_acc_employee.employeeDesignationId AS designationNewId, 
            eve_acc_employee.employeeDepartmentId AS departmentName, 
            eve_acc_employee.employeeDepartmentId AS departmentNameId, 
            eve_acc_employee.employeeSubDepartmentId AS subDepartment, 
            eve_acc_employee.employeeSubCompanyId AS subCompanyId, 
            eve_acc_employee.employeeSubcompanyId AS subCompanyName, 
            eve_acc_employee.employeeBranchId AS empBranchName, 
            eve_acc_employee.createdDate AS date, 
            eve_acc_employee.id AS employeeId, 
            eve_hrm_employee_details.biometricAttendanceId, 
            eve_hrm_employee_details.isBonusApplicable, 
            eve_hrm_employee_details.isESICApplicable, 
            eve_hrm_employee_details.isLabourLawApplicable, 
            eve_hrm_employee_details.isOvertimeApplicable, 
            eve_hrm_employee_details.attendanceType AS haveAttendanceType, 
            eve_hrm_employee_details.jobLocation AS location, 
            eve_acc_employee.firstPaymentStatus AS madePayment,
            eve_acc_employee.locationId AS location,
            location.location AS locationName, 
            eve_acc_employee.employeeBranchId AS branchId, 
            eve_acc_employee.status, 
            eve_acc_employee.employeeSubDepartmentId AS subDepartmentId, 
            eve_acc_employee.employeeType, 
            eve_acc_employee.workerType, 
            eve_acc_employee.workSkill, 
            eve_acc_employee.employeeDesignationSince, 
            eve_acc_employee.employeeCostCenterDivision, 
            eve_acc_employee.employeeGender, 
            eve_acc_employee.loginThrough, 
            eve_acc_employee.employeeESIC, 
            eve_acc_employee.employeeUAN, 
            eve_acc_employee.bankName, 
            eve_acc_employee.accNumber, 
            eve_acc_employee.accountName, 
            eve_acc_employee.branchName, 
            eve_acc_employee.IFSCnum, 
            eve_acc_employee.upiId, 
            eve_acc_employee.nationality, 
            eve_acc_employee.employeeUsername, 
            eve_acc_employee.parmanentAddress, 
            eve_acc_employee.employeeProfilePic, 
            eve_hrm_employee_details.fatherName, 
            eve_hrm_employee_details.motherName, 
            eve_hrm_employee_details.spouseName, 
            eve_hrm_employee_details.alternateContactNo, 
            eve_hrm_employee_details.emgContactNo, 
            eve_hrm_employee_details.personalEmail, 
            eve_hrm_employee_details.maritalStatus, 
            eve_hrm_employee_details.bloodGroup, 
            eve_hrm_employee_details.contactNumber, 
            eve_hrm_employee_details.referenceMangerSource, 
            eve_hrm_employee_details.contractDtaeFrom, 
            eve_hrm_employee_details.contractPeriodOfMonth, 
            eve_hrm_employee_details.contractDateTo, 
            eve_hrm_employee_details.superVisorReportingManger1, 
            eve_hrm_employee_details.superVisorReportingManger2, 
            eve_hrm_employee_details.superVisorReportingManger3, 
            eve_hrm_employee_details.guardiansName, 
            eve_hrm_employee_details.guardianRelationship, 
            eve_hrm_employee_details.guardiansAddress, 
            eve_hrm_employee_details.guardiansContactNo, 
            eve_hrm_employee_details.gurdianPincode, 
            eve_hrm_employee_details.emergencyContactAddress, 
            eve_hrm_employee_details.emergencyContactRelationship, 
            eve_hrm_employee_details.emergencyContactRelationship, 
            eve_hrm_employee_details.emergencyContactName, 
            eve_hrm_employee_details.emergencyPincode, 
            eve_hrm_employee_details.empDate, eve_acc_employee.formBlue_Status
            FROM eve_acc_employee 
            LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id = eve_hrm_employee_details.employeeId 
            LEFT JOIN eve_acc_locationmaster as location on eve_acc_employee.locationID=location.id
            WHERE (eve_acc_employee.status = 'A' OR eve_acc_employee.status = 'I') 
             AND eve_acc_employee.employeeType='Blue Collar'
            AND (:subCompanyId IS NULL OR eve_acc_employee.employeeSubCompanyId = :subCompanyId) 
            AND (:employeeCode IS NULL OR eve_acc_employee.employeeCode = :employeeCode) 
            AND (:employeeCode IS NULL OR eve_acc_employee.employeeCode = :employeeCode) 
            AND (:name IS NULL OR eve_acc_employee.employeeName = :name)
            AND (:location IS NULL OR eve_acc_employee.locationID = :location)
            AND (:biometricAttendanceId IS NULL OR eve_hrm_employee_details.biometricAttendanceId = :biometricAttendanceId)
            AND (:branchId IS NULL OR eve_acc_employee.employeeBranchId = :branchId)
            AND (:departmentNameId IS NULL OR eve_acc_employee.employeeDepartmentId = :departmentNameId)
            AND (:subDepartmentId IS NULL OR eve_acc_employee.employeeSubDepartmentId = :subDepartmentId)
            AND (:designationNewId IS NULL OR eve_acc_employee.employeeDesignationId = :designationNewId)
            AND (:status IS NULL OR (:status = 'Active' AND eve_acc_employee.status = 'A') OR (:status = 'Inactive' AND eve_acc_employee.status = 'I'))
             AND (:companyFromDate IS NULL
              OR (eve_acc_employee.employeeDoj >= :companyFromDate AND eve_acc_employee.employeeDoj <= CURDATE())
             )
            AND (:companyToDate IS NULL OR eve_acc_employee.employeeDoj <= :companyToDate)
           







          
            ORDER BY eve_acc_employee.employeeName
            LIMIT :limit OFFSET :offset
            `,
            {
                replacements:
                {
                    limit: limit,
                    offset: offset,
                    subCompanyId: subCompanyId || null,
                    employeeCode: employeeCode || null,
                    name: name || null,
                    companyFromDate: companyFromDate || null,
                    companyToDate: companyToDate || null,
                    location: location || null,
                    biometricAttendanceId: biometricAttendanceId || null,
                    branchId: branchId || null,
                    departmentNameId: departmentNameId || null,
                    subDepartmentId: subDepartmentId || null,
                    designationNewId: designationNewId || null,
                    status: status || null,
                },
                type: QueryTypes.SELECT
            }
        );


        let slno = offset + 1
        await Promise.all(getData.map(async (e, index) => {
            e.locationName = e.locationName === null ? '' : e.locationName
            e.slno = slno + index

            if (getData[index].attendanceType != '')
                e.haveAttendanceType = "yes"
            else {
                e.haveAttendanceType = "no"
            }
            e.hasSalary = 'no'
            e.subscription = ''
            if (e.subCompanyId != null) {
                e.subCompanyId = (e.subCompanyId).toString()

            }
            e.employeeId = (e.employeeId).toString()
            if (e.subDepartment != '' && e.subDepartment != null) {
                e.subDepartment = await getSubDepartmentNameBySubDepartmentId(e.subDepartment, db)
            }
            if (e.departmentName != '' && e.departmentName != null) {
                e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
            }
            if (e.empBranchName != '' && e.empBranchName != null) {
                e.empBranchName = await getBranchNameByBranchId(e.empBranchName, db)
            }
            if (!e.empBranchName) {
                e.empBranchName = ''
            }
            if (e.subCompanyName != null) {
                e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
            }
            if (!e.subCompanyName) {
                e.subCompanyName = ''
            }
            if (e.designationNew != '' && e.designationNew != null) {
                e.designationNew = await getDesignationNameById(e.designationNew, db)
            }
            if (!e.designationNew) {
                e.designationNew = ''
            }

            if (e.status == 'A') {
                e.status = 'Active'
            }
            if (e.status == 'I') {
                e.status = "Inactive"
            }

            e.doj = moment(e.doj, 'YYYY-MM-DD').format('DD-MM-YYYY');

            if (e.doj == 'Invalid date') {
                e.doj = ''
            }

            let uploadDoc = await db.query(`
            SELECT * FROM eve_acc_add_employee_upload_document WHERE status="A" AND (:empId IS NULL OR empId=:empId)`, {
                replacements: {
                    empId: e.id || null
                },
                type: QueryTypes.SELECT
            });
            e.uploadDocumentDetails = []

            uploadDoc.forEach(x => {
                e.uploadDocumentDetails.push({
                    documentId: x.documentId,
                    documentName: x.documentName,
                    referenceNumber: x.referenceNumber,
                    uploadDocument: x.uplodDocumet,
                })
            })

            let additionalDetails = await db.query(`
        SELECT * FROM eve_acc_additional_details_employee
        WHERE status='A' AND (:empId IS NULL OR empId=:empId) `, {
                replacements: {
                    empId: e.id || null
                },
                type: QueryTypes.SELECT
            })
            e.empAdditionalDetails = []
            additionalDetails.forEach(x => {
                e.empAdditionalDetails.push({
                    companyName: x.companyName,
                    companyFromDate: x.companyFromDate,
                    companyToDate: x.companyToDate,
                    totalWorkExprience: x.totalWorkExprience,
                    companyDesignationName: x.companyDesignationName,
                    companyDepartmentName: x.companyDepartmentName,
                })
            })

            let educationQua = await db.query(`
            SELECT * FROM eve_acc_emp_educational_qualification WHERE status='A' AND (:empId IS NULL OR empId=:empId)`, {
                replacements: {
                    empId: e.id || null
                },
                type: QueryTypes.SELECT
            })
            e.empEducationalQualificationDetails = []
            educationQua.forEach(x => {
                e.empEducationalQualificationDetails.push({
                    qualification: x.qualification,
                    boardUnivercity: x.boardUnivercity,
                    yearOfPassing: x.yearOfPassing,
                    percentage: x.percentage,
                    totalNumber: x.totalNumber,
                    specialSkill: x.specialSkill,
                })
            })




        }))
        let empList = getData.map((e, i) => ({
            'Sl. No.': e.slno,
            'Employee Code': e.employeeCode,
            'Biometric ID': e.biometricAttendanceId,
            'Employee Name': e.name,
            'Sub-Company': e.subCompanyName,
            'Branch': e.empBranchName,
            'Location': e.location,
            'Department': e.departmentName,
            'Sub Department': e.subDepartment,
            'Designation': e.designationNew,
            'Mobile No': e.contactNumber,
            'Email ID': e.personalEmail,
            'Joining Date': e.doj,
            'Status': e.status,
        }))


        return res.status(200).send({

            result: "success",
            recordedPerPage: limit,
            currentPage: pageNo,
            totalData: totalData,
            employee: myFunc.replaceEmptyValues(empList)
        })

    }

    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



//Excel Api

async function fetchData({ token,pageNo, limit, employeeCode, biometricAttendanceId, name, subCompanyId, branchId, location, departmentNameId, subDepartmentId, designationNewId, status, companyFromDate, companyToDate }) {

    try {
        const config = {

            headers: { 'Content-Type': 'application/json', 'x-cross-auth': token },
            method: 'POST',
            
            url:`${process.env.BASE_URL}/report/getEmpListExcel`,

            data: { token,pageNo, limit, employeeCode, biometricAttendanceId, name, subCompanyId, branchId, location, departmentNameId, subDepartmentId, designationNewId, status, companyFromDate, companyToDate }

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
            // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FCFCFC' } }

            row.height = 40

        });
    });
    headerRow.eachCell(cell => {
        // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C0C0C0' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }
        cell.font = { bold: true };

    });

    for (let i = 1; i <= 1000; i++) {
        const column = worksheet.getColumn(i);
        column.width = 20; // Set the desired width in characters
    }
    return workbook.xlsx
}

async function getEmpListExcelSheet(req, res) {
    try {
        let token = req.headers["x-cross-auth"] || req.query["x-cross-auth"]
        let pageNo = req.body.pageNo || req.query.pageNo
        let limit = req.body.limit || req.query.limit
        let employeeCode = req.body.employeeCode || req.query.employeeCode
        let biometricAttendanceId = req.body.biometricAttendanceId || req.query.biometricAttendanceId
        let name = req.body.name || req.query.name
        let subCompanyId = req.body.subCompanyId || req.query.subCompanyId
        let branchId = req.body.branchId || req.query.branchId
        let location = req.body.location || req.query.location
        let departmentNameId = req.body.departmentNameId || req.query.departmentNameId
        let subDepartmentId = req.body.subDepartmentId || req.query.subDepartmentId
        let designationNewId = req.body.designationNewId || req.query.designationNewId
        let status = req.body.status || req.query.status
        let companyFromDate = req.body.companyFromDate || req.query.companyFromDate
        let companyToDate = req.body.companyToDate || req.query.companyToDate



        let apiData = await fetchData({
            token,
            pageNo, limit, employeeCode, biometricAttendanceId, name, subCompanyId, branchId, location, departmentNameId, subDepartmentId, designationNewId, status, companyFromDate, companyToDate
        })

        let getExcel = createExcelFile(apiData)

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="employeeList.xlsx"`);

        (await getExcel).write(res)

    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports = { getEmpListExcel, getEmpListExcelSheet }










