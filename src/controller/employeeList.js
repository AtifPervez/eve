let sequelize = require("../config/db")
const { QueryTypes } = require('sequelize')
const moment = require('moment')



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


const getEmpList = async (req, res) => {
    try {
        const decodedToken = req.headerSession
        const userId = decodedToken.userId
        const companyId = decodedToken.companyId
        const branch_Id = decodedToken.branchId
        const mainUserId = decodedToken.mainUserId
        let db = sequelize(companyId)
      
        let data=req.body
        let {employeeCode,name,subCompanyId,companyFromDate,companyToDate,location,biometricAttendanceId,branchId,departmentNameId,subDepartmentId,designationNewId,status,doj}=data

        
        let countQuery = await db.query(
            `SELECT COUNT(*) AS total FROM eve_acc_employee 

            LEFT JOIN eve_hrm_employee_details ON eve_acc_employee.id = eve_hrm_employee_details.employeeId 

            WHERE (eve_acc_employee.status = 'A' OR eve_acc_employee.status = 'I')
             AND eve_acc_employee.employeeType='Blue Collar'

            AND (:subCompanyId IS NULL OR eve_acc_employee.employeeSubCompanyId = :subCompanyId) 
             AND (:employeeCode IS NULL OR eve_acc_employee.employeeCode = :employeeCode) 
            -- AND (:name IS NULL OR eve_acc_employee.employeeName = :name)
            AND (:name IS NULL OR REPLACE(eve_acc_employee.employeeName, '  ', ' ') = REPLACE(:name, '  ', ' '))
            AND (:location IS NULL OR eve_acc_employee.locationID = :location)
            AND (:biometricAttendanceId IS NULL OR eve_hrm_employee_details.biometricAttendanceId = :biometricAttendanceId)
            AND (:branchId IS NULL OR eve_acc_employee.employeeBranchId = :branchId)
            AND (:departmentNameId IS NULL OR eve_acc_employee.employeeDepartmentId = :departmentNameId)
            AND (:subDepartmentId IS NULL OR eve_acc_employee.employeeSubDepartmentId = :subDepartmentId)
            AND (:designationNewId IS NULL OR eve_acc_employee.employeeDesignationId = :designationNewId)
            AND (:status IS NULL 
                OR (:status = 'Active' 
                    AND eve_acc_employee.status = 'A') 
                    OR (:status = 'Inactive' AND eve_acc_employee.status = 'I')
                )

            AND (
                :companyFromDate IS NULL 
                OR (eve_acc_employee.employeeDoj >= STR_TO_DATE(:companyFromDate, '%d-%m-%Y')) 
                AND eve_acc_employee.employeeDoj <= CURDATE()
               )
            AND (:companyToDate IS NULL OR eve_acc_employee.employeeDoj <= STR_TO_DATE(:companyToDate, '%d-%m-%Y'))

            `,{
            replacements:{
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
            type: QueryTypes.SELECT }
        );

        const totalData = countQuery[0].total;
        if (totalData=== 0) {
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
            -- AND (:name IS NULL OR eve_acc_employee.employeeName = :name)
              AND (:name IS NULL OR REPLACE(eve_acc_employee.employeeName, '  ', ' ') = REPLACE(:name, '  ', ' '))
            AND (:location IS NULL OR eve_acc_employee.locationID = :location)
            AND (:biometricAttendanceId IS NULL OR eve_hrm_employee_details.biometricAttendanceId = :biometricAttendanceId)
            AND (:branchId IS NULL OR eve_acc_employee.employeeBranchId = :branchId)
            AND (:departmentNameId IS NULL OR eve_acc_employee.employeeDepartmentId = :departmentNameId)
            AND (:subDepartmentId IS NULL OR eve_acc_employee.employeeSubDepartmentId = :subDepartmentId)
            AND (:designationNewId IS NULL OR eve_acc_employee.employeeDesignationId = :designationNewId)
            AND (:status IS NULL OR (:status = 'Active' AND eve_acc_employee.status = 'A') OR (:status = 'Inactive' AND eve_acc_employee.status = 'I'))

            AND (
                 :companyFromDate IS NULL 
                 OR (eve_acc_employee.employeeDoj >= STR_TO_DATE(:companyFromDate, '%d-%m-%Y')) 
                 AND eve_acc_employee.employeeDoj <= CURDATE()
                )
            AND (:companyToDate IS NULL OR eve_acc_employee.employeeDoj <= STR_TO_DATE(:companyToDate, '%d-%m-%Y'))
           
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
            e.locationName=e.locationName===null?'':e.locationName
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


            return res.status(200).send({

                result: "success",
                recordedPerPage: limit,
                currentPage: pageNo,
                totalData: totalData,
                employee: getData
            })
        }
    

    catch (error) {
        return res.status(500).send({ status: false, msg: error.message,err:error.stack })
    }
}

module.exports = { getEmpList }





















































// let sequelize = require("../config/db")
// const { QueryTypes, NUMBER } = require('sequelize')
// const phpUnserialize = require('php-serialize');
// const moment = require('moment')
// const axios = require('axios')
// const ExcelJS = require('exceljs');
// const { getLocationNameById } = require("../functions/functions");


// const departmentNameByDepartmentId = async (id, db) => {
//     let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subDepartment[0]) {
//         let res = Object.values(subDepartment[0])
//         let newRes = res.toString()
//         return newRes
//     }
// }
// const getEmployeeNameById = async (id, db) => {
//     let employeeName = await db.query('select employeeName  from eve_acc_employee where id=:id', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })

//     if (employeeName[0]) {

//         let res = Object.values(employeeName[0])
//         let newRes = (res.toString());
//         return newRes
//     }
// }


// const getBranchNameByBranchId = async (id, db) => {
//     let branchName = await db.query('select branchName  from eve_acc_company_branch where branchId=:branchId && status="A"', {
//         replacements: {
//             branchId: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (branchName[0]) {

//         let res = Object.values(branchName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }
// const getDesignationNameById = async (id, db) => {
//     let designationName = await db.query('select name  from eve_acc_designation where id=:id && status="A"', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     }
//     )

//     if (designationName[0]) {
//         let res = Object.values(designationName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }

// const getSubCompanyNameById = async (id, db) => {
//     let subCompanyName = await db.query('select companyName from eve_acc_subCompany where id=:id && status="A"', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subCompanyName[0]) {
//         let res = Object.values(subCompanyName[0])
//         let newRes = (res.toString())
//         return newRes
//     }
// }
// const getSubDepartmentNameBySubDepartmentId = async (id, db) => {
//     let subDepartment = await db.query('select name from eve_acc_department where id=:id && status="A" ', {
//         replacements: {
//             id: id,
//         },
//         type: QueryTypes.SELECT
//     })
//     if (subDepartment[0]) {
//         let res = Object.values(subDepartment[0])
//         let newRes = res.toString()
//         return newRes
//     }
// }


// const getEmpList = async (req, res) => {
//     try {
//         const decodedToken = req.headerSession
//         const userId = decodedToken.userId
//         const companyId = decodedToken.companyId
//         const branchId = decodedToken.branchId
//         const mainUserId = decodedToken.mainUserId
//         let db = sequelize(companyId)
//         const companyFromDate = req.body.companyFromDate
//         const companyToDate = req.body.companyToDate
//         let getData = await db.query(
//             `SELECT DISTINCT 
//                 eve_acc_employee.id,
//                 eve_acc_employee.employeeCode,
//                 eve_acc_employee.employeeName AS name,
//                 eve_acc_employee.employeeAddress AS address,
//                 eve_acc_employee.employeePincode AS pincode,
//                 eve_hrm_employee_details.personalEmail AS email,
//                 eve_hrm_employee_details.contactNumber AS mobile,
//                 eve_acc_employee.employeeGender AS gender,
//                 eve_acc_employee.employeeDob AS dob,
//                 eve_acc_employee.employeeDoj AS doj,
//                 eve_acc_employee.employeeDesignationId AS designationNew,
//                 eve_acc_employee.employeeDesignationId AS designationNewId,
//                 eve_acc_employee.employeeDepartmentid AS departmentName,
//                 eve_acc_employee.employeeDepartmentid AS departmentNameId,
//                 eve_acc_employee.employeeSubDepartmentId AS subDepartment,
//                 eve_acc_employee.employeeSubCompanyId AS subCompanyId,
//                 eve_acc_employee.employeeSubcompanyId AS subCompanyName,
//                 eve_acc_employee.employeeBranchId AS empBranchName,
//                 eve_acc_employee.createdDate AS date,
//                 eve_acc_employee.id AS employeeId,
//                 eve_hrm_employee_details.biometricAttendanceId,
//                 eve_hrm_employee_details.isBonusApplicable,
//                 eve_hrm_employee_details.isESICApplicable,
//                 eve_hrm_employee_details.isLabourLawApplicable,
//                 eve_hrm_employee_details.isOvertimeApplicable,
//                 eve_hrm_employee_details.attendanceType AS haveAttendanceType,
//                 eve_acc_employee.locationID AS location,
//                 location.location AS locationName,
//                 eve_acc_employee.firstPaymentStatus AS madePayment,
                
//                 eve_acc_employee.employeeBranchId AS branchId,
//                 eve_acc_employee.status,
//                 eve_acc_employee.employeeSubDepartmentId AS subDepartmentId,
//                 eve_acc_employee.employeeType,
//                 eve_acc_employee.workerType,
//                 eve_acc_employee.workSkill,
//                 eve_acc_employee.employeeDesignationSince,
//                 eve_acc_employee.employeeCostCenterDivision,
//                 eve_acc_employee.employeeGender,
//                 eve_acc_employee.loginThrough,
//                 eve_acc_employee.employeeESIC,
//                 eve_acc_employee.employeeUAN,
//                 eve_acc_employee.bankName,
//                 eve_acc_employee.accNumber,
//                 eve_acc_employee.accountName,
//                 eve_acc_employee.branchName,
//                 eve_acc_employee.IFSCnum,
//                 eve_acc_employee.upiId,
//                 eve_acc_employee.nationality,
//                 eve_acc_employee.employeeUsername,
//                 eve_acc_employee.parmanentAddress,
//                 eve_acc_employee.employeeProfilePic,
//                 eve_hrm_employee_details.fatherName,
//                 eve_hrm_employee_details.motherName,
//                 eve_hrm_employee_details.spouseName,
//                 eve_hrm_employee_details.alternateContactNo,
//                 eve_hrm_employee_details.emgContactNo,
//                 eve_hrm_employee_details.personalEmail,
//                 eve_hrm_employee_details.maritalStatus,
//                 eve_hrm_employee_details.bloodGroup,
//                 eve_hrm_employee_details.contactNumber,
//                 eve_hrm_employee_details.referenceMangerSource,
//                 eve_hrm_employee_details.contractDtaeFrom,
//                 eve_hrm_employee_details.contractPeriodOfMonth,
//                 eve_hrm_employee_details.contractDateTo,
//                 eve_hrm_employee_details.superVisorReportingManger1,
//                 eve_hrm_employee_details.superVisorReportingManger2,
//                 eve_hrm_employee_details.superVisorReportingManger3,
//                 eve_hrm_employee_details.guardiansName,
//                 eve_hrm_employee_details.guardianRelationship,
//                 eve_hrm_employee_details.guardiansAddress,
//                 eve_hrm_employee_details.guardiansContactNo,
//                 eve_hrm_employee_details.gurdianPincode,
//                 eve_hrm_employee_details.emergencyContactAddress,
//                 eve_hrm_employee_details.emergencyContactRelationship,
//                 eve_hrm_employee_details.emergencyContactName,
//                 eve_hrm_employee_details.emergencyPincode,
//                 eve_hrm_employee_details.empDate,
//                 eve_acc_employee.formBlue_Status
//             FROM 
//                 eve_acc_employee 
//             LEFT JOIN 
//                 eve_hrm_employee_details ON eve_acc_employee.id = eve_hrm_employee_details.employeeId
//             LEFT JOIN 
//                 eve_acc_employee_salary ON eve_acc_employee.id = eve_acc_employee_salary.employeeId
//             LEFT JOIN 
//                 eve_hrm_employee_type_master ON eve_acc_employee.id = eve_hrm_employee_type_master.employeeId
//             LEFT JOIN 
//                 eve_acc_user_type ON eve_acc_employee.employeeSubCompanyId = eve_acc_user_type.companyId
           
//             LEFT JOIN 
//                 eve_acc_company_branch ON eve_acc_employee.employeeBranchId = eve_acc_company_branch.branchId
//             LEFT JOIN 
//                 eve_hrm_employee_status_details ON eve_acc_employee.id = eve_hrm_employee_status_details.empId
//             LEFT JOIN 
//                 eve_acc_locationmaster AS location ON eve_acc_employee.locationID = location.id
//             LEFT JOIN 
//                 eve_acc_add_employee_upload_document AS empDoc ON eve_acc_employee.id = empDoc.empId
//             WHERE 
//                 (eve_acc_employee.status = 'A' OR eve_acc_employee.status = 'I')
//                 AND (:companyFromDate IS NULL OR DATE_FORMAT(eve_acc_employee.employeeDoj, '%d-%m-%Y') >= :companyFromDate)
//             `,
//             { replacements: {
//                 companyFromDate:companyFromDate,
//             }, type: QueryTypes.SELECT }
//         );
//         console.log(getData);
        


//         await Promise.all(getData.map(async (e, index) => {
//             e.locationName=e.locationName===null?'':e.locationName
//             if (getData[index].attendanceType != '')
//                 e.haveAttendanceType = "yes"
//             else {
//                 e.haveAttendanceType = "no"
//             }
//             e.hasSalary = 'no'
//             e.subscription = ''
//             if (e.subCompanyId != null) {
//                 e.subCompanyId = (e.subCompanyId).toString()

//             }
//             e.name=e.name===null?'':e.name
//             e.employeeId=(e.employeeId).toString()
//             if (e.subDepartment != '' && e.subDepartment != null) {
//                 e.subDepartment = await getSubDepartmentNameBySubDepartmentId(e.subDepartment, db)
//             }
//             if (e.departmentName != '' && e.departmentName != null) {
//                 e.departmentName = await departmentNameByDepartmentId(e.departmentName, db)
//             }
//             if (e.empBranchName != '' && e.empBranchName != null) {
//                 e.empBranchName = await getBranchNameByBranchId(e.empBranchName, db)
//             }
//             if (!e.empBranchName) {
//                 e.empBranchName = ''
//             }
//             if (e.subCompanyName != null) {
//                 e.subCompanyName = await getSubCompanyNameById(e.subCompanyName, db)
//             }
//             if (!e.subCompanyName) {
//                 e.subCompanyName = ''
//             }
//             if (e.designationNew != '' && e.designationNew != null) {
//                 e.designationNew = await getDesignationNameById(e.designationNew, db)
//             }
//             if (!e.designationNew) {
//                 e.designationNew = ''
//             }

//             if (e.status == 'A') {
//                 e.status = 'Active'
//             }
//             if (e.status == 'I') {
//                 e.status = "Inactive"
//             }
           
           
//             e.doj = moment(e.doj,'YYYY-MM-DD').format('DD-MM-YYYY');
            
//             if (e.doj == 'Invalid date') {
//                 e.doj = ''
//             }
//             else {
//             }
//         }))

       

//         let startDate = moment(companyFromDate, 'DD-MM-YYYY')
//         let endDate = moment(companyToDate, 'DD-MM-YYYY')

//         const filteredEmployees = getData.filter(employee => {
//             const doj = moment(employee.doj, 'DD-MM-YYYY', true);
//             return (doj.isSameOrAfter(moment(startDate)) && doj.isSameOrBefore(moment(endDate)))
//         });


//         let eve_acc_add_employee_upload_document = await db.query('select * from eve_acc_add_employee_upload_document where status="A"', {
//             replacements: {}, type: QueryTypes.SELECT
//         })



//         getData.map((e, i) => {
//             e.uploadDocumentDetails = []

//             eve_acc_add_employee_upload_document.map((x, j) => {
//                 if (e.id == x.empId) {
//                     e.uploadDocumentDetails.push({
//                         documentId: x.documentId,
//                         documentName: x.documentName,
//                         referenceNumber: x.referenceNumber,
//                         uploadDocument: x.uplodDocumet,
//                     })
//                 }
//             })
//         })

//         let eve_acc_additional_details_employee = await db.query('select * from eve_acc_additional_details_employee where status="A"', {
//             replacements: {}, type: QueryTypes.SELECT
//         })
//         getData.map((e, i) => {
//             e.empAdditionalDetails = []
//             eve_acc_additional_details_employee.map((x, j) => {
//                 if (e.id == x.empId) {
//                     e.empAdditionalDetails.push({
//                         companyName: x.companyName,
//                         companyFromDate: x.companyFromDate,
//                         companyToDate: x.companyToDate,
//                         totalWorkExprience: x.totalWorkExprience,
//                         companyDesignationName: x.companyDesignationName,
//                         companyDepartmentName: x.companyDepartmentName,
//                     })
//                 }
//             })
//         })


//         let eve_acc_emp_educational_qualification = await db.query('select * from eve_acc_emp_educational_qualification where status="A"', {
//             replacements: {}, type: QueryTypes.SELECT
//         })
//         getData.map((e, i) => {
//             e.empEducationalQualificationDetails = []
//             eve_acc_emp_educational_qualification.map((x, j) => {
//                 if (e.id == x.empId) {
//                     e.empEducationalQualificationDetails.push({
//                         qualification: x.qualification,
//                         boardUnivercity: x.boardUnivercity,
//                         yearOfPassing: x.yearOfPassing,
//                         percentage: x.percentage,
//                         totalNumber: x.totalNumber,
//                         specialSkill: x.specialSkill,
//                     })
//                 }
//             })
//         })




//         let searchData = {
//             employeeCode: req.body.employeeCode || req.query.employeeCode,
//             name: req.body.name,
//             biometricAttendanceId: req.body.biometricAttendanceId,

//             subCompanyId: req.body.subCompanyId,

//             branchId: req.body.branchId,

//             location: req.body.location,

//             departmentNameId: req.body.departmentNameId,

//             subDepartmentId: req.body.subDepartmentId,
//             designationNewId: req.body.designationNewId,
//             status: req.body.status,
//             doj: req.body.doj,
          
//         }


//         let searchEmp = getData.filter((e, i) => {
//             let boo = true
//             for (let key in searchData) {
//                 if (searchData[key] && searchData[key] != e[key]) {
//                     boo = false
//                     break
//                 }
//             }
//             return boo
//         })




//         searchEmp.sort((a, b) => a.name.localeCompare(b.name));
//         let limit = parseInt(req.body.limit) || getData.length
//         let pageNo = parseInt(req.body.pageNo) || 1
//         let startIndex = (pageNo - 1) * limit;
//         let endIndex = startIndex + limit;
//         // let paginatedData = getData.slice(startIndex, endIndex);
//         let paginatedData = searchEmp.slice(startIndex, endIndex);
//         // let paginatedData = empList.slice(startIndex, endIndex);

//         if (paginatedData.length == 0) {
//             return res.status(404).send({ status: false, msg: 'no data found', totalData: 0 })
//         }

//         if (!companyFromDate && !companyToDate) {

//             searchEmp.map((e, i) => {
//                 e.slno = Number(i + 1)
             
//             })
//         }



//         if (searchData.employeeCode || searchData.name || searchData.biometricAttendanceId || searchData.subCompanyId || searchData.branchId || searchData.location || searchData.departmentNameId || searchData.subDepartmentId || searchData.designationNewId || searchData.status || searchData.companyFromDate || searchData.companyToDate) {
//             searchEmp.sort((a, b) => a.name.localeCompare(b.name));
//             return res.status(200).send({
//                 result: "success",
//                 recordedPerPage: limit,
//                 currentPage: pageNo,
//                 totalData: searchEmp.length,
//                 // totalData: paginatedData.length,
//                 // listingData:paginatedData.length,
//                 employee: paginatedData
//             })
//         }
//         else if (companyFromDate, companyToDate) {
//             filteredEmployees.sort((a, b) => a.name.localeCompare(b.name));
//             filteredEmployees.map((e, i) => {
//                 e.slno = Number(i + 1)
//             })
//             let limit = parseInt(req.body.limit) || getData.length
//             let pageNo = parseInt(req.body.pageNo) || 1
//             let startIndex = (pageNo - 1) * limit;
//             let endIndex = startIndex + limit;
//             let paginatedData = filteredEmployees.slice(startIndex, endIndex);



//             if (paginatedData.length == 0) {
//                 return res.status(404).send({ status: false, msg: 'no data found', totalData: 0 })
//             }
//             return res.status(200).send({
//                 result: "success",
//                 recordedPerPage: limit,
//                 currentPage: pageNo,
//                 totalData: filteredEmployees.length,
//                 employee: paginatedData
//             })
//         }
//         else {
//             return res.status(200).send({

//                 result: "success",
//                 recordedPerPage: limit,
//                 currentPage: pageNo,
//                 totalData: getData.length,
//                 // totalData: paginatedData.length,
//                 // listingData:paginatedData.length,
//                 employee: paginatedData
//             })
//         }
      
//     }

//     catch (error) {
//         return res.status(500).send({ status: false, msg: error.message })
//     }
// }

// module.exports = { getEmpList }










